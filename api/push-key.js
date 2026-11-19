import { vapid } from './_webpush.js';

export default function handler(req, res) {
  const k = vapid();
  if (!k) return res.status(500).json({ ok: false });
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.status(200).json({ ok: true, key: k.publicKey });
}
