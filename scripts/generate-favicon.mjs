/**
 * Generates apps/web/src/app/favicon.ico from the brand mark (no external deps).
 * The ICO embeds PNG-compressed 16x16 and 32x32 rasterizations of the same
 * "neural focus" glyph as src/app/icon.svg. Run: node scripts/generate-favicon.mjs
 */
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, "..", "apps", "web", "src", "app", "favicon.ico");

const BG = [13, 124, 104]; // brand-600 #0d7c68
const FG = [255, 255, 255];

// distance from point to line segment
function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  let t = lenSq === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function insideRoundedRect(x, y, x0, y0, w, h, r) {
  if (x < x0 || x >= x0 + w || y < y0 || y >= y0 + h) return false;
  const cx = Math.max(x0 + r, Math.min(x, x0 + w - r));
  const cy = Math.max(y0 + r, Math.min(y, y0 + h - r));
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}

/** 4x4 supersampled coverage test of the brand mark at size×size. */
function coverage(x, y, size) {
  const s = size / 32; // glyph coordinate scale
  const circles = [
    [10 * s, 11 * s, 3 * s, 1],
    [22 * s, 10 * s, 2.4 * s, 0.75],
    [23 * s, 21 * s, 2.8 * s, 0.9],
  ];
  const segs = [
    [12.6 * s, 12.6 * s, 20.2 * s, 11 * s, 1.2 * s],
    [11.4 * s, 13.2 * s, 21.2 * s, 19.4 * s, 1.2 * s],
  ];
  let hit = 0;
  const n = 4;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const px = x + (i + 0.5) / n;
      const py = y + (j + 0.5) / n;
      let a = 0;
      if (insideRoundedRect(px, py, 0, 0, size, size, 8 * s)) a = 1;
      let fgA = 0;
      for (const [cx, cy, r, op] of circles) {
        if ((px - cx) ** 2 + (py - cy) ** 2 <= r * r) fgA = Math.max(fgA, op);
      }
      for (const [x1, y1, x2, y2, hw] of segs) {
        if (distToSegment(px, py, x1, y1, x2, y2) <= hw) fgA = Math.max(fgA, 1);
      }
      hit += a * (1 - fgA) + fgA;
    }
  }
  return hit / (n * n);
}

function renderPng(size) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  let o = 0;
  for (let y = 0; y < size; y++) {
    raw[o++] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const cov = coverage(x, y, size);
      raw[o++] = Math.round(BG[0] * cov + FG[0] * (1 - cov));
      raw[o++] = Math.round(BG[1] * cov + FG[1] * (1 - cov));
      raw[o++] = Math.round(BG[2] * cov + FG[2] * (1 - cov));
      raw[o++] = 255;
    }
  }

  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body) >>> 0);
    return Buffer.concat([len, body, crc]);
  };

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  return png;
}

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return c ^ 0xffffffff;
}

const png16 = renderPng(16);
const png32 = renderPng(32);
const entries = [
  { size: 16, png: png16 },
  { size: 32, png: png32 },
];

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(entries.length, 4);

const dirEntries = [];
let offset = 6 + entries.length * 16;
for (const e of entries) {
  const d = Buffer.alloc(16);
  d[0] = e.size === 256 ? 0 : e.size; // width
  d[1] = e.size === 256 ? 0 : e.size; // height
  d[2] = 0; // palette
  d[3] = 0; // reserved
  d.writeUInt16LE(1, 4); // color planes
  d.writeUInt16LE(32, 6); // bits per pixel
  d.writeUInt32LE(e.png.length, 8);
  d.writeUInt32LE(offset, 12);
  offset += e.png.length;
  dirEntries.push(d);
}

const ico = Buffer.concat([header, ...dirEntries, png16, png32]);
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, ico);
console.log(`Wrote ${OUT} (${ico.length} bytes, 16+32px PNG-in-ICO)`);
