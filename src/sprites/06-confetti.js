// Confetti — bright geometric pieces that flutter and tumble downward.
//
// Four shape types: streamers (thin rectangles), squares, circles, triangles.
// Flutter physics: each piece has a "tilt" angle that rotates independently
// of its spin, compressing the drawn width by |cos(tilt)| to simulate the
// piece showing its thin edge.  The back face is rendered slightly darker.

export const name = 'Confetti';

function rand(min, max) { return min + Math.random() * (max - min); }

const COLORS = [
  '#FF2D55', '#FF6B35', '#FFD700', '#34C759',
  '#00C8FF', '#AF52DE', '#FF61A6', '#30D158',
  '#FF3A30', '#007AFF',
];
const SHAPES = ['streamer', 'square', 'circle', 'triangle'];

function dimColor(hex, factor) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.round(r * factor)},${Math.round(g * factor)},${Math.round(b * factor)})`;
}

function makePiece(w, h, spreadY) {
  return {
    x:         rand(0, w),
    y:         spreadY ? rand(-50, h * 0.6) : -(rand(8, 22) + rand(0, 80)),
    size:      rand(6, 18),
    type:      SHAPES[Math.floor(rand(0, SHAPES.length))],
    color:     COLORS[Math.floor(rand(0, COLORS.length))],
    vx:        rand(-35, 35),
    vy:        rand(55, 130),
    rot:       rand(0, Math.PI * 2),
    rotRate:   rand(-5.5, 5.5),
    tilt:      rand(0, Math.PI * 2),
    tiltRate:  rand(-4.0, 4.0),
    life:      0,
    maxLife:   rand(4, 9),
  };
}

export function init(w, h, density = 1) {
  const pieces = [];
  const initCount = Math.round(50 * density);
  for (let i = 0; i < initCount; i++) pieces.push(makePiece(w, h, true));
  return { pieces, w, h, timer: 0 };
}

export function update(state, dt, elapsed, density = 1) {
  const { pieces, w, h } = state;
  state.timer += dt;
  if (state.timer > 0.16 && pieces.length < Math.round(70 * density)) {
    pieces.push(makePiece(w, h, false));
    state.timer = 0;
  }
  for (let i = pieces.length - 1; i >= 0; i--) {
    const p = pieces[i];
    p.life   += dt;
    p.rot    += p.rotRate  * dt;
    p.tilt   += p.tiltRate * dt;
    p.x      += p.vx * dt;
    p.y      += p.vy * dt;
    p.vx     *= (1 - dt * 0.5);      // air resistance
    p.vy      = Math.min(p.vy + dt * 25, 150);
    if (p.y - p.size > h + 20 || p.life > p.maxLife) pieces.splice(i, 1);
  }
}

function drawPiece(ctx, p) {
  const { size, type, color, rot, tilt } = p;

  // Card-flip: compress x by |cos(tilt)|, darken back face
  const scaleX  = Math.abs(Math.cos(tilt));
  const isBack  = Math.cos(tilt) < 0;
  const shade   = isBack ? 0.68 : 1.0;
  const drawCol = shade < 1 ? dimColor(color, shade) : color;

  ctx.save();
  ctx.rotate(rot);
  ctx.scale(Math.max(scaleX, 0.04), 1);    // avoid zero scale

  ctx.fillStyle   = drawCol;
  ctx.strokeStyle = dimColor(color, 0.50);
  ctx.lineWidth   = 0.8;

  if (type === 'streamer') {
    const sw = size * 0.42, sh = size * 2.4;
    ctx.fillRect(-sw, -sh, sw * 2, sh * 2);
  } else if (type === 'square') {
    const s = size * 0.85;
    ctx.fillRect(-s, -s, s * 2, s * 2);
    ctx.strokeRect(-s, -s, s * 2, s * 2);
  } else if (type === 'circle') {
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.82, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // equilateral triangle
    const th = size * 1.1;
    ctx.beginPath();
    ctx.moveTo(0, -th);
    ctx.lineTo( th * 0.866,  th * 0.5);
    ctx.lineTo(-th * 0.866,  th * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

export default { name, init, update, draw };

export function draw(ctx, state) {
  ctx.save();
  [...state.pieces].sort((a, b) => a.size - b.size).forEach(p => {
    const fadeOut = Math.min((p.maxLife - p.life) / 0.9, 1);
    ctx.globalAlpha = fadeOut;
    ctx.save();
    ctx.translate(p.x, p.y);
    drawPiece(ctx, p);
    ctx.restore();
  });
  ctx.restore();
}
