// Magic Dust — warm golden motes that swirl in drifting orbital clusters.
//
// Each cluster is a loose group of motes orbiting a slowly drifting centre.
// Motes leave short glowing trails; the core has a bright radial glow bloom.
// Colours range from warm white through gold to deep amber.

export const name = 'Magic Dust';

function rand(min, max) { return min + Math.random() * (max - min); }

const TRAIL = 7;

const PALETTE = [
  { h: 48,  s: 100, l: 80 },   // bright gold
  { h: 52,  s:  95, l: 88 },   // pale gold
  { h: 42,  s:  90, l: 74 },   // amber gold
  { h: 36,  s:  88, l: 70 },   // deep amber
  { h: 56,  s:  82, l: 90 },   // warm white-gold
  { h: 28,  s:  75, l: 78 },   // peach gold
];

function makeMote(cx, cy) {
  const col = PALETTE[Math.floor(rand(0, PALETTE.length))];
  return {
    cx, cy,                              // reference to cluster centre (updated by ref below)
    orbitR:    rand(10, 38),
    orbitA:    rand(0, Math.PI * 2),
    orbitRate: rand(0.5, 1.6) * (Math.random() < 0.5 ? 1 : -1),
    r:         rand(2.2, 5.5),
    hue: col.h, sat: col.s, lit: col.l,
    trail:     [],
    x: cx, y: cy,
    life: 0,
    maxLife: rand(4, 10),
  };
}

function makeCluster(w, h, spreadXY) {
  const cx = spreadXY ? rand(w * 0.05, w * 0.95) : rand(w * 0.1, w * 0.9);
  const cy = spreadXY ? rand(h * 0.05, h * 0.95) : rand(h * 0.1, h * 0.9);
  const count = Math.floor(rand(4, 9));
  const motes = [];
  for (let i = 0; i < count; i++) motes.push(makeMote(cx, cy));
  return {
    cx, cy,
    vx: rand(-20, 20),
    vy: rand(-14, 14),
    motes,
    life: 0,
    maxLife: rand(7, 15),
  };
}

export function init(w, h, density = 1) {
  const clusters = [];
  const initCount = Math.round(5 * density);
  for (let i = 0; i < initCount; i++) clusters.push(makeCluster(w, h, true));
  return { clusters, w, h, timer: 0 };
}

export function update(state, dt, elapsed, density = 1) {
  const { clusters, w, h } = state;
  state.timer += dt;
  if (state.timer > 2.2 && clusters.length < Math.round(8 * density)) {
    clusters.push(makeCluster(w, h, false));
    state.timer = 0;
  }

  for (let ci = clusters.length - 1; ci >= 0; ci--) {
    const cl = clusters[ci];
    cl.life += dt;
    cl.cx   += cl.vx * dt;
    cl.cy   += cl.vy * dt;
    // Soft bounce off edges
    if (cl.cx < w * 0.05 || cl.cx > w * 0.95) cl.vx *= -0.9;
    if (cl.cy < h * 0.05 || cl.cy > h * 0.95) cl.vy *= -0.9;

    for (let mi = cl.motes.length - 1; mi >= 0; mi--) {
      const m = cl.motes[mi];
      m.life   += dt;
      m.orbitA += m.orbitRate * dt;

      const nx = cl.cx + Math.cos(m.orbitA) * m.orbitR;
      const ny = cl.cy + Math.sin(m.orbitA) * m.orbitR;

      m.trail.push({ x: m.x, y: m.y });
      if (m.trail.length > TRAIL) m.trail.shift();
      m.x = nx;
      m.y = ny;

      if (m.life > m.maxLife) cl.motes.splice(mi, 1);
    }

    if (cl.motes.length === 0 || cl.life > cl.maxLife) clusters.splice(ci, 1);
  }
}

function drawMote(ctx, m, baseAlpha) {
  const { x, y, r, hue, sat, lit, trail, life, maxLife } = m;
  const fadeIn  = Math.min(life / 0.8, 1);
  const fadeOut = Math.min((maxLife - life) / 1.2, 1);
  const alpha   = baseAlpha * fadeIn * fadeOut;
  if (alpha < 0.01) return;

  // ── Trail — circles with decreasing opacity ──────────────────
  ctx.fillStyle = `hsl(${hue},${sat}%,${lit}%)`;
  for (let i = 0; i < trail.length; i++) {
    const t  = (i + 1) / trail.length;
    const tr = r * (0.22 + 0.45 * t);
    ctx.globalAlpha = alpha * t * 0.45;
    ctx.beginPath();
    ctx.arc(trail[i].x, trail[i].y, tr, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Core glow bloom ──────────────────────────────────────────
  ctx.globalAlpha = alpha;
  const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 3.5);
  glow.addColorStop(0,    `hsla(${hue},${sat}%,${Math.min(lit + 14, 100)}%,0.85)`);
  glow.addColorStop(0.30, `hsla(${hue},${sat}%,${lit}%,0.40)`);
  glow.addColorStop(1,    `hsla(${hue},${sat}%,${lit}%,0)`);
  ctx.beginPath();
  ctx.arc(x, y, r * 3.5, 0, Math.PI * 2);
  ctx.fillStyle = glow;
  ctx.fill();

  // Bright solid core
  ctx.beginPath();
  ctx.arc(x, y, r * 0.62, 0, Math.PI * 2);
  ctx.fillStyle = `hsl(${hue},${sat}%,${Math.min(lit + 16, 100)}%)`;
  ctx.fill();

  // Tiny specular dot
  ctx.beginPath();
  ctx.arc(x - r * 0.22, y - r * 0.22, r * 0.20, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.80)';
  ctx.fill();
}

export default { name, init, update, draw };

export function draw(ctx, state) {
  ctx.save();
  state.clusters.forEach(cl => {
    const cFadeIn  = Math.min(cl.life / 1.5, 1);
    const cFadeOut = Math.min((cl.maxLife - cl.life) / 2.0, 1);
    const cAlpha   = cFadeIn * cFadeOut;
    cl.motes.forEach(m => drawMote(ctx, m, cAlpha));
  });
  ctx.globalAlpha = 1;
  ctx.restore();
}
