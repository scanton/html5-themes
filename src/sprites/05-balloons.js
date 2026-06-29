// Balloons — pastel round balloons drifting upward with a gentle sway.
//
// Each balloon has an elliptical body with a radial gradient fill, a
// specular highlight at top-left, a small rounded knot at the base, and
// a bezier-curved string trailing below.  Eight pastel hues cycle randomly.

export const name = 'Balloons';

function rand(min, max) { return min + Math.random() * (max - min); }

const COLORS = [
  { h: 340, s: 80, l: 72 },   // pink
  { h: 210, s: 75, l: 70 },   // sky blue
  { h: 155, s: 55, l: 65 },   // mint
  { h: 270, s: 55, l: 72 },   // lavender
  { h:  28, s: 85, l: 72 },   // peach
  { h:  55, s: 80, l: 68 },   // lemon
  { h: 185, s: 65, l: 65 },   // aqua
  { h:  10, s: 80, l: 70 },   // coral
];

function makeBalloon(w, h, spreadY) {
  const col    = COLORS[Math.floor(rand(0, COLORS.length))];
  const r      = rand(26, 52);
  const vy     = -(rand(24, 44));
  const startY = spreadY ? rand(-r, h + r) : h + r * 4 + rand(0, 100);
  return {
    x:          rand(r * 2, w - r * 2),
    y:          startY,
    r,
    vx:         rand(-12, 12),
    vy,
    wobble:     rand(0, Math.PI * 2),
    wobbleRate: rand(0.4, 1.2),
    hue: col.h, sat: col.s, lit: col.l,
    life:       0,
    maxLife:    (startY + r * 4) / Math.abs(vy) * rand(1.05, 1.15),
  };
}

export function init(w, h, density = 1) {
  const balloons = [];
  const initCount = Math.round(10 * density);
  for (let i = 0; i < initCount; i++) balloons.push(makeBalloon(w, h, true));
  return { balloons, w, h, timer: 0 };
}

export function update(state, dt, elapsed, density = 1) {
  const { balloons, w, h } = state;
  state.timer += dt;
  if (state.timer > 1.2 && balloons.length < Math.round(15 * density)) {
    balloons.push(makeBalloon(w, h, false));
    state.timer = 0;
  }
  for (let i = balloons.length - 1; i >= 0; i--) {
    const b = balloons[i];
    b.life   += dt;
    b.wobble += b.wobbleRate * dt;
    b.x      += (b.vx + Math.sin(b.wobble) * 14) * dt;
    b.y      += b.vy * dt;
    if (b.y + b.r * 4 < -10 || b.life > b.maxLife) balloons.splice(i, 1);
  }
}

function drawBalloon(ctx, b) {
  const { x, y, r, hue, sat, lit } = b;
  const bw = r * 0.92;   // body half-width
  const bh = r * 1.05;   // body half-height

  // ── Body fill — radial gradient ───────────────────────────────
  const fill = ctx.createRadialGradient(
    x - bw * 0.28, y - bh * 0.30, bw * 0.05,
    x + bw * 0.10, y + bh * 0.10, bw * 1.15
  );
  fill.addColorStop(0,    `hsl(${hue},${sat}%,${Math.min(lit + 24, 96)}%)`);
  fill.addColorStop(0.45, `hsl(${hue},${sat}%,${lit}%)`);
  fill.addColorStop(1,    `hsl(${hue},${sat}%,${Math.max(lit - 20, 20)}%)`);

  ctx.beginPath();
  ctx.ellipse(x, y, bw, bh, 0, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();

  // Thin outline
  ctx.strokeStyle = `hsla(${hue},${sat}%,${lit - 22}%,0.30)`;
  ctx.lineWidth   = Math.max(0.7, r * 0.025);
  ctx.stroke();

  // ── Specular highlight — top-left ─────────────────────────────
  const spec = ctx.createRadialGradient(
    x - bw * 0.30, y - bh * 0.34, 0,
    x - bw * 0.30, y - bh * 0.34, bw * 0.50
  );
  spec.addColorStop(0,    `rgba(255,255,255,0.72)`);
  spec.addColorStop(0.45, `rgba(255,255,255,0.24)`);
  spec.addColorStop(1,    `rgba(255,255,255,0)`);
  ctx.beginPath();
  ctx.ellipse(x, y, bw, bh, 0, 0, Math.PI * 2);
  ctx.fillStyle = spec;
  ctx.fill();

  // ── Knot — small rounded diamond at bottom of body ────────────
  const kx = x, ky = y + bh;
  ctx.beginPath();
  ctx.moveTo(kx - r * 0.11, ky);
  ctx.bezierCurveTo(kx - r * 0.08, ky + r * 0.14, kx + r * 0.08, ky + r * 0.14, kx + r * 0.11, ky);
  ctx.bezierCurveTo(kx + r * 0.04, ky - r * 0.07, kx - r * 0.04, ky - r * 0.07, kx - r * 0.11, ky);
  ctx.fillStyle = `hsl(${hue},${sat}%,${Math.max(lit - 16, 22)}%)`;
  ctx.fill();

  // ── String — gently curving bezier ────────────────────────────
  ctx.beginPath();
  ctx.moveTo(kx, ky + r * 0.13);
  ctx.bezierCurveTo(
    kx + r * 0.48, ky + r * 1.0,
    kx - r * 0.38, ky + r * 2.0,
    kx + r * 0.20, ky + r * 3.1
  );
  ctx.strokeStyle = 'rgba(170,170,170,0.52)';
  ctx.lineWidth   = Math.max(0.7, r * 0.022);
  ctx.lineCap     = 'round';
  ctx.stroke();
}

export default { name, init, update, draw };

export function draw(ctx, state) {
  ctx.save();
  state.balloons.forEach(b => {
    const fadeIn  = Math.min(b.life / 0.8, 1);
    const fadeOut = Math.min((b.maxLife - b.life) / 1.5, 1);
    ctx.globalAlpha = fadeIn * fadeOut;
    drawBalloon(ctx, b);
  });
  ctx.restore();
}
