// /api/icon?s=192 — ícone PNG do app (rosto do Tuck), gerado sem bibliotecas.
import zlib from 'node:zlib';

const T = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = (b) => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = T[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

const YELLOW = [255, 225, 88], BLACK = [11, 11, 15], WHITE = [255, 255, 255];
function shade(u, v) {
  const d = (cx, cy) => Math.hypot(u - cx, v - cy);
  // brilho dos olhos
  if (d(0.335, 0.435) < 0.026 || d(0.655, 0.435) < 0.026) return WHITE;
  // pupilas
  if (d(0.35, 0.47) < 0.078 || d(0.67, 0.47) < 0.078) return BLACK;
  // olhos
  if (d(0.35, 0.45) < 0.15 || d(0.67, 0.45) < 0.15) return WHITE;
  // sorriso
  const r = d(0.51, 0.62);
  if (r > 0.1 && r < 0.13 && v > 0.64 && Math.abs(u - 0.51) < 0.11) return BLACK;
  // brotinho
  if (d(0.5, 0.17) < 0.045) return BLACK;
  return YELLOW;
}

export default function handler(req, res) {
  const s = Math.min(512, Math.max(48, parseInt(req.query.s, 10) || 192));
  const SS = 2;
  const rows = [];
  for (let y = 0; y < s; y++) {
    const row = Buffer.alloc(1 + s * 4);
    for (let x = 0; x < s; x++) {
      let r = 0, g = 0, b = 0;
      for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
        const c = shade((x + (sx + 0.5) / SS) / s, (y + (sy + 0.5) / SS) / s);
        r += c[0]; g += c[1]; b += c[2];
      }
      const o = 1 + x * 4;
      row[o] = r / (SS * SS); row[o + 1] = g / (SS * SS); row[o + 2] = b / (SS * SS); row[o + 3] = 255;
    }
    rows.push(row);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(s, 0); ihdr.writeUInt32BE(s, 4); ihdr[8] = 8; ihdr[9] = 6;
  const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(Buffer.concat(rows))), chunk('IEND', Buffer.alloc(0))]);
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.status(200).send(png);
}
