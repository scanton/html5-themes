// Crystal Shards — angular glass fragments that fall and spin, splitting
// light into prismatic colour along their edges.
//
// Each shard is a 4-7 sided convex polygon generated randomly, rendered with
// a glassy interior gradient, bright prismatic edge highlights in rainbow
// hues, and a soft refraction glow bloom.

export const name = 'Crystal Shards';

function rand(min, max) { return min + Math.random() * (max - min); }

const BASE_TINTS = [
  [0.85, 0.95, 1.00],   // ice blue
  [0.90, 0.85, 1.00],   // violet-ice
  [0.80, 1.00, 0.90],   // aqua
  [1.00, 0.92, 0.85],   // warm crystal
];

// Generate a random convex polygon with n vertices inside radius r
function convexPoly(n, r) {
  const angles = [];
  for (let i = 0; i < n; i++) angles.push(rand(0, Math.PI * 2));
  angles.sort((a, b) => a - b);
  const irregularity = rand(0.35, 0.80);
  return angles.map((a, i) => {
    const ri = r * (1.0 - irregularity + rand(0, irregularity * 2));
    return { x: Math.cos(a) * ri, y: Math.sin(a) * ri };
  });
}

function makeShard(w, h, spreadY) {
  const tint = BASE_TINTS[Math.floor(rand(0, BASE_TINTS.length))];
  const r    = rand(14, 42);
  const n    = Math.floor(rand(4, 8));
  return {
    x:       rand(r, w - r),
    y:       spreadY ? rand(-r, h) : -(r + rand(0, 80)),
    r,
    poly:    convexPoly(n, r),
    vx:      rand(-25, 25),
    vy:      rand(35, 80),
    rot:     rand(0, Math.PI * 2),
    rotRate: rand(-2.5, 2.5),
    tint,
    prismHue: rand(0, 360),     // starting hue for edge prism colours
    alpha:   rand(0.70, 0.92),
    life:    0,
    maxLife: rand(5, 11),
  };
}

export function init(w, h, density = 1) {
  const shards = [];
  const initCount = Math.round(18 * density);
  for (let i = 0; i < initCount; i++) shards.push(makeShard(w, h, true));
  return { shards, w, h, timer: 0 };
}

export function update(state, dt, elapsed, density = 1) {
  const { shards, w, h } = state;
  state.timer += dt;
  if (state.timer > 0.5 && shards.length < Math.round(28 * density)) {
    shards.push(makeShard(w, h, false));
    state.timer = 0;
  }
  for (let i = shards.length - 1; i >= 0; i--) {
    const s = shards[i];
    s.life   += dt;
    s.rot    += s.rotRate * dt;
    s.x      += s.vx * dt;
    s.y      += s.vy * dt;
    if (s.y - s.r > h + 10 || s.life > s.maxLife) shards.splice(i, 1);
  }
}

function shardPath(ctx, poly) {
  ctx.beginPath();
  ctx.moveTo(poly[0].x, poly[0].y);
  for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
  ctx.closePath();
}

function drawShard(ctx, s) {
  const { poly, rot, tint, prismHue, alpha, life, maxLife, r } = s;
  const fadeIn  = Math.min(life / 0.6, 1);
  const fadeOut = Math.min((maxLife - life) / 1.0, 1);
  ctx.globalAlpha = alpha * fadeIn * fadeOut;

  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(rot);

  // ── Soft glow bloom behind shard ──────────────────────────────
  const bloom = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 2.0);
  bloom.addColorStop(0,   `rgba(${Math.round(tint[0]*200)},${Math.round(tint[1]*220)},${Math.round(tint[2]*255)},0.22)`);
  bloom.addColorStop(1,   'rgba(150,190,255,0)');
  ctx.beginPath();
  ctx.arc(0, 0, r * 2.0, 0, Math.PI * 2);
  ctx.fillStyle = bloom;
  ctx.fill();

  // ── Glassy interior ───────────────────────────────────────────
  shardPath(ctx, poly);
  ctx.save();
  ctx.clip();

  const fill = ctx.createRadialGradient(-r * 0.2, -r * 0.2, 0, r * 0.1, r * 0.1, r * 1.2);
  fill.addColorStop(0,   `rgba(${Math.round(tint[0]*255)},${Math.round(tint[1]*255)},${Math.round(tint[2]*255)},0.45)`);
  fill.addColorStop(0.5, `rgba(${Math.round(tint[0]*200)},${Math.round(tint[1]*210)},${Math.round(tint[2]*240)},0.30)`);
  fill.addColorStop(1,   `rgba(140,170,220,0.15)`);
  shardPath(ctx, poly);
  ctx.fillStyle = fill;
  ctx.fill();

  // Interior facet — lighter triangle from one corner
  const p0 = poly[0], p1 = poly[1], pc = { x: r * 0.1, y: -r * 0.1 };
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  ctx.lineTo(p1.x, p1.y);
  ctx.lineTo(pc.x, pc.y);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fill();

  ctx.restore();

  // ── Prismatic edges — each edge gets a rainbow hue stroke ─────
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const h = (prismHue + i * (360 / poly.length)) % 360;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = `hsla(${h},100%,75%,0.70)`;
    ctx.lineWidth   = Math.max(1.0, r * 0.05);
    ctx.lineCap     = 'round';
    ctx.stroke();
  }

  // Thin white highlight on front face boundary
  shardPath(ctx, poly);
  ctx.strokeStyle = 'rgba(255,255,255,0.28)';
  ctx.lineWidth   = 0.7;
  ctx.stroke();

  ctx.restore();
}

export default { name, init, update, draw };

export function draw(ctx, state) {
  ctx.save();
  state.shards.forEach(s => drawShard(ctx, s));
  ctx.globalAlpha = 1;
  ctx.restore();
}
