// Fireflies — bioluminescent orbs that drift lazily and pulse their glow.
//
// Each firefly has a warm yellow-green core that fades in and out on a slow
// sine cycle, a soft radial bloom, and a very faint motion trail.  They
// wander the full canvas on smooth curved paths using a steering angle that
// drifts slowly, giving organic non-linear flight rather than straight lines.

export const name = 'Fireflies';

function rand(min, max) { return min + Math.random() * (max - min); }

const TRAIL = 10;

const COLORS = [
  { h:  68, s: 100, l: 72 },   // yellow-green
  { h:  78, s:  95, l: 68 },   // lime green
  { h:  55, s: 100, l: 75 },   // warm yellow
  { h:  88, s:  90, l: 65 },   // green
];

function makeFirefly(w, h, spreadXY) {
  const col   = COLORS[Math.floor(rand(0, COLORS.length))];
  const speed = rand(18, 42);
  const angle = rand(0, Math.PI * 2);
  return {
    x:          spreadXY ? rand(0, w) : rand(w * 0.05, w * 0.95),
    y:          spreadXY ? rand(0, h) : rand(h * 0.05, h * 0.95),
    vx:         Math.cos(angle) * speed,
    vy:         Math.sin(angle) * speed,
    angle,
    steerRate:  rand(0.3, 1.1) * (Math.random() < 0.5 ? 1 : -1),
    steerAmp:   rand(0.5, 1.8),    // max turn rate (rad/s)
    steerPhase: rand(0, Math.PI * 2),
    r:          rand(2.5, 5.5),
    hue: col.h, sat: col.s, lit: col.l,
    glowPhase:  rand(0, Math.PI * 2),
    glowRate:   rand(0.6, 1.8),    // pulse frequency (rad/s)
    glowOn:     Math.random() < 0.55,   // starts lit or dark
    trail:      [],
    life:       0,
    maxLife:    rand(8, 18),
  };
}

export function init(w, h, density = 1) {
  const flies = [];
  const initCount = Math.round(22 * density);
  for (let i = 0; i < initCount; i++) flies.push(makeFirefly(w, h, true));
  return { flies, w, h, timer: 0 };
}

export function update(state, dt, elapsed, density = 1) {
  const { flies, w, h } = state;
  state.timer += dt;
  if (state.timer > 0.7 && flies.length < Math.round(32 * density)) {
    flies.push(makeFirefly(w, h, false));
    state.timer = 0;
  }

  flies.forEach((f, i) => {
    f.life       += dt;
    f.glowPhase  += f.glowRate * dt;
    f.steerPhase += f.steerRate * dt;

    // Organic steering — angle drifts sinusoidally
    f.angle += Math.sin(f.steerPhase) * f.steerAmp * dt;
    const speed = Math.sqrt(f.vx * f.vx + f.vy * f.vy);
    f.vx = Math.cos(f.angle) * speed;
    f.vy = Math.sin(f.angle) * speed;

    f.trail.push({ x: f.x, y: f.y });
    if (f.trail.length > TRAIL) f.trail.shift();

    f.x += f.vx * dt;
    f.y += f.vy * dt;

    // Soft wrap / bounce at edges
    if (f.x < -20) f.x = w + 20;
    if (f.x > w + 20) f.x = -20;
    if (f.y < -20) f.y = h + 20;
    if (f.y > h + 20) f.y = -20;
  });

  // Remove only expired ones
  for (let i = flies.length - 1; i >= 0; i--) {
    if (flies[i].life > flies[i].maxLife) flies.splice(i, 1);
  }
}

function drawFirefly(ctx, f) {
  const { x, y, r, hue, sat, lit, glowPhase, trail, life, maxLife } = f;

  // Glow pulse: 0.15 (dark) → 1.0 (full glow)
  const pulse    = 0.15 + 0.85 * (0.5 + 0.5 * Math.sin(glowPhase));
  const fadeIn   = Math.min(life / 1.5, 1);
  const fadeOut  = Math.min((maxLife - life) / 2.0, 1);
  const alpha    = fadeIn * fadeOut;

  // ── Faint motion trail ────────────────────────────────────────
  ctx.fillStyle = `hsl(${hue},${sat}%,${lit}%)`;
  for (let i = 0; i < trail.length; i++) {
    const t  = (i + 1) / trail.length;
    ctx.globalAlpha = alpha * pulse * t * 0.18;
    ctx.beginPath();
    ctx.arc(trail[i].x, trail[i].y, r * (0.3 + 0.4 * t), 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Outer glow bloom ─────────────────────────────────────────
  ctx.globalAlpha = alpha * pulse;
  const outerR = r * (4.5 + pulse * 3.5);
  const glow   = ctx.createRadialGradient(x, y, 0, x, y, outerR);
  glow.addColorStop(0,    `hsla(${hue},${sat}%,${lit}%,0.55)`);
  glow.addColorStop(0.35, `hsla(${hue},${sat}%,${lit}%,0.22)`);
  glow.addColorStop(1,    `hsla(${hue},${sat}%,${lit}%,0)`);
  ctx.beginPath();
  ctx.arc(x, y, outerR, 0, Math.PI * 2);
  ctx.fillStyle = glow;
  ctx.fill();

  // ── Core body ─────────────────────────────────────────────────
  ctx.beginPath();
  ctx.arc(x, y, r * (0.7 + pulse * 0.5), 0, Math.PI * 2);
  ctx.fillStyle = `hsl(${hue},${sat}%,${Math.min(lit + 16, 100)}%)`;
  ctx.fill();

  // Bright centre dot
  ctx.beginPath();
  ctx.arc(x, y, r * 0.30, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,240,0.95)';
  ctx.fill();
}

export default { name, init, update, draw };

export function draw(ctx, state) {
  ctx.save();
  [...state.flies].sort((a, b) => a.r - b.r).forEach(f => drawFirefly(ctx, f));
  ctx.globalAlpha = 1;
  ctx.restore();
}
