// /api/cron-remind — lembrete diário (Vercel Cron, 08h30 em Brasília). No máximo 1 vez a cada 20 h por usuário.
import { readEnv } from './_lib.js';
import { sendPush } from './_webpush.js';

const hdr = (cfg) => ({ 'Content-Type': 'application/json', apikey: cfg.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${cfg.SUPABASE_SERVICE_ROLE_KEY}` });

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) return res.status(401).json({ ok: false });
  const cfg = readEnv();
  if (!cfg) return res.status(500).json({ ok: false });

  const r = await fetch(`${cfg.SUPABASE_URL}/rest/v1/rpc/reminder_summary`, { method: 'POST', headers: hdr(cfg), body: '{}' });
  if (!r.ok) return res.status(500).json({ ok: false, step: 'summary' });
  const rows = await r.json();
  let sent = 0;
  for (const row of (rows || []).slice(0, 150)) {
    const parts = [];
    if (row.tasks_due) parts.push(row.tasks_due + (row.tasks_due === 1 ? ' tarefa' : ' tarefas'));
    if (row.cards_due) parts.push(row.cards_due + (row.cards_due === 1 ? ' cartão' : ' cartões'));
    if (!parts.length) continue;
    const sr = await fetch(`${cfg.SUPABASE_URL}/rest/v1/push_subscriptions?user_id=eq.${row.user_id}&select=id,endpoint,p256dh,auth`, { headers: hdr(cfg) });
    const subs = sr.ok ? await sr.json() : [];
    for (const s of subs) {
      try {
        await sendPush(s, { title: 'Hora de estudar?', body: 'Você tem ' + parts.join(' e ') + ' esperando. O Tuck já separou tudo.', url: row.tasks_due ? '/#/tarefas' : '/#/cartoes', tag: 'diario' });
        await fetch(`${cfg.SUPABASE_URL}/rest/v1/push_subscriptions?id=eq.${s.id}`, { method: 'PATCH', headers: hdr(cfg), body: JSON.stringify({ last_sent: new Date().toISOString() }) });
        sent++;
      } catch (e) {
        if (e && (e.statusCode === 404 || e.statusCode === 410)) await fetch(`${cfg.SUPABASE_URL}/rest/v1/push_subscriptions?id=eq.${s.id}`, { method: 'DELETE', headers: hdr(cfg) });
      }
    }
  }
  return res.status(200).json({ ok: true, sent });
}
