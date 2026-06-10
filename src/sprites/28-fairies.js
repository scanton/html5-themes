// Fairies — glowing tiny fairies that flit about, leaving sparkle trails.
// Each fairy has a body, two wing pairs, and radiates a soft coloured glow.
// They move in curving looping paths with quick darts of speed.

export const name = 'Fairies';

function rand(min, max) { return min + Math.random() * (max - min); }

const COLORS = [
  { h: 290, s: 90, l: 75 },  // violet
  { h: 340, s: 85, l: 75 },  // rose
  { h: 180, s: 80, l: 72 },  // aqua
  { h: 55,  s: 95, l: 72 },  // gold
  { h: 210, s: 80, l: 75 },  // periwinkle
];

function makeFairy(w, h, spreadXY) {
  const col = COLORS[Math.floor(rand(0, COLORS.length))];
  const sz  = rand(10, 22);
  const sparkles = [];
  return {
    x:         spreadXY ? rand(sz, w - sz) : rand(sz, w - sz),
    y:         spreadXY ? rand(sz, h - sz) : h + sz + rand(0, 60),
    sz, col,
    vx:        rand(-60, 60),
    vy:        -(rand(20, 60)),
    dart:      rand(0, Math.PI * 2),
    dartRate:  rand(0.8, 2.0),
    dartAmp:   rand(60, 140),
    wingFlap:  rand(0, Math.PI * 2),
    wingRate:  rand(12, 20),
    glow:      rand(0, Math.PI * 2),
    glowRate:  rand(1.5, 3.0),
    sparkles,
    life:      0,
    maxLife:   rand(8, 18),
    sparkTimer: 0,
  };
}

export function init(w, h) {
  const fairies = [];
  for (let i = 0; i < 10; i++) fairies.push(makeFairy(w, h, true));
  return { fairies, w, h, timer: 0 };
}

export function update(state, dt) {
  const { fairies, w, h } = state;
  state.timer += dt;
  if (state.timer > 1.0 && fairies.length < 16) {
    fairies.push(makeFairy(w, h, false));
    state.timer = 0;
  }
  for (let i = fairies.length - 1; i >= 0; i--) {
    const f = fairies[i];
    f.life      += dt;
    f.dart      += f.dartRate * dt;
    f.wingFlap  += f.wingRate * dt;
    f.glow      += f.glowRate * dt;
    f.sparkTimer += dt;

    // Darting motion — smooth sinusoidal course changes
    const ax = Math.cos(f.dart) * f.dartAmp * 0.5;
    const ay = Math.sin(f.dart * 1.3) * f.dartAmp * 0.35;
    f.vx = f.vx * 0.92 + ax * dt;
    f.vy = f.vy * 0.92 + ay * dt - 18 * dt;  // float upward gently
    f.x += f.vx * dt;
    f.y += f.vy * dt;

    // Spawn sparkles
    if (f.sparkTimer > 0.06) {
      f.sparkTimer = 0;
      f.sparkles.push({ x: f.x, y: f.y, life: 0, maxLife: rand(0.4, 0.9),
                        r: rand(1, 3.5), col: f.col });
    }
    for (let si = f.sparkles.length - 1; si >= 0; si--) {
      const s = f.sparkles[si];
      s.life += dt;
      if (s.life > s.maxLife) f.sparkles.splice(si, 1);
    }

    // Wrap
    if (f.x < -f.sz * 3) f.x = w + f.sz;
    if (f.x > w + f.sz * 3) f.x = -f.sz;
    if (f.y < -f.sz * 3) f.y = h + f.sz;
    if (f.life > f.maxLife) fairies.splice(i, 1);
  }
}

function drawWing(ctx, px, py, angle, length, col, alpha) {
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.ellipse(0, 0, length, length * 0.38, 0, 0, Math.PI * 2);
  ctx.fillStyle = `hsla(${col.h},${col.s}%,${col.l}%,${alpha * 0.38})`;
  ctx.fill();
  ctx.strokeStyle = `hsla(${col.h},${col.s}%,${col.l}%,${alpha * 0.55})`;
  ctx.lineWidth = 0.7;
  ctx.stroke();
  ctx.restore();
}

function drawFairy(ctx, f) {
  const { sz, col, wingFlap, glow, alpha, life, maxLife, sparkles } = f;
  const fadeIn  = Math.min(life / 0.8, 1);
  const fadeOut = Math.min((maxLife - life) / 1.5, 1);
  const a = (alpha || 0.9) * fadeIn * fadeOut;

  ctx.save();
  ctx.translate(f.x, f.y);

  // Sparkle trail
  sparkles.forEach(s => {
    const sa = (1 - s.life / s.maxLife) * 0.85;
    ctx.beginPath();
    ctx.arc(s.x - f.x, s.y - f.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${s.col.h},${s.col.s}%,${s.col.l + 15}%,${sa})`;
    ctx.fill();
  });

  // Outer glow
  const glowPulse = 0.85 + Math.sin(glow) * 0.15;
  const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, sz * 2.5 * glowPulse);
  gr.addColorStop(0, `hsla(${col.h},${col.s}%,${col.l + 10}%,${a * 0.45})`);
  gr.addColorStop(1, `hsla(${col.h},${col.s}%,${col.l}%,0)`);
  ctx.beginPath();
  ctx.arc(0, 0, sz * 2.5 * glowPulse, 0, Math.PI * 2);
  ctx.fillStyle = gr;
  ctx.fill();

  // Wings — two pairs, flapping
  const flapAngle = Math.sin(wingFlap) * 0.35;
  // Upper wings
  drawWing(ctx, -sz * 0.1, -sz * 0.1, -0.5 + flapAngle, sz * 0.88, col, a);
  drawWing(ctx,  sz * 0.1, -sz * 0.1,  0.5 - flapAngle, sz * 0.88, col, a);
  // Lower wings (smaller)
  drawWing(ctx, -sz * 0.08, sz * 0.15, -0.9 + flapAngle * 0.6, sz * 0.60, col, a);
  drawWing(ctx,  sz * 0.08, sz * 0.15,  0.9 - flapAngle * 0.6, sz * 0.60, col, a);

  // Body — slender oval
  ctx.beginPath();
  ctx.ellipse(0, 0, sz * 0.22, sz * 0.52, 0, 0, Math.PI * 2);
  const bodyGrad = ctx.createLinearGradient(0, -sz * 0.5, 0, sz * 0.5);
  bodyGrad.addColorStop(0, `hsla(${col.h},${col.s}%,${col.l + 12}%,${a})`);
  bodyGrad.addColorStop(1, `hsla(${col.h},${col.s}%,${col.l - 8}%,${a})`);
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  // Head
  ctx.beginPath();
  ctx.arc(0, -sz * 0.52, sz * 0.20, 0, Math.PI * 2);
  ctx.fillStyle = `hsl(${col.h - 10},${col.s * 0.5}%,88%)`;
  ctx.fill();

  // Wand sparkle at top
  const wandY = -sz * 0.82;
  ctx.beginPath();
  ctx.arc(sz * 0.28, wandY, sz * 0.14, 0, Math.PI * 2);
  ctx.fillStyle = `hsla(${col.h},${col.s}%,${col.l + 18}%,${a})`;
  ctx.fill();
  // Wand cross sparkle
  ctx.strokeStyle = `hsla(${col.h},${col.s}%,${col.l + 18}%,${a * 0.8})`;
  ctx.lineWidth   = 0.8;
  ctx.lineCap     = 'round';
  [[sz * 0.28 - sz * 0.18, wandY, sz * 0.28 + sz * 0.18, wandY],
   [sz * 0.28, wandY - sz * 0.18, sz * 0.28, wandY + sz * 0.18]].forEach(([x1, y1, x2, y2]) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  });

  ctx.restore();
}

export default { name, init, update, draw };

export function draw(ctx, state) {
  ctx.save();
  state.fairies.forEach(f => drawFairy(ctx, f));
  ctx.globalAlpha = 1;
  ctx.restore();
}
