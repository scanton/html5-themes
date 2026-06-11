// Skulls — classic jolly-roger skull & crossbones, properly drawn.
// Crossbones sit BEHIND the skull. The skull has a domed cranium,
// flared cheekbones, a narrower jaw with separated teeth, deep shaded
// eye sockets, and a radial bone-shading gradient. Tumbles slowly.

export const name = 'Skulls';

function rand(min, max) { return min + Math.random() * (max - min); }

const COLORS = [
  { light: '#f4f0e4', mid: '#ddd6c2', dark: '#6b6354', socket: '#1c1a16' }, // bone
  { light: '#ffffff', mid: '#e8e8ee', dark: '#70707e', socket: '#16161c' }, // white
  { light: '#ffd9a8', mid: '#e8b070', dark: '#7e5828', socket: '#241404' }, // aged gold
  { light: '#ff8080', mid: '#e84848', dark: '#701414', socket: '#1c0404' }, // blood red
  { light: '#d2ff80', mid: '#a8e848', dark: '#4a7014', socket: '#101c04' }, // toxic green
];

function makeSkull(w, h, spreadXY) {
  const col  = COLORS[Math.floor(rand(0, COLORS.length))];
  const size = rand(26, 46);
  const angle = rand(0, Math.PI * 2);
  const speed = rand(34, 80);
  return {
    x:        rand(size, w - size),
    y:        spreadXY ? rand(size, h - size) : h + size * 2 + rand(0, 60),
    size, col,
    vx:       Math.cos(angle) * speed,
    vy:       -Math.abs(Math.sin(angle)) * speed - 18,  // drift upward
    // bounded rocking, not full flips — keeps skulls readable
    baseRot:  rand(-0.25, 0.25),
    rock:     rand(0, Math.PI * 2),
    rockRate: rand(0.5, 1.3),
    rockAmp:  rand(0.18, 0.45),
    life:     0,
    maxLife:  rand(7, 15),
  };
}

export function init(w, h, density = 1) {
  const skulls = [];
  const initCount = Math.round(10 * density);
  for (let i = 0; i < initCount; i++) skulls.push(makeSkull(w, h, true));
  return { skulls, w, h, timer: 0 };
}

export function update(state, dt, elapsed, density = 1) {
  const { skulls, w, h } = state;
  state.timer += dt;
  if (state.timer > 0.9 && skulls.length < Math.round(16 * density)) {
    skulls.push(makeSkull(w, h, false));
    state.timer = 0;
  }
  for (let i = skulls.length - 1; i >= 0; i--) {
    const s = skulls[i];
    s.life += dt;
    s.rock += s.rockRate * dt;
    s.x    += s.vx * dt;
    s.y    += s.vy * dt;
    if (s.x < -s.size * 2) s.x = w + s.size;
    if (s.x > w + s.size * 2) s.x = -s.size;
    if (s.y < -s.size * 3 || s.life > s.maxLife) skulls.splice(i, 1);
  }
}

// one bone: rounded shaft with a double knob at each end, angled `ang`
function drawBone(ctx, ang, len, sz, col) {
  ctx.save();
  ctx.rotate(ang);
  const shaftW = sz * 0.16;
  const knobR  = sz * 0.115;
  const half   = len / 2;
  // shaft
  ctx.beginPath();
  ctx.roundRect(-half, -shaftW / 2, len, shaftW, shaftW / 2);
  ctx.fillStyle = col.mid;
  ctx.fill();
  ctx.strokeStyle = col.dark;
  ctx.lineWidth = Math.max(0.8, sz * 0.030);
  ctx.stroke();
  // double knobs (classic bone ends)
  [-half, half].forEach(ex => {
    [-1, 1].forEach(side => {
      ctx.beginPath();
      ctx.arc(ex, side * knobR * 0.78, knobR, 0, Math.PI * 2);
      ctx.fillStyle = col.mid;
      ctx.fill();
      ctx.strokeStyle = col.dark;
      ctx.lineWidth = Math.max(0.8, sz * 0.030);
      ctx.stroke();
    });
  });
  ctx.restore();
}

// skull outline: dome, temples, flared cheekbones, narrower jaw
function skullPath(ctx, s) {
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.66);                                            // crown
  ctx.bezierCurveTo( s * 0.42, -s * 0.66,  s * 0.60, -s * 0.40,  s * 0.58, -s * 0.10); // right dome
  ctx.bezierCurveTo( s * 0.57,  s * 0.04,  s * 0.52,  s * 0.10,  s * 0.50,  s * 0.16); // temple in
  ctx.bezierCurveTo( s * 0.56,  s * 0.20,  s * 0.56,  s * 0.28,  s * 0.46,  s * 0.32); // cheekbone flare
  ctx.bezierCurveTo( s * 0.38,  s * 0.36,  s * 0.34,  s * 0.38,  s * 0.32,  s * 0.46); // into jaw
  ctx.bezierCurveTo( s * 0.30,  s * 0.58,  s * 0.18,  s * 0.64,  0,        s * 0.64);  // jaw bottom
  ctx.bezierCurveTo(-s * 0.18,  s * 0.64, -s * 0.30,  s * 0.58, -s * 0.32,  s * 0.46);
  ctx.bezierCurveTo(-s * 0.34,  s * 0.38, -s * 0.38,  s * 0.36, -s * 0.46,  s * 0.32);
  ctx.bezierCurveTo(-s * 0.56,  s * 0.28, -s * 0.56,  s * 0.20, -s * 0.50,  s * 0.16);
  ctx.bezierCurveTo(-s * 0.52,  s * 0.10, -s * 0.57,  s * 0.04, -s * 0.58, -s * 0.10);
  ctx.bezierCurveTo(-s * 0.60, -s * 0.40, -s * 0.42, -s * 0.66,  0,       -s * 0.66);
  ctx.closePath();
}

function drawSkull(ctx, sk) {
  const { size: s, col, baseRot, rock, rockAmp, life, maxLife } = sk;
  const rot = baseRot + Math.sin(rock) * rockAmp;
  const fadeIn  = Math.min(life / 0.5, 1);
  const fadeOut = Math.min((maxLife - life) / 1.0, 1);
  ctx.globalAlpha = fadeIn * fadeOut;

  ctx.save();
  ctx.translate(sk.x, sk.y);
  ctx.rotate(rot);

  // ── crossbones behind ─────────────────────────────────────
  drawBone(ctx,  Math.PI / 4, s * 1.9, s, col);
  drawBone(ctx, -Math.PI / 4, s * 1.9, s, col);

  // ── cranium with bone shading ─────────────────────────────
  skullPath(ctx, s);
  const grad = ctx.createRadialGradient(-s * 0.18, -s * 0.30, s * 0.1,
                                         0, 0, s * 0.85);
  grad.addColorStop(0, col.light);
  grad.addColorStop(0.7, col.mid);
  grad.addColorStop(1, col.dark);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = col.dark;
  ctx.lineWidth   = Math.max(1, s * 0.040);
  ctx.lineJoin    = 'round';
  ctx.stroke();

  // ── eye sockets: big angled ovals, deep shadow with inner glint ──
  [[-1, 0], [1, 0]].forEach(([side]) => {
    ctx.save();
    ctx.translate(side * s * 0.26, -s * 0.06);
    ctx.rotate(side * 0.28);
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.165, s * 0.205, 0, 0, Math.PI * 2);
    const eg = ctx.createRadialGradient(0, s * 0.05, 0, 0, 0, s * 0.21);
    eg.addColorStop(0, col.socket);
    eg.addColorStop(0.8, col.socket);
    eg.addColorStop(1, col.dark);
    ctx.fillStyle = eg;
    ctx.fill();
    ctx.restore();
  });

  // ── nasal cavity: inverted-heart ──────────────────────────
  ctx.beginPath();
  ctx.moveTo(0, s * 0.30);
  ctx.bezierCurveTo(-s * 0.10, s * 0.22, -s * 0.085, s * 0.10, 0, s * 0.135);
  ctx.bezierCurveTo( s * 0.085, s * 0.10,  s * 0.10, s * 0.22, 0, s * 0.30);
  ctx.closePath();
  ctx.fillStyle = col.socket;
  ctx.fill();

  // ── teeth: upper row on the jaw with separation lines ─────
  const tw = s * 0.105, th = s * 0.155, ty = s * 0.475;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.roundRect(i * tw - tw * 0.44, ty, tw * 0.88, th, tw * 0.22);
    ctx.fillStyle = col.light;
    ctx.fill();
    ctx.strokeStyle = col.dark;
    ctx.lineWidth = Math.max(0.6, s * 0.022);
    ctx.stroke();
  }

  // brow shading line above sockets
  ctx.beginPath();
  ctx.moveTo(-s * 0.40, -s * 0.245);
  ctx.quadraticCurveTo(0, -s * 0.33, s * 0.40, -s * 0.245);
  ctx.strokeStyle = col.dark;
  ctx.lineWidth = Math.max(0.7, s * 0.024);
  ctx.globalAlpha *= 0.45;
  ctx.stroke();

  ctx.restore();
}

export default { name, init, update, draw };

export function draw(ctx, state) {
  ctx.save();
  // depth order: small (far) skulls draw first, large (near) on top
  [...state.skulls].sort((a, b) => a.size - b.size)
    .forEach(s => drawSkull(ctx, s));
  ctx.globalAlpha = 1;
  ctx.restore();
}
