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
  const { GROQ_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!GROQ_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return { GROQ_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY };
}

export async function getUserId(cfg, req) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7).trim() : '';
  if (!token) return null;
  try {
    const r = await fetch(`${cfg.SUPABASE_URL}/auth/v1/user`, { headers: { apikey: cfg.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${token}` } });
    if (!r.ok) return null;
    const u = await r.json();
    return u && u.id ? u.id : null;
  } catch (_) { return null; }
}

const rpcHeaders = (cfg) => ({ 'Content-Type': 'application/json', apikey: cfg.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${cfg.SUPABASE_SERVICE_ROLE_KEY}` });

// freeLimit = 0 bloqueia o plano grátis (recurso exclusivo do Plus).
export async function consumeQuota(cfg, userId, feature, freeLimit, plusLimit) {
  const r = await fetch(`${cfg.SUPABASE_URL}/rest/v1/rpc/consume_ai_quota`, {
    method: 'POST', headers: rpcHeaders(cfg),
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
    await fetch(`${cfg.SUPABASE_URL}/rest/v1/rpc/refund_ai_quota`, { method: 'POST', headers: rpcHeaders(cfg), body: JSON.stringify({ p_user_id: userId, p_feature: feature }) });
  } catch (_) { /* melhor esforço */ }
}

const DEFAULT_MODELS = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b'];

function parseJson(raw) {
  try { return JSON.parse(raw); } catch (_) {
    const m = String(raw || '').match(/\{[\s\S]*\}/);
    if (!m) return null;
    try { return JSON.parse(m[0]); } catch (_e) { return null; }
  }
}

// Chama a Groq pedindo JSON; tenta os modelos em ordem. Lança erro se todos falharem.
export async function groqJson(apiKey, system, user) {
  const fromEnv = String(process.env.GROQ_MODELS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const models = fromEnv.length ? fromEnv : DEFAULT_MODELS;
  const errors = [];
  for (const model of models) {
    try {
      const body = { model, temperature: 0.3, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] };
      if (/^openai\/gpt-oss/i.test(model)) { body.reasoning_effort = 'low'; body.max_completion_tokens = 6000; } else { body.max_tokens = 3500; }
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }, body: JSON.stringify(body) });
      if (!r.ok) { const t = await r.text(); errors.push(`HTTP ${r.status} ${model}: ${t.slice(0, 120)}`); if (r.status === 401 || r.status === 403) break; continue; }
      const j = await r.json();
      const parsed = parseJson(j?.choices?.[0]?.message?.content || '');
      if (parsed) return { data: parsed, model };
      errors.push(`JSON inválido (${model})`);
    } catch (e) { errors.push(`${model}: ${e && e.message}`); }
  }
  console.error('[ai] falha:', errors.join(' | '));
  throw new Error('ai_failed');
}
