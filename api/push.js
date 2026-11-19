// /api/push — inscreve, remove e testa notificações do usuário.
import { applyCors, readEnv, getUserId } from './_lib.js';
import { sendPush } from './_webpush.js';

const hdr = (cfg) => ({ 'Content-Type': 'application/json', apikey: cfg.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${cfg.SUPABASE_SERVICE_ROLE_KEY}` });

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  const cfg = readEnv();
  if (!cfg) return res.status(500).json({ ok: false, message: 'Servidor não configurado.' });
  const userId = await getUserId(cfg, req);
  if (!userId) return res.status(401).json({ ok: false, message: 'Entre na sua conta.' });
  const b = req.body || {};

  if (b.action === 'subscribe') {
    const s = b.subscription || {};
    const endpoint = String(s.endpoint || ''), p256dh = String(s.keys && s.keys.p256dh || ''), auth = String(s.keys && s.keys.auth || '');
    if (!/^https:\/\//.test(endpoint) || endpoint.length > 700 || !p256dh || p256dh.length > 200 || !auth || auth.length > 100) return res.status(400).json({ ok: false, message: 'Inscrição inválida.' });
    const r = await fetch(`${cfg.SUPABASE_URL}/rest/v1/push_subscriptions?on_conflict=endpoint`, { method: 'POST', headers: { ...hdr(cfg), Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ user_id: userId, endpoint, p256dh, auth }) });
    if (!r.ok) return res.status(500).json({ ok: false, message: 'Não foi possível salvar agora.' });
    return res.status(200).json({ ok: true });
  }

  if (b.action === 'unsubscribe') {
    const endpoint = String(b.endpoint || '');
    if (!endpoint) return res.status(400).json({ ok: false });
    await fetch(`${cfg.SUPABASE_URL}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}&user_id=eq.${userId}`, { method: 'DELETE', headers: hdr(cfg) });
    return res.status(200).json({ ok: true });
  }

  if (b.action === 'test') {
    const r = await fetch(`${cfg.SUPABASE_URL}/rest/v1/push_subscriptions?user_id=eq.${userId}&select=id,endpoint,p256dh,auth`, { headers: hdr(cfg) });
    const subs = r.ok ? await r.json() : [];
    let sent = 0;
    for (const s of subs) {
      try { await sendPush(s, { title: 'Krispim', body: 'Oi! Se você está vendo isso, os lembretes estão funcionando.', url: '/#/hoje', tag: 'teste' }); sent++; }
      catch (e) { if (e && (e.statusCode === 404 || e.statusCode === 410)) await fetch(`${cfg.SUPABASE_URL}/rest/v1/push_subscriptions?id=eq.${s.id}`, { method: 'DELETE', headers: hdr(cfg) }); }
    }
    return res.status(200).json({ ok: sent > 0, sent, message: sent ? '' : 'Nenhum dispositivo ativo. Ative os lembretes de novo.' });
  }
  return res.status(400).json({ ok: false, message: 'Ação inválida.' });
}
