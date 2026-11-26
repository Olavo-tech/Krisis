// Helpers compartilhados das funções de IA (arquivos com _ não viram rotas na Vercel).
const STATIC_ORIGINS = new Set([
  'https://krisis-seven.vercel.app',
  ...String(process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean)
]);

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (STATIC_ORIGINS.has(origin)) return true;
  return /^https:\/\/krisis[a-z0-9-]*\.vercel\.app$/i.test(origin);
}

// Retorna true quando a resposta já foi enviada (CORS, OPTIONS ou método inválido).
export function applyCors(req, res) {
  const origin = req.headers.origin || '';
  if (origin && !isAllowedOrigin(origin)) {
    res.status(403).json({ ok: false, code: 'ORIGIN_NOT_ALLOWED', message: 'Origem não autorizada.' });
    return true;
  }
  if (origin) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method === 'OPTIONS') { res.status(204).end(); return true; }
  if (req.method !== 'POST') { res.status(405).json({ ok: false, code: 'METHOD_NOT_ALLOWED', message: 'Método não permitido.' }); return true; }
  return false;
}

export function readEnv() {
  const GROQ_API_KEY = process.env.GROQ_API_KEY?.trim();
  const SUPABASE_URL = process.env.SUPABASE_URL?.trim().replace(/\/+$/, '');
  const serverKey = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)?.trim();
  const authKey = (process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY)?.trim() || serverKey;
  if (!GROQ_API_KEY || !SUPABASE_URL || !serverKey) return null;
  return { GROQ_API_KEY, SUPABASE_URL, serverKey, authKey };
}

export async function getUserId(cfg, req) {
  const token = (req.headers.authorization || '').match(/^Bearer\s+(.+)$/i)?.[1].trim();
  if (!token) return null;
  const r = await fetch(`${cfg.SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: cfg.authKey, Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(5000)
  });
  if (r.status === 400 || r.status === 401 || r.status === 403) {
    const body = await r.json().catch(() => null);
    if (body?.message === 'Invalid API key') throw new Error('auth api key rejected');
    return null;
  }
  if (!r.ok) throw new Error('auth status ' + r.status);
  const user = await r.json();
  return user?.id || null;
}

function rpcHeaders(cfg) {
  const headers = { 'Content-Type': 'application/json', apikey: cfg.serverKey };
  if (!cfg.serverKey.startsWith('sb_secret_')) headers.Authorization = `Bearer ${cfg.serverKey}`;
  return headers;
}

// freeLimit = 0 bloqueia o plano grátis (recurso exclusivo do Plus).
export async function consumeQuota(cfg, userId, feature, freeLimit, plusLimit) {
  const r = await fetch(`${cfg.SUPABASE_URL}/rest/v1/rpc/consume_ai_quota`, {
    method: 'POST', headers: rpcHeaders(cfg), signal: AbortSignal.timeout(5000),
    body: JSON.stringify({ p_user_id: userId, p_feature: feature, p_free_limit: freeLimit, p_plus_limit: plusLimit })
  });
  if (!r.ok) throw new Error('quota rpc ' + r.status);
  const d = await r.json();
  const row = Array.isArray(d) ? d[0] : d;
  if (!row || typeof row.allowed !== 'boolean') throw new Error('quota bad shape');
  return { allowed: row.allowed, remaining: Number(row.remaining || 0), plan: row.plan === 'plus' ? 'plus' : 'free' };
}

export async function refundQuota(cfg, userId, feature) {
  try {
    const response = await fetch(`${cfg.SUPABASE_URL}/rest/v1/rpc/refund_ai_quota`, {
      method: 'POST', headers: rpcHeaders(cfg), signal: AbortSignal.timeout(4000),
      body: JSON.stringify({ p_user_id: userId, p_feature: feature })
    });
    if (response.ok) return true;
    console.error('[ai] devolução da cota:', response.status, feature);
  } catch (error) {
    console.error('[ai] devolução da cota:', error.name, feature);
  }
  return false;
}

const DEFAULT_MODELS = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'llama-3.3-70b-versatile'];

export async function groqJson(apiKey, system, user, validate) {
  const configured = (process.env.GROQ_MODELS || '').split(',').map((model) => model.trim()).filter(Boolean);
  const models = new Set([...configured, ...DEFAULT_MODELS]);
  const deadline = Date.now() + 35000;
  const failures = [];
  for (const model of models) {
    const budget = Math.min(15000, deadline - Date.now());
    if (budget <= 0) break;
    const reasoning = /^openai\/gpt-oss/i.test(model);
    const body = {
      model, temperature: 0.2, response_format: { type: 'json_object' },
      max_completion_tokens: reasoning ? 6000 : 3500,
      ...(reasoning ? { reasoning_effort: 'low', include_reasoning: false } : {}),
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }]
    };
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST', signal: AbortSignal.timeout(budget),
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(body)
      });
      if (!response.ok) {
        failures.push(model + ' HTTP ' + response.status);
        if (response.status === 401 || response.status === 403) break;
        continue;
      }
      const completion = await response.json();
      const raw = completion?.choices?.[0]?.message?.content || '';
      const parsed = JSON.parse(raw.replace(/^\s*```(?:json)?\s*|\s*```\s*$/gi, ''));
      const data = parsed && typeof parsed === 'object' && !Array.isArray(parsed) && validate(parsed);
      if (data) return { data, model };
      failures.push(model + ' formato inválido');
    } catch (error) {
      failures.push(model + ' ' + error.name);
    }
  }
  console.error('[ai] Groq:', failures.join(' | '));
  throw new Error('ai_failed');
}

/* ---- Leitura segura de páginas web (bloqueia endereços internos, inclusive em redirecionamentos) ---- */
function isPrivateHost(hostname) {
  const h = String(hostname || '').toLowerCase().replace(/^\[|\]$/g, '');
  if (!h || h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h.endsWith('.internal')) return true;
  if (h === '::1' || h.startsWith('fc') || h.startsWith('fd') || h.startsWith('fe80')) return true;
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a >= 224;
  }
  return !h.includes('.');
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ').replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/\s+/g, ' ').trim();
}

export async function fetchPage(startUrl) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), 11000);
  try {
    let current = startUrl, resp = null;
    for (let hop = 0; hop <= 3; hop++) {
      let parsed;
      try { parsed = new URL(current); } catch (_) { return { ok: false, reason: 'O link informado é inválido.' }; }
      if (!/^https?:$/.test(parsed.protocol) || isPrivateHost(parsed.hostname)) return { ok: false, reason: 'Este endereço não pode ser acessado. Use um link público ou cole o texto.' };
      resp = await fetch(parsed.toString(), { signal: ctrl.signal, redirect: 'manual', headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36', Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8', 'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8' } });
      if (resp.status >= 300 && resp.status < 400 && resp.headers.get('location')) { current = new URL(resp.headers.get('location'), parsed).toString(); continue; }
      break;
    }
    if (!resp || !resp.ok) return { ok: false, reason: 'O site respondeu com erro. Cole o texto da página ou envie o PDF.' };
    const ct = (resp.headers.get('content-type') || '').toLowerCase();
    if (ct.includes('application/pdf')) return { ok: false, reason: 'Este link é um PDF. Baixe e anexe o arquivo.' };
    const text = stripHtml((await resp.text()).slice(0, 2000000));
    if (text.length < 250 || /access denied|captcha|enable javascript|cloudflare/i.test(text.slice(0, 600))) return { ok: false, reason: 'Este site bloqueia leitura automática. Copie o texto e cole aqui.' };
    return { ok: true, text: text.slice(0, 14000) };
  } catch (_) {
    return { ok: false, reason: 'Não foi possível acessar este link. Copie o texto e cole aqui.' };
  } finally { clearTimeout(id); }
}
