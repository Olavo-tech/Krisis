// /api/icon?s=192 — ícone PNG do app: o rosto do pato (logo Eduquack), gerado sem bibliotecas.
import zlib from 'node:zlib';

const T = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = (b) => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = T[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

const YEL = [253, 212, 30], BLK = [17, 17, 17], OR = [244, 123, 32], ORD = [197, 90, 21];
// olho em pílula (retângulo com pontas redondas)
const pill = (u, v, cx, cy, hw, hh) => { const dy = Math.max(0, Math.abs(v - cy) - (hh - hw)); return Math.hypot(u - cx, dy) < hw; };
function shade(u, v) {
  if (pill(u, v, 0.31, 0.386, 0.038, 0.064) || pill(u, v, 0.6875, 0.386, 0.038, 0.064)) return BLK;
  if (Math.hypot((u - 0.5) / 0.235, (v - 0.575) / 0.092) < 1) return OR;
  if (Math.hypot((u - 0.5) / 0.225, (v - 0.598) / 0.098) < 1) return ORD;
  return YEL;
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
