// Paper Planes — folded paper airplanes that glide across the canvas in
// smooth arcs, occasionally banking into gentle loops.
//
// Each plane is drawn as a crisp folded-paper silhouette: a long delta wing,
// a raised centre spine fold, a small tail fin, and subtle crease lines.
// They travel on a curved path steered by a slow oscillating bank angle.
// White planes on dark backgrounds; slight tint variants for colour.

export const name = 'Paper Planes';

function rand(min, max) { return min + Math.random() * (max - min); }

const TINTS = [
  { h: 0,   s:  0, l: 96 },    // white
  { h: 200, s: 40, l: 88 },    // pale blue
  { h: 50,  s: 50, l: 88 },    // cream
  { h: 320, s: 35, l: 88 },    // pale pink
];

function makePlane(w, h, spreadXY) {
  const tint  = TINTS[Math.floor(rand(0, TINTS.length))];
  const speed = rand(80, 160);
  const angle = rand(0, Math.PI * 2);
  return {
    x:          spreadXY ? rand(0, w)           : rand(w * 0.05, w * 0.95),
    y:          spreadXY ? rand(0, h)           : rand(h * 0.1,  h * 0.9),
    scale:      rand(1.1, 1.9),
    vx:         Math.cos(angle) * speed,
    vy:         Math.sin(angle) * speed,
    angle,
    bank:       rand(0, Math.PI * 2),     // current banking phase
    bankRate:   rand(0.3, 0.9) * (Math.random() < 0.5 ? 1 : -1),
    bankAmp:    rand(0.4, 1.2),           // max turn rate (rad/s)
    tint,
    life:       0,
    maxLife:    rand(8, 18),
  };
}

export function init(w, h, density = 1) {
  const planes = [];
  const initCount = Math.round(8 * density);
  for (let i = 0; i < initCount; i++) planes.push(makePlane(w, h, true));
  return { planes, w, h, timer: 0 };
}

export function update(state, dt, elapsed, density = 1) {
  const { planes, w, h } = state;
  state.timer += dt;
  if (state.timer > 1.4 && planes.length < Math.round(12 * density)) {
    planes.push(makePlane(w, h, false));
    state.timer = 0;
  }
  for (let i = planes.length - 1; i >= 0; i--) {
    const p = planes[i];
    p.life  += dt;
    p.bank  += p.bankRate * dt;
    p.angle += Math.sin(p.bank) * p.bankAmp * dt;

    const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    p.vx = Math.cos(p.angle) * speed;
    p.vy = Math.sin(p.angle) * speed;
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // Wrap around edges
    if (p.x < -80) p.x = w + 80;
    if (p.x > w + 80) p.x = -80;
    if (p.y < -80) p.y = h + 80;
    if (p.y > h + 80) p.y = -80;

    if (p.life > p.maxLife) planes.splice(i, 1);
  }
}

function drawPlane(ctx, p) {
  const { scale, angle, tint, life, maxLife } = p;
  const fadeIn  = Math.min(life / 1.2, 1);
  const fadeOut = Math.min((maxLife - life) / 1.8, 1);
  ctx.globalAlpha = fadeIn * fadeOut;

  ctx.save();
  ctx.translate(p.x, p.y);
  // Plane points in the direction of travel
  ctx.rotate(angle);
  ctx.scale(scale, scale);

  const body  = `hsl(${tint.h},${tint.s}%,${tint.l}%)`;
  const fold  = `hsl(${tint.h},${tint.s}%,${Math.max(tint.l - 22, 40)}%)`;
  const crease= `hsl(${tint.h},${tint.s}%,${Math.max(tint.l - 10, 55)}%)`;
  const edge  = `hsl(${tint.h},${tint.s}%,${Math.max(tint.l - 30, 30)}%)`;

  // ── Right wing (upper / starboard) ───────────────────────────
  // Nose → wing tip → centre spine  (wide swept-back delta shape)
  ctx.beginPath();
  ctx.moveTo( 26,   0);   // nose tip
  ctx.lineTo(-16,  18);   // right wing tip
  ctx.lineTo(-10,   0);   // centre spine rear
  ctx.closePath();
  ctx.fillStyle = body;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth   = 0.8;
  ctx.stroke();

  // ── Left wing (lower / port) ──────────────────────────────────
  ctx.beginPath();
  ctx.moveTo( 26,   0);
  ctx.lineTo(-16, -18);   // left wing tip
  ctx.lineTo(-10,   0);
  ctx.closePath();
  ctx.fillStyle = crease;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth   = 0.8;
  ctx.stroke();

  // ── Centre fuselage ridge ─────────────────────────────────────
  ctx.beginPath();
  ctx.moveTo(26, 0);
  ctx.lineTo(-10, 0);
  ctx.strokeStyle = fold;
  ctx.lineWidth   = 2.2;
  ctx.lineCap     = 'round';
  ctx.stroke();

  // ── Fold creases on right wing ────────────────────────────────
  ctx.strokeStyle = crease;
  ctx.lineWidth   = 0.6;
  ctx.lineCap     = 'round';
  ctx.beginPath();
  ctx.moveTo( 18, 0);
  ctx.lineTo(  2, 11);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(  7, 0);
  ctx.lineTo( -6, 14);
  ctx.stroke();

  ctx.restore();
}

export default { name, init, update, draw };

export function draw(ctx, state) {
  ctx.save();
  // depth order: small (far) planes draw first, large (near) on top
  [...state.planes].sort((a, b) => a.scale - b.scale)
    .forEach(p => drawPlane(ctx, p));
  ctx.globalAlpha = 1;
  ctx.restore();
}
