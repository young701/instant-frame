// node crop.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Crop math lives inline in index.html so the page works as a single file.
const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const code = html.split('// --- crop math (checked by crop.test.mjs) ---')[1].split('// --- end crop math ---')[0];
const { center, clamp, zoomAt, srcRect, MAX_ZOOM } = new Function(code + '\nreturn { center, clamp, zoomAt, srcRect, MAX_ZOOM };')();

const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-6, `${a} != ${b}`);

// Landscape 4000x3000 into a 79x79 window: centered square crop.
srcRect(center(4000, 3000, 79, 79), 4000, 3000, 79, 79).forEach((v, i) => near(v, [500, 0, 3000, 3000][i]));

// Zoom keeps the anchor point still.
const s = zoomAt(center(4000, 3000, 79, 79), 2, 30, 40);
const k1 = 79 / 3000, k2 = k1 * 2;
near((30 - center(4000, 3000, 79, 79).ox) / k1, (30 - s.ox) / k2);

// Fuzz: after clamp the source rect always stays inside the image.
for (let i = 0; i < 10000; i++) {
  const iw = 100 + Math.random() * 5000, ih = 100 + Math.random() * 5000;
  const [pw, ph] = Math.random() < 0.5 ? [79, 79] : [46, 62];
  const c = clamp({ z: Math.random() * 6 - 1, ox: Math.random() * 400 - 300, oy: Math.random() * 400 - 300 }, iw, ih, pw, ph);
  assert.ok(c.z >= 1 && c.z <= MAX_ZOOM);
  const [sx, sy, sw, sh] = srcRect(c, iw, ih, pw, ph);
  assert.ok(sx >= -1e-6 && sy >= -1e-6 && sx + sw <= iw + 1e-6 && sy + sh <= ih + 1e-6, JSON.stringify({ iw, ih, c }));
}
console.log('crop ok');
