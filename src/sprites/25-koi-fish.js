// Koi Fish — graceful koi that glide slowly in arcing paths, with bodies
// that undulate as they swim. Classic orange/white/black koi colour patches.

export const name = 'Koi Fish';

function rand(min, max) { return min + Math.random() * (max - min); }

const COLORS = [
  { body: '#ff6820', patch: '#fff8f0', fin: '#cc4400' },   // orange koi
  { body: '#fff4e8', patch: '#ff6820', fin: '#e8d4b8' },   // white w/ orange
  { body: '#ff3a3a', patch: '#fff8f0', fin: '#cc1010' },   // red koi
  { body: '#ffb020', patch: '#ffffff', fin: '#cc8000' },   // gold koi
  { body: '#fff8f0', patch: '#222',    fin: '#e0d4c8' },   // white w/ black
];

function makeKoi(w, h, spreadXY) {
  const col   = COLORS[Math.floor(rand(0, COLORS.length))];
  const len   = rand(38, 72);
  const angle = rand(0, Math.PI * 2);
  const speed = rand(28, 58);
  return {
    x:         spreadXY ? rand(len, w - len) : rand(len, w - len),
    y:         spreadXY ? rand(len, h - len) : h + len + rand(0, 40),
    len, col,
    vx:        Math.cos(angle) * speed,
    vy:        Math.sin(angle) * speed,
    angle,
    turn:      rand(0, Math.PI * 2),
    turnRate:  rand(0.2, 0.55) * (Math.random() < 0.5 ? 1 : -1),
    turnAmp:   rand(0.3, 0.8),
    undulate:  rand(0, Math.PI * 2),
    undulRate: rand(2.0, 3.5),
    alpha:     rand(0.82, 0.98),
    life:      0,
    maxLife:   rand(12, 24),
    patchSeed: Math.random(),
  };
}

export function init(w, h) {
  const fish = [];
  for (let i = 0; i < 8; i++) fish.push(makeKoi(w, h, true));
  return { fish, w, h, timer: 0 };
}

export function update(state, dt) {
  const { fish, w, h } = state;
  state.timer += dt;
  if (state.timer > 1.8 && fish.length < 12) {
    fish.push(makeKoi(w, h, false));
    state.timer = 0;
  }
  for (let i = fish.length - 1; i >= 0; i--) {
    const f = fish[i];
    f.life     += dt;
    f.turn     += f.turnRate * dt;
    f.undulate += f.undulRate * dt;
    f.angle    += Math.sin(f.turn) * f.turnAmp * dt;
    const speed = Math.sqrt(f.vx * f.vx + f.vy * f.vy);
    f.vx = Math.cos(f.angle) * speed;
    f.vy = Math.sin(f.angle) * speed;
    f.x += f.vx * dt;
    f.y += f.vy * dt;
    // Wrap
    if (f.x < -f.len * 2) f.x = w + f.len;
    if (f.x > w + f.len * 2) f.x = -f.len;
    if (f.y < -f.len * 2) f.y = h + f.len;
    if (f.y > h + f.len * 2) f.y = -f.len;
    if (f.life > f.maxLife) fish.splice(i, 1);
  }
}

function drawKoi(ctx, f) {
  const { len, col, angle, undulate, alpha, life, maxLife, patchSeed } = f;
  const fadeIn  = Math.min(life / 1.0, 1);
  const fadeOut = Math.min((maxLife - life) / 2.0, 1);
  ctx.globalAlpha = alpha * fadeIn * fadeOut;

  ctx.save();
  ctx.translate(f.x, f.y);
  ctx.rotate(angle);

  const hw  = len * 0.25;   // half-width at widest
  const wav = Math.sin(undulate) * len * 0.08;  // tail wag

  // Tail fin — two triangular lobes
  const tailX = -len * 0.55;
  ctx.beginPath();
  ctx.moveTo(tailX, wav);
  ctx.lineTo(tailX - len * 0.34, -hw * 0.8 + wav * 0.5);
  ctx.lineTo(tailX - len * 0.06,  0);
  ctx.closePath();
  ctx.fillStyle = col.fin;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(tailX, wav);
  ctx.lineTo(tailX - len * 0.34,  hw * 0.8 + wav * 0.5);
  ctx.lineTo(tailX - len * 0.06,  0);
  ctx.closePath();
  ctx.fill();

  // Body — tapered ellipse, tip at nose (right)
  ctx.beginPath();
  ctx.save();
  ctx.translate(len * 0.05, 0);
  ctx.scale(1.0, 0.54);
  ctx.arc(0, 0, len * 0.52, 0, Math.PI * 2);
  ctx.restore();
  ctx.fillStyle = col.body;
  ctx.fill();
  ctx.strokeStyle = col.fin;
  ctx.lineWidth   = Math.max(0.8, len * 0.022);
  ctx.stroke();

  // Colour patch — organic blob using clip
  ctx.save();
  ctx.beginPath();
  ctx.save();
  ctx.translate(len * 0.05, 0);
  ctx.scale(1.0, 0.54);
  ctx.arc(0, 0, len * 0.52, 0, Math.PI * 2);
  ctx.restore();
  ctx.clip();
  // Blob patch position varies by patchSeed
  const px = (patchSeed - 0.5) * len * 0.3;
  ctx.beginPath();
  ctx.ellipse(px, 0, len * 0.26, len * 0.20, patchSeed * Math.PI, 0, Math.PI * 2);
  ctx.fillStyle = col.patch;
  ctx.fill();
  ctx.restore();

  // Pectoral fin — small curved fin on side
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(len * 0.08, hw * 0.9, len * 0.18, hw * 0.7, len * 0.10, hw * 0.2);
  ctx.strokeStyle = col.fin;
  ctx.lineWidth   = Math.max(1, len * 0.03);
  ctx.lineCap     = 'round';
  ctx.stroke();

  // Eye
  const eyeX = len * 0.34;
  ctx.beginPath();
  ctx.arc(eyeX, -hw * 0.18, Math.max(2, len * 0.055), 0, Math.PI * 2);
  ctx.fillStyle = '#111';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(eyeX + len * 0.014, -hw * 0.20, Math.max(0.8, len * 0.018), 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();

  ctx.restore();
}

export default { name, init, update, draw };

export function draw(ctx, state) {
  ctx.save();
  state.fish.forEach(f => drawKoi(ctx, f));
  ctx.globalAlpha = 1;
  ctx.restore();
}
