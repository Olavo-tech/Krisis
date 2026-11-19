// /api/icon?s=192 — ícone PNG do app (o Tuck), gerado sem bibliotecas.
import zlib from 'node:zlib';

const T = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = (b) => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = T[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

const BG = [27, 23, 64], YEL = [255, 210, 31], OR = [255, 138, 31], BLK = [27, 26, 34], WHITE = [255, 255, 255], CAP = [31, 31, 38], RED = [214, 51, 75];
function shade(u, v) {
  const d = (cx, cy) => Math.hypot(u - cx, v - cy);
  if (d(0.415, 0.455) < 0.012 || d(0.585, 0.455) < 0.012) return WHITE;
  if (Math.hypot((u - 0.43) / 0.032, (v - 0.47) / 0.044) < 1 || Math.hypot((u - 0.57) / 0.032, (v - 0.47) / 0.044) < 1) return BLK;
  if (Math.hypot((u - 0.5) / 0.15, (v - 0.585) / 0.075) < 1) return OR;
  if (d(0.235, 0.4) < 0.032 || (Math.abs(u - 0.235) < 0.008 && v > 0.27 && v < 0.4)) return RED;
  if (Math.abs(u - 0.5) / 0.29 + Math.abs(v - 0.27) / 0.085 < 1) return CAP;
  if (u > 0.385 && u < 0.615 && v > 0.27 && v < 0.35) return CAP;
  if (d(0.5, 0.5) < 0.3) return YEL;
  return BG;
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
