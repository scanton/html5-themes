// Cherry Blossoms — delicate 5-petal flowers drifting on a gentle breeze.
//
// Each petal is drawn as two bezier curves from the centre forming a rounded
// lobe, with a subtle gradient from deep pink at the base to near-white at
// the tip.  Flowers spin slowly and sway side-to-side as they fall.
// Petals occasionally detach slightly for a more organic look.

export const name = 'Cherry Blossoms';

function rand(min, max) { return min + Math.random() * (max - min); }

const PETAL_COLORS = [
  { inner: '#FFB7C5', outer: '#FF8FA3', center: '#D44' },   // classic pink
  { inner: '#FFDDE4', outer: '#FFB3C1', center: '#C33' },   // pale pink
  { inner: '#FFE4EC', outer: '#FFC0CB', center: '#B22' },   // blush
  { inner: '#FFCCD5', outer: '#FF85A1', center: '#C44' },   // warm pink
];

function makeFlower(w, h, spreadY) {
  const col    = PETAL_COLORS[Math.floor(rand(0, PETAL_COLORS.length))];
  const size   = rand(10, 26);
  const vy     = rand(25, 55);
  const startY = spreadY ? rand(-size, h + size) : -(size + rand(0, 80));
  return {
    x:          rand(size, w - size),
    y:          startY,
    size,
    vx:         rand(-20, 20),
    vy,
    rot:        rand(0, Math.PI * 2),
    rotRate:    rand(-1.2, 1.2),
    sway:       rand(0, Math.PI * 2),
    swayRate:   rand(0.5, 1.4),
    swayAmp:    rand(15, 35),
    col,
    petalOffsets: Array.from({ length: 5 }, () => rand(-0.08, 0.08)),
    life:       0,
    maxLife:    (h + size - startY) / vy * rand(1.05, 1.15),
  };
}

export function init(w, h, density = 1) {
  const flowers = [];
  const initCount = Math.round(24 * density);
  for (let i = 0; i < initCount; i++) flowers.push(makeFlower(w, h, true));
  return { flowers, w, h, timer: 0 };
}

export function update(state, dt, elapsed, density = 1) {
  const { flowers, w, h } = state;
  state.timer += dt;
  if (state.timer > 0.45 && flowers.length < Math.round(36 * density)) {
    flowers.push(makeFlower(w, h, false));
    state.timer = 0;
  }
  for (let i = flowers.length - 1; i >= 0; i--) {
    const f = flowers[i];
    f.life  += dt;
    f.rot   += f.rotRate  * dt;
    f.sway  += f.swayRate * dt;
    f.x     += (f.vx + Math.sin(f.sway) * f.swayAmp) * dt;
    f.y     += f.vy * dt;
    if (f.y - f.size > h + 10 || f.life > f.maxLife) flowers.splice(i, 1);
  }
}

// Draw one petal at angle `ang` from centre, with length `len`
function drawPetal(ctx, len, innerCol, outerCol) {
  // Each petal is two symmetric bezier curves forming a rounded lobe
  const w = len * 0.52;   // half-width at widest point
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-w,  len * 0.30, -w * 0.8, len * 0.75, 0, len);
  ctx.bezierCurveTo( w * 0.8, len * 0.75,  w,  len * 0.30, 0, 0);
  ctx.closePath();

  const grad = ctx.createLinearGradient(0, 0, 0, len);
  grad.addColorStop(0,    innerCol);
  grad.addColorStop(0.55, outerCol);
  grad.addColorStop(1,    '#FFFAFC');
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.strokeStyle = `${outerCol}88`;
  ctx.lineWidth   = 0.6;
  ctx.stroke();
}

function drawFlower(ctx, f) {
  const { x, y, size, rot, col, petalOffsets, life, maxLife } = f;
  const fadeIn  = Math.min(life / 0.6, 1);
  const fadeOut = Math.min((maxLife - life) / 1.0, 1);
  ctx.globalAlpha = fadeIn * fadeOut;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);

  // ── Five petals ───────────────────────────────────────────────
  for (let p = 0; p < 5; p++) {
    const ang = (p * Math.PI * 2) / 5 + petalOffsets[p];
    ctx.save();
    ctx.rotate(ang);
    drawPetal(ctx, size, col.inner, col.outer);
    ctx.restore();
  }

  // ── Centre disc ───────────────────────────────────────────────
  const cr = size * 0.22;
  ctx.beginPath();
  ctx.arc(0, 0, cr, 0, Math.PI * 2);
  ctx.fillStyle = col.center;
  ctx.fill();

  // Stamens — tiny dots around the disc
  for (let s = 0; s < 8; s++) {
    const sa = (s * Math.PI * 2) / 8;
    const sx = Math.cos(sa) * cr * 1.55;
    const sy = Math.sin(sa) * cr * 1.55;
    ctx.beginPath();
    ctx.arc(sx, sy, cr * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = '#FFD700';
    ctx.fill();
  }

  ctx.restore();
}

export default { name, init, update, draw };

export function draw(ctx, state) {
  ctx.save();
  [...state.flowers].sort((a, b) => a.size - b.size).forEach(f => drawFlower(ctx, f));
  ctx.globalAlpha = 1;
  ctx.restore();
}
