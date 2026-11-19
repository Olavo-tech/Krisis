import crypto from 'node:crypto';
import webpush from 'web-push';

const b64u = (buf) => Buffer.from(buf).toString('base64url');

// As chaves VAPID são derivadas de um segredo que já existe (não há chave nova para guardar).
export function vapid() {
  const seed = process.env.VAPID_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!seed) return null;
  const priv = crypto.createHmac('sha256', seed).update('krisis-vapid-v1').digest();
  const e = crypto.createECDH('prime256v1');
  e.setPrivateKey(priv);
  return { privateKey: b64u(priv), publicKey: b64u(e.getPublicKey()) };
}

export async function sendPush(sub, payload) {
  const k = vapid();
  if (!k) throw new Error('vapid_missing');
  webpush.setVapidDetails('https://krisis-seven.vercel.app', k.publicKey, k.privateKey);
  return webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, JSON.stringify(payload), { TTL: 3600 });
}
