// Geometric Shapes — clean outline-only polygons drifting and rotating slowly.
//
// Five types: hexagon, diamond, triangle, pentagon, square.
// Rendered as stroke-only with a faint matching fill so they're visible on
// both dark and light backgrounds.  Colours from a muted jewel-tone palette.
// Larger shapes move slower; all rotate at a leisurely pace.

export const name = 'Geometric Shapes';

function rand(min, max) { return min + Math.random() * (max - min); }

const COLORS = [
  { h:  210, s: 70, l: 65 },   // slate blue
  { h:  280, s: 60, l: 68 },   // soft violet
  { h:  165, s: 60, l: 58 },   // teal
  { h:   35, s: 75, l: 62 },   // amber
  { h:  340, s: 65, l: 65 },   // rose
  { h:  100, s: 55, l: 58 },   // sage
  { h:   20, s: 70, l: 62 },   // terracotta
];

const TYPES = ['hexagon', 'diamond', 'triangle', 'pentagon', 'square'];

function polyPoints(sides, r, offset) {
  const pts = [];
  for (let i = 0; i < sides; i++) {
    const a = (i * Math.PI * 2) / sides + (offset || 0);
    pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
  }
  return pts;
}

function makeShape(w, h, spreadY) {
  const type  = TYPES[Math.floor(rand(0, TYPES.length))];
  const col   = COLORS[Math.floor(rand(0, COLORS.length))];
  const r     = rand(16, 42);
  const speed = 50 / r * rand(0.5, 1.5) * 20;   // smaller = faster
  return {
    x:        rand(r, w - r),
    y:        spreadY ? rand(-r, h) : -(r + rand(0, 80)),
    r,
    type,
    col,
    vx:       rand(-14, 14),
    vy:       rand(20, 50) * (20 / r),
    rot:      rand(0, Math.PI * 2),
    rotRate:  rand(-0.6, 0.6),
    alpha:    rand(0.60, 0.88),
    life:     0,
    maxLife:  rand(6, 14),
  };
}

export function init(w, h, density = 1) {
  const shapes = [];
  const initCount = Math.round(20 * density);
  for (let i = 0; i < initCount; i++) shapes.push(makeShape(w, h, true));
  return { shapes, w, h, timer: 0 };
}

export function update(state, dt, elapsed, density = 1) {
  const { shapes, w, h } = state;
  state.timer += dt;
  if (state.timer > 0.55 && shapes.length < Math.round(30 * density)) {
    shapes.push(makeShape(w, h, false));
    state.timer = 0;
  }
  for (let i = shapes.length - 1; i >= 0; i--) {
    const s = shapes[i];
    s.life  += dt;
    s.rot   += s.rotRate * dt;
    s.x     += s.vx * dt;
    s.y     += s.vy * dt;
    if (s.y - s.r > h + 10 || s.life > s.maxLife) shapes.splice(i, 1);
  }
}

function drawShape(ctx, s) {
  const { r, type, col, rot, alpha, life, maxLife } = s;
  const fadeIn  = Math.min(life / 0.7, 1);
  const fadeOut = Math.min((maxLife - life) / 1.2, 1);
  ctx.globalAlpha = alpha * fadeIn * fadeOut;

  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(rot);

  let pts;
  if (type === 'hexagon')  pts = polyPoints(6, r, Math.PI / 6);
  else if (type === 'diamond')  {
    pts = [
      { x: 0, y: -r },
      { x: r * 0.62, y: 0 },
      { x: 0, y: r * 1.1 },
      { x: -r * 0.62, y: 0 },
    ];
  }
  else if (type === 'triangle')  pts = polyPoints(3, r, -Math.PI / 2);
  else if (type === 'pentagon')  pts = polyPoints(5, r, -Math.PI / 2);
  else                           pts = polyPoints(4, r, Math.PI / 4);

  // Faint fill
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  ctx.fillStyle = `hsla(${col.h},${col.s}%,${col.l}%,0.10)`;
  ctx.fill();

  // Crisp outline
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  ctx.strokeStyle = `hsl(${col.h},${col.s}%,${col.l}%)`;
  ctx.lineWidth   = Math.max(1.2, r * 0.055);
  ctx.lineJoin    = 'round';
  ctx.stroke();

  // Dot at each vertex
  pts.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(1.5, r * 0.065), 0, Math.PI * 2);
    ctx.fillStyle = `hsl(${col.h},${col.s}%,${Math.min(col.l + 18, 92)}%)`;
    ctx.fill();
  });

  ctx.restore();
}

export default { name, init, update, draw };

export function draw(ctx, state) {
  ctx.save();
  state.shapes.forEach(s => drawShape(ctx, s));
  ctx.globalAlpha = 1;
  ctx.restore();
}
