// Jack-o-Lantern Sparks — glowing orange and purple embers drifting upward
// like sparks from a carved pumpkin's candle flame.
//
// Two types: hot orange embers (smaller, brighter, faster) and cool violet
// sparks (larger, dimmer, slower).  Each spark has a glowing core with a
// colour-temperature gradient — white-hot centre fading to deep colour at
// the halo edge.  Tiny tails trace the recent path.

export const name = 'Jack-o-Lantern Sparks';

function rand(min, max) { return min + Math.random() * (max - min); }

const TRAIL = 6;

function makeSpark(w, h, spreadY) {
  const isOrange = Math.random() < 0.65;
  const r      = isOrange ? rand(2, 5) : rand(3, 7);
  const vy     = -(rand(75, 130));
  const startY = spreadY ? rand(0, h + 20) : h + rand(0, 30);
  return {
    x:         rand(w * 0.15, w * 0.85),
    y:         startY,
    r,
    vx:        rand(-30, 30),
    vy,
    wobble:    rand(0, Math.PI * 2),
    wobbleRate:rand(2, 6),
    isOrange,
    flicker:   rand(0, Math.PI * 2),
    flickRate: rand(8, 20),
    trail:     [],
    life:      0,
    maxLife:   (startY + r) / Math.abs(vy) * rand(1.3, 1.7),
  };
}

export function init(w, h, density = 1) {
  const sparks = [];
  const initCount = Math.round(35 * density);
  for (let i = 0; i < initCount; i++) sparks.push(makeSpark(w, h, true));
  return { sparks, w, h, timer: 0 };
}

export function update(state, dt, elapsed, density = 1) {
  const { sparks, w, h } = state;
  state.timer += dt;
  if (state.timer > 0.10 && sparks.length < Math.round(55 * density)) {
    sparks.push(makeSpark(w, h, false));
    state.timer = 0;
  }
  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i];
    s.life    += dt;
    s.wobble  += s.wobbleRate * dt;
    s.flicker += s.flickRate  * dt;
    s.vx      += Math.sin(s.wobble) * 18 * dt;
    s.vy      += 8 * dt;
    s.vx      *= (1 - dt * 0.5);

    s.trail.push({ x: s.x, y: s.y });
    if (s.trail.length > TRAIL) s.trail.shift();

    s.x += s.vx * dt;
    s.y += s.vy * dt;
    if (s.y + s.r < -10 || s.life > s.maxLife) sparks.splice(i, 1);
  }
}

function drawSpark(ctx, s) {
  const { x, y, r, isOrange, flicker, trail, life, maxLife } = s;

  const fadeIn  = Math.min(life / 0.3, 1);
  const fadeOut = Math.min((maxLife - life) / 0.6, 1);
  const flick   = 0.70 + 0.30 * (0.5 + 0.5 * Math.sin(flicker));
  const alpha   = fadeIn * fadeOut * flick;
  if (alpha < 0.01) return;

  const hue  = isOrange ? rand(18, 38)  : rand(268, 295);
  const lit  = isOrange ? 62 : 55;

  // ── Tail ─────────────────────────────────────────────────────
  ctx.fillStyle = `hsl(${hue},100%,${lit}%)`;
  for (let i = 0; i < trail.length; i++) {
    const t  = (i + 1) / trail.length;
    ctx.globalAlpha = alpha * t * 0.35;
    ctx.beginPath();
    ctx.arc(trail[i].x, trail[i].y, r * (0.25 + t * 0.50), 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Outer glow halo ───────────────────────────────────────────
  ctx.globalAlpha = alpha;
  const haloR  = r * (3.5 + flick * 1.5);
  const halo   = ctx.createRadialGradient(x, y, 0, x, y, haloR);
  halo.addColorStop(0,   `hsla(${hue},100%,${lit + 10}%,0.80)`);
  halo.addColorStop(0.3, `hsla(${hue},100%,${lit}%,0.35)`);
  halo.addColorStop(1,   `hsla(${hue},100%,${lit}%,0)`);
  ctx.beginPath();
  ctx.arc(x, y, haloR, 0, Math.PI * 2);
  ctx.fillStyle = halo;
  ctx.fill();

  // ── Core — white-hot centre ───────────────────────────────────
  const core = ctx.createRadialGradient(x, y, 0, x, y, r * 1.1);
  core.addColorStop(0,   'rgba(255,255,240,0.98)');
  core.addColorStop(0.4, `hsl(${hue},100%,${Math.min(lit + 20, 95)}%)`);
  core.addColorStop(1,   `hsl(${hue},100%,${lit}%)`);
  ctx.beginPath();
  ctx.arc(x, y, r * 1.1, 0, Math.PI * 2);
  ctx.fillStyle = core;
  ctx.fill();
}

export default { name, init, update, draw };

export function draw(ctx, state) {
  ctx.save();
  [...state.sparks].sort((a, b) => a.r - b.r).forEach(s => drawSpark(ctx, s));
  ctx.globalAlpha = 1;
  ctx.restore();
}
