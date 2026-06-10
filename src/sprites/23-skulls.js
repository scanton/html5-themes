// Skulls — tumbling skull-and-crossbones icons for Rock & Roll.
// Each skull has an oval cranium, round eye sockets, a nose cavity, and
// crossed bones below. They spin freely and drift in all directions.

export const name = 'Skulls';

function rand(min, max) { return min + Math.random() * (max - min); }

const COLORS = [
  { fill: '#e8e8e0', stroke: '#444' },   // bone white
  { fill: '#d0c8b8', stroke: '#333' },   // aged ivory
  { fill: '#ff3333', stroke: '#880000' },// red
  { fill: '#c0ff40', stroke: '#405500' },// acid green
  { fill: '#888898', stroke: '#222' },   // grey
];

function makeSkull(w, h, spreadXY) {
  const col   = COLORS[Math.floor(rand(0, COLORS.length))];
  const size  = rand(20, 40);
  const angle = rand(0, Math.PI * 2);
  const speed = rand(50, 120);
  return {
    x:        spreadXY ? rand(size, w - size) : rand(size, w - size),
    y:        spreadXY ? rand(size, h - size) : h + size + rand(0, 60),
    size, col,
    vx:       Math.cos(angle) * speed,
    vy:       Math.sin(angle) * speed - 30,
    rot:      rand(0, Math.PI * 2),
    rotRate:  rand(-2.2, 2.2),
    life:     0,
    maxLife:  rand(6, 14),
  };
}

export function init(w, h) {
  const skulls = [];
  for (let i = 0; i < 14; i++) skulls.push(makeSkull(w, h, true));
  return { skulls, w, h, timer: 0 };
}

export function update(state, dt) {
  const { skulls, w, h } = state;
  state.timer += dt;
  if (state.timer > 0.7 && skulls.length < 20) {
    skulls.push(makeSkull(w, h, false));
    state.timer = 0;
  }
  for (let i = skulls.length - 1; i >= 0; i--) {
    const s = skulls[i];
    s.life += dt;
    s.rot  += s.rotRate * dt;
    s.x    += s.vx * dt;
    s.y    += s.vy * dt;
    s.vy   += 30 * dt; // gentle gravity drift upward cancelled by vy offset
    // Wrap
    if (s.x < -s.size * 2) s.x = w + s.size;
    if (s.x > w + s.size * 2) s.x = -s.size;
    if (s.life > s.maxLife) skulls.splice(i, 1);
  }
}

function drawSkull(ctx, s) {
  const { size: sz, col, rot, life, maxLife } = s;
  const fadeIn  = Math.min(life / 0.5, 1);
  const fadeOut = Math.min((maxLife - life) / 1.0, 1);
  ctx.globalAlpha = fadeIn * fadeOut;

  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(rot);

  const cw = sz * 0.68;   // cranium half-width
  const ch = sz * 0.56;   // cranium half-height
  const jawH = sz * 0.22; // jaw depth

  // Cranium
  ctx.beginPath();
  ctx.ellipse(0, -sz * 0.08, cw, ch, 0, 0, Math.PI * 2);
  ctx.fillStyle   = col.fill;
  ctx.fill();
  ctx.strokeStyle = col.stroke;
  ctx.lineWidth   = Math.max(1, sz * 0.045);
  ctx.stroke();

  // Jaw / cheekbones (flat bottom)
  ctx.beginPath();
  ctx.rect(-cw * 0.72, ch * 0.32, cw * 1.44, jawH);
  ctx.fillStyle = col.fill;
  ctx.fill();
  ctx.strokeStyle = col.stroke;
  ctx.lineWidth   = Math.max(0.8, sz * 0.036);
  ctx.strokeRect(-cw * 0.72, ch * 0.32, cw * 1.44, jawH);

  // Eye sockets
  const eyeR  = sz * 0.17;
  const eyeY  = -sz * 0.10;
  [-cw * 0.38, cw * 0.38].forEach(ex => {
    ctx.beginPath();
    ctx.ellipse(ex, eyeY, eyeR, eyeR * 1.1, 0, 0, Math.PI * 2);
    ctx.fillStyle = col.stroke;
    ctx.fill();
  });

  // Nose cavity (upside-down heart shape: two circles)
  const noseR = sz * 0.09;
  ctx.beginPath();
  ctx.arc(-noseR * 0.7, sz * 0.14, noseR, 0, Math.PI * 2);
  ctx.fillStyle = col.stroke;
  ctx.fill();
  ctx.beginPath();
  ctx.arc( noseR * 0.7, sz * 0.14, noseR, 0, Math.PI * 2);
  ctx.fill();

  // Teeth — 4 small rects along jaw bottom
  const toothW = cw * 0.24;
  const toothH = sz * 0.11;
  const toothY = ch * 0.32 + jawH - toothH;
  for (let t = -1.5; t <= 1.5; t++) {
    ctx.beginPath();
    ctx.rect(t * toothW * 0.92 - toothW * 0.44, toothY, toothW * 0.88, toothH);
    ctx.strokeStyle = col.stroke;
    ctx.lineWidth   = Math.max(0.5, sz * 0.025);
    ctx.stroke();
  }

  // Crossbones below
  const boneL = sz * 0.72;
  const boneY = ch * 0.32 + jawH + sz * 0.28;
  const endR  = sz * 0.12;
  [Math.PI / 4, -Math.PI / 4].forEach(ang => {
    const dx = Math.cos(ang) * boneL * 0.5;
    const dy = Math.sin(ang) * boneL * 0.5;
    // Shaft
    ctx.beginPath();
    ctx.moveTo(-dx, boneY - dy);
    ctx.lineTo( dx, boneY + dy);
    ctx.strokeStyle = col.fill;
    ctx.lineWidth   = sz * 0.13;
    ctx.lineCap     = 'butt';
    ctx.stroke();
    ctx.strokeStyle = col.stroke;
    ctx.lineWidth   = Math.max(0.8, sz * 0.04);
    ctx.stroke();
    // End knobs
    [[-dx, boneY - dy], [dx, boneY + dy]].forEach(([ex, ey]) => {
      ctx.beginPath();
      ctx.arc(ex, ey, endR, 0, Math.PI * 2);
      ctx.fillStyle = col.fill;
      ctx.fill();
      ctx.strokeStyle = col.stroke;
      ctx.lineWidth   = Math.max(0.7, sz * 0.036);
      ctx.stroke();
    });
  });

  ctx.restore();
}

export default { name, init, update, draw };

export function draw(ctx, state) {
  ctx.save();
  state.skulls.forEach(s => drawSkull(ctx, s));
  ctx.globalAlpha = 1;
  ctx.restore();
}
