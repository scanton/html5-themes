// Music Notes — quarter notes, eighth notes, and treble clefs floating upward
// with a gentle bounce and a soft musical glow.
//
// Quarter notes: filled oval head + vertical stem.
// Eighth notes: two notes joined by a beam — rendered as a pair.
// Treble clef: drawn as a bezier path approximation.
// Colours: warm white, soft gold, pastel violet, sky blue.

export const name = 'Music Notes';

function rand(min, max) { return min + Math.random() * (max - min); }

const COLORS = [
  { h:  50, s: 90, l: 78 },    // warm gold
  { h: 200, s: 70, l: 74 },    // sky blue
  { h: 270, s: 60, l: 75 },    // pastel violet
  { h:   0, s:  0, l: 90 },    // white
  { h: 330, s: 70, l: 78 },    // pink
];

const TYPES = ['quarter', 'eighth'];

function makeNote(w, h, spreadY) {
  const col  = COLORS[Math.floor(rand(0, COLORS.length))];
  const type = TYPES[Math.floor(rand(0, TYPES.length))];
  const size = rand(16, 34);
  return {
    x:          rand(size, w - size),
    y:          spreadY ? rand(h * 0.1, h + size) : h + size + rand(0, 80),
    size,
    type,
    col,
    vx:         rand(-12, 12),
    vy:         -(rand(28, 52)),
    wobble:     rand(0, Math.PI * 2),
    wobbleRate: rand(0.6, 1.6),
    rot:        rand(-0.25, 0.25),
    life:       0,
    maxLife:    rand(5, 11),
  };
}

export function init(w, h, density = 1) {
  const notes = [];
  const initCount = Math.round(16 * density);
  for (let i = 0; i < initCount; i++) notes.push(makeNote(w, h, true));
  return { notes, w, h, timer: 0 };
}

export function update(state, dt, elapsed, density = 1) {
  const { notes, w, h } = state;
  state.timer += dt;
  if (state.timer > 0.65 && notes.length < Math.round(24 * density)) {
    notes.push(makeNote(w, h, false));
    state.timer = 0;
  }
  for (let i = notes.length - 1; i >= 0; i--) {
    const n = notes[i];
    n.life   += dt;
    n.wobble += n.wobbleRate * dt;
    n.x      += (n.vx + Math.sin(n.wobble) * 10) * dt;
    n.y      += n.vy * dt;
    if (n.y + n.size * 2 < -10 || n.life > n.maxLife) notes.splice(i, 1);
  }
}

function quarterNote(ctx, s, col) {
  const hw = s * 0.42, hh = s * 0.30;
  const stemH = s * 1.55;
  // Head
  ctx.save();
  ctx.rotate(-0.38);
  ctx.beginPath();
  ctx.ellipse(0, 0, hw, hh, 0, 0, Math.PI * 2);
  ctx.fillStyle = col;
  ctx.fill();
  ctx.restore();
  // Stem
  ctx.beginPath();
  ctx.moveTo(hw * 0.85, -hh * 0.4);
  ctx.lineTo(hw * 0.85, -hh * 0.4 - stemH);
  ctx.strokeStyle = col;
  ctx.lineWidth   = Math.max(1.5, s * 0.09);
  ctx.lineCap     = 'round';
  ctx.stroke();
}

function eighthPair(ctx, s, col) {
  const hw = s * 0.40, hh = s * 0.28;
  const stemH = s * 1.45;
  const gap   = s * 1.0;   // horizontal gap between notes

  // Left note
  ctx.save();
  ctx.translate(-gap * 0.5, s * 0.2);
  ctx.save();
  ctx.rotate(-0.38);
  ctx.beginPath();
  ctx.ellipse(0, 0, hw, hh, 0, 0, Math.PI * 2);
  ctx.fillStyle = col;
  ctx.fill();
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(hw * 0.82, -hh * 0.4);
  ctx.lineTo(hw * 0.82, -hh * 0.4 - stemH);
  ctx.strokeStyle = col;
  ctx.lineWidth   = Math.max(1.5, s * 0.085);
  ctx.lineCap     = 'round';
  ctx.stroke();
  ctx.restore();

  // Right note
  ctx.save();
  ctx.translate(gap * 0.5, -s * 0.2);
  ctx.save();
  ctx.rotate(-0.38);
  ctx.beginPath();
  ctx.ellipse(0, 0, hw, hh, 0, 0, Math.PI * 2);
  ctx.fillStyle = col;
  ctx.fill();
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(hw * 0.82, -hh * 0.4);
  ctx.lineTo(hw * 0.82, -hh * 0.4 - stemH);
  ctx.strokeStyle = col;
  ctx.lineWidth   = Math.max(1.5, s * 0.085);
  ctx.stroke();
  ctx.restore();

  // Beam connecting tops
  const ly = -(hh * 0.4 + stemH) + s * 0.2;
  const ry = -(hh * 0.4 + stemH) - s * 0.2;
  const bw = Math.max(2.5, s * 0.14);
  ctx.beginPath();
  ctx.moveTo(-gap * 0.5 + hw * 0.82, ly);
  ctx.lineTo( gap * 0.5 + hw * 0.82, ry);
  ctx.lineWidth   = bw;
  ctx.strokeStyle = col;
  ctx.lineCap     = 'butt';
  ctx.stroke();
}

function trebleClef(ctx, s, col) {
  // Approximate treble clef with bezier curves, scaled to size s
  const sc = s / 22;
  ctx.save();
  ctx.scale(sc, sc);
  ctx.strokeStyle = col;
  ctx.lineWidth   = 2.2 / sc;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';

  ctx.beginPath();
  // Main swooping line
  ctx.moveTo(0, 28);
  ctx.bezierCurveTo( 14, 28,  18, 16,  18,  6);
  ctx.bezierCurveTo( 18, -4,  12, -16,   0, -22);
  ctx.bezierCurveTo(-12, -28, -16, -18, -14,  -6);
  ctx.bezierCurveTo(-12,   4,  -4,  10,   6,  10);
  ctx.bezierCurveTo( 16,  10,  18,   2,  18,  -4);
  ctx.bezierCurveTo( 18, -12,  14, -18,   6, -18);
  ctx.bezierCurveTo( -4, -18,  -6,  -8,  -2,  -2);
  ctx.stroke();

  // Bottom curl
  ctx.beginPath();
  ctx.moveTo(0, 28);
  ctx.bezierCurveTo(-8, 32, -12, 36, -8, 40);
  ctx.bezierCurveTo(-4, 44,  6,  42,  8, 36);
  ctx.bezierCurveTo(10, 30,  4,  26,  0, 28);
  ctx.stroke();

  ctx.restore();
}

function drawNote(ctx, n) {
  const { size, type, col, rot, life, maxLife } = n;
  const fadeIn  = Math.min(life / 0.6, 1);
  const fadeOut = Math.min((maxLife - life) / 1.0, 1);
  ctx.globalAlpha = fadeIn * fadeOut;

  ctx.save();
  ctx.translate(n.x, n.y);
  ctx.rotate(rot);

  const fillCol = `hsl(${col.h},${col.s}%,${col.l}%)`;

  // Soft glow
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 1.8);
  glow.addColorStop(0,   `hsla(${col.h},${col.s}%,${col.l}%,0.25)`);
  glow.addColorStop(1,   `hsla(${col.h},${col.s}%,${col.l}%,0)`);
  ctx.beginPath();
  ctx.arc(0, 0, size * 1.8, 0, Math.PI * 2);
  ctx.fillStyle = glow;
  ctx.fill();

  if (type === 'quarter')      quarterNote(ctx, size, fillCol);
  else if (type === 'eighth')  eighthPair(ctx, size, fillCol);
  else                         trebleClef(ctx, size, fillCol);

  ctx.restore();
}

export default { name, init, update, draw };

export function draw(ctx, state) {
  ctx.save();
  [...state.notes].sort((a, b) => a.size - b.size).forEach(n => drawNote(ctx, n));
  ctx.globalAlpha = 1;
  ctx.restore();
}
