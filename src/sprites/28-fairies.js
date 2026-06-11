// Fairies — cute storybook fairies: a little figure in a petal dress with
// flowing hair, big butterfly wings that shimmer as they flap, a warm
// glow, and a trail of falling pixie dust that twinkles out.
// They hover and flit: drift gently, then dart, then hover again.

export const name = 'Fairies';

function rand(min, max) { return min + Math.random() * (max - min); }

const COLORS = [
  { h: 285, s: 80, l: 72, hair: '#f4d890', skin: '#ffe8d4' },  // violet / blonde
  { h: 335, s: 80, l: 74, hair: '#7a4a28', skin: '#ffdfc4' },  // rose / brunette
  { h: 185, s: 75, l: 68, hair: '#2c2c3c', skin: '#f4d0b0' },  // aqua / black hair
  { h:  48, s: 90, l: 70, hair: '#d4503c', skin: '#ffe4cc' },  // gold / red hair
  { h: 215, s: 75, l: 72, hair: '#e8e8f0', skin: '#ffe8d8' },  // periwinkle / silver
];

function makeFairy(w, h, spreadXY) {
  const col = COLORS[Math.floor(rand(0, COLORS.length))];
  const sz  = rand(16, 26);
  return {
    x: rand(sz * 2, w - sz * 2),
    y: spreadXY ? rand(sz * 2, h - sz * 2) : h + sz * 2 + rand(0, 60),
    sz, col,
    vx: rand(-20, 20),
    vy: rand(-30, -10),
    // hover/dart cycle
    mode:      'hover',
    modeTimer: rand(1.0, 2.5),
    targetVx:  0,
    targetVy:  0,
    bob:       rand(0, Math.PI * 2),     // hover bobbing
    bobRate:   rand(2.2, 3.4),
    wingFlap:  rand(0, Math.PI * 2),
    wingRate:  rand(14, 22),
    glow:      rand(0, Math.PI * 2),
    glowRate:  rand(1.2, 2.4),
    face:      Math.random() < 0.5 ? 1 : -1,   // facing direction
    dust:      [],
    dustTimer: 0,
    life:      0,
    maxLife:   rand(10, 20),
  };
}

export function init(w, h, density = 1) {
  const fairies = [];
  const initCount = Math.round(8 * density);
  for (let i = 0; i < initCount; i++) fairies.push(makeFairy(w, h, true));
  return { fairies, w, h, timer: 0 };
}

export function update(state, dt, elapsed, density = 1) {
  const { fairies, w, h } = state;
  state.timer += dt;
  if (state.timer > 1.4 && fairies.length < Math.round(12 * density)) {
    fairies.push(makeFairy(w, h, false));
    state.timer = 0;
  }
  for (let i = fairies.length - 1; i >= 0; i--) {
    const f = fairies[i];
    f.life      += dt;
    f.bob       += f.bobRate * dt;
    f.wingFlap  += f.wingRate * dt;
    f.glow      += f.glowRate * dt;
    f.modeTimer -= dt;
    f.dustTimer += dt;

    // hover <-> dart state machine
    if (f.modeTimer <= 0) {
      if (f.mode === 'hover') {
        f.mode = 'dart';
        f.modeTimer = rand(0.4, 0.9);
        const ang = rand(0, Math.PI * 2);
        const sp  = rand(90, 170);
        f.targetVx = Math.cos(ang) * sp;
        f.targetVy = Math.sin(ang) * sp * 0.7 - 20;
      } else {
        f.mode = 'hover';
        f.modeTimer = rand(1.2, 3.0);
        f.targetVx = rand(-14, 14);
        f.targetVy = rand(-18, 6);
      }
    }
    const ease = f.mode === 'dart' ? 4.0 : 2.0;
    f.vx += (f.targetVx - f.vx) * ease * dt;
    f.vy += (f.targetVy - f.vy) * ease * dt;
    f.x += f.vx * dt;
    f.y += (f.vy + Math.sin(f.bob) * 9) * dt;
    if (Math.abs(f.vx) > 6) f.face = f.vx > 0 ? 1 : -1;

    // pixie dust falls from the fairy, twinkles, fades
    // (stop emitting once the fairy has expired, so it can be removed)
    if (f.life <= f.maxLife && f.dustTimer > 0.05) {
      f.dustTimer = 0;
      f.dust.push({
        x: f.x + rand(-f.sz * 0.3, f.sz * 0.3),
        y: f.y + f.sz * 0.5,
        vx: rand(-6, 6) - f.vx * 0.1,
        vy: rand(4, 16),
        r: rand(0.8, 2.4),
        tw: rand(0, Math.PI * 2),
        twRate: rand(6, 14),
        life: 0,
        maxLife: rand(0.6, 1.4),
      });
    }
    for (let di = f.dust.length - 1; di >= 0; di--) {
      const d = f.dust[di];
      d.life += dt;
      d.tw   += d.twRate * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.vy += 18 * dt;     // dust settles
      if (d.life > d.maxLife) f.dust.splice(di, 1);
    }

    // soft wrap
    const m = f.sz * 4;
    if (f.x < -m) f.x = w + m * 0.8;
    if (f.x > w + m) f.x = -m * 0.8;
    if (f.y < -m) f.y = h + m * 0.8;
    if (f.y > h + m) f.y = -m * 0.8;
    if (f.life > f.maxLife && f.dust.length === 0) fairies.splice(i, 1);
  }
}

// one butterfly wing: upper lobe + lower lobe, drawn pointing right
function wingPath(ctx, s) {
  ctx.beginPath();
  // upper lobe — big and round
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(s * 0.45, -s * 0.85, s * 1.25, -s * 0.95, s * 1.30, -s * 0.35);
  ctx.bezierCurveTo(s * 1.32, -s * 0.05, s * 0.85,  s * 0.08, s * 0.30,  s * 0.05);
  // lower lobe — smaller teardrop
  ctx.bezierCurveTo(s * 0.80,  s * 0.18, s * 0.95,  s * 0.60, s * 0.60,  s * 0.72);
  ctx.bezierCurveTo(s * 0.28,  s * 0.80, s * 0.05,  s * 0.40, 0, 0);
  ctx.closePath();
}

function drawWingPair(ctx, sz, col, flap, a, behind) {
  // flap compresses the wings horizontally (they beat toward the viewer)
  const fl = behind ? 0.55 + flap * 0.45 : 0.62 + flap * 0.38;
  const wingS = sz * (behind ? 0.78 : 0.95);
  const lShift = behind ? 0.10 : 0.0;
  [[1], [-1]].forEach(([side]) => {
    ctx.save();
    ctx.translate(side * sz * 0.10, -sz * (0.18 - lShift));
    ctx.scale(side * fl, 1);
    wingPath(ctx, wingS);
    const wg = ctx.createRadialGradient(wingS * 0.3, -wingS * 0.2, 0,
                                         wingS * 0.5, -wingS * 0.1, wingS * 1.3);
    wg.addColorStop(0, `hsla(${col.h},${col.s}%,${Math.min(col.l + 20, 94)}%,${a * (behind ? 0.30 : 0.45)})`);
    wg.addColorStop(0.7, `hsla(${col.h},${col.s}%,${col.l}%,${a * (behind ? 0.22 : 0.36)})`);
    wg.addColorStop(1, `hsla(${col.h + 30},${col.s}%,${col.l}%,${a * (behind ? 0.12 : 0.22)})`);
    ctx.fillStyle = wg;
    ctx.fill();
    ctx.strokeStyle = `hsla(${col.h},${col.s}%,${Math.min(col.l + 25, 95)}%,${a * 0.55})`;
    ctx.lineWidth = Math.max(0.5, wingS * 0.030);
    ctx.stroke();
    // wing veins
    ctx.strokeStyle = `hsla(${col.h},${col.s}%,${Math.min(col.l + 25, 95)}%,${a * 0.30})`;
    ctx.lineWidth = Math.max(0.4, wingS * 0.018);
    [[-0.35, 1.05, -0.55], [-0.1, 1.15, -0.2], [0.35, 0.75, 0.55]].forEach(([y0, ex, ey]) => {
      ctx.beginPath();
      ctx.moveTo(wingS * 0.05, wingS * y0 * 0.2);
      ctx.quadraticCurveTo(wingS * ex * 0.5, wingS * ey * 0.5, wingS * ex, wingS * ey * 0.5);
      ctx.stroke();
    });
    ctx.restore();
  });
}

function drawFairy(ctx, f) {
  const { sz, col, wingFlap, glow, life, maxLife, dust, face } = f;
  const fadeIn  = Math.min(life / 0.8, 1);
  const fadeOut = Math.min((maxLife - life) / 1.5, 1);
  const a = Math.max(0, fadeIn * fadeOut);
  const flap = (Math.sin(wingFlap) + 1) / 2;     // 0..1

  // pixie dust in world space
  dust.forEach(d => {
    // dust fades on its own clock so lingering motes finish gracefully
    const da = (1 - d.life / d.maxLife) * (0.5 + 0.5 * Math.abs(Math.sin(d.tw)))
             * 0.9 * Math.max(a, 0.45);
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${col.h + 15},90%,82%,${da})`;
    ctx.fill();
    // tiny cross glint on the brightest ones
    if (d.r > 1.8) {
      ctx.strokeStyle = `hsla(${col.h + 15},90%,90%,${da * 0.7})`;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(d.x - d.r * 1.8, d.y); ctx.lineTo(d.x + d.r * 1.8, d.y);
      ctx.moveTo(d.x, d.y - d.r * 1.8); ctx.lineTo(d.x, d.y + d.r * 1.8);
      ctx.stroke();
    }
  });
  if (a <= 0) return;

  ctx.save();
  ctx.translate(f.x, f.y);
  ctx.scale(face, 1);

  // ── warm glow halo ──
  const gp = 0.85 + Math.sin(glow) * 0.15;
  const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, sz * 2.2 * gp);
  gr.addColorStop(0, `hsla(${col.h},85%,80%,${a * 0.38})`);
  gr.addColorStop(0.6, `hsla(${col.h},85%,75%,${a * 0.14})`);
  gr.addColorStop(1, `hsla(${col.h},85%,75%,0)`);
  ctx.beginPath();
  ctx.arc(0, 0, sz * 2.2 * gp, 0, Math.PI * 2);
  ctx.fillStyle = gr;
  ctx.fill();

  // ── far wing pair (behind the body) ──
  drawWingPair(ctx, sz, col, flap, a, true);

  // ── body: petal dress ──
  ctx.beginPath();
  ctx.moveTo(0, -sz * 0.10);
  ctx.bezierCurveTo( sz * 0.26, -sz * 0.02,  sz * 0.30, sz * 0.38,  sz * 0.20, sz * 0.52);
  // scalloped hem
  ctx.quadraticCurveTo( sz * 0.10, sz * 0.44, 0, sz * 0.54);
  ctx.quadraticCurveTo(-sz * 0.10, sz * 0.44, -sz * 0.20, sz * 0.52);
  ctx.bezierCurveTo(-sz * 0.30, sz * 0.38, -sz * 0.26, -sz * 0.02, 0, -sz * 0.10);
  ctx.closePath();
  const dg = ctx.createLinearGradient(0, -sz * 0.1, 0, sz * 0.55);
  dg.addColorStop(0, `hsla(${col.h},${col.s}%,${Math.min(col.l + 14, 90)}%,${a})`);
  dg.addColorStop(1, `hsla(${col.h},${col.s}%,${Math.max(col.l - 12, 30)}%,${a})`);
  ctx.fillStyle = dg;
  ctx.fill();

  // ── little legs with pointed slippers ──
  ctx.strokeStyle = `rgba(60,40,50,${a * 0.85})`;
  ctx.lineWidth = Math.max(1, sz * 0.055);
  ctx.lineCap = 'round';
  const legSwing = Math.sin(f.bob * 0.5) * sz * 0.06;
  ctx.beginPath();
  ctx.moveTo( sz * 0.08, sz * 0.50);
  ctx.quadraticCurveTo( sz * 0.12, sz * 0.70,  sz * 0.18 + legSwing, sz * 0.82);
  ctx.moveTo(-sz * 0.06, sz * 0.52);
  ctx.quadraticCurveTo(-sz * 0.08, sz * 0.72, -sz * 0.02 - legSwing, sz * 0.86);
  ctx.stroke();

  // ── arms ──
  ctx.strokeStyle = `rgba(0,0,0,0)`;
  ctx.lineWidth = Math.max(1, sz * 0.05);
  ctx.strokeStyle = colSkinStroke(col, a);
  ctx.beginPath();
  ctx.moveTo(sz * 0.16, sz * 0.02);
  ctx.quadraticCurveTo(sz * 0.34, sz * 0.04, sz * 0.42, -sz * 0.12);  // raised hand
  ctx.moveTo(-sz * 0.16, sz * 0.04);
  ctx.quadraticCurveTo(-sz * 0.28, sz * 0.16, -sz * 0.24, sz * 0.28);
  ctx.stroke();

  // wand sparkle in the raised hand
  const wandX = sz * 0.46, wandY = -sz * 0.16;
  const tws = 0.7 + Math.sin(glow * 2.3) * 0.3;
  ctx.fillStyle = `hsla(${col.h + 20},95%,85%,${a * tws})`;
  ctx.beginPath();
  ctx.arc(wandX, wandY, sz * 0.07 * tws, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = `hsla(${col.h + 20},95%,88%,${a * tws * 0.8})`;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(wandX - sz * 0.14, wandY); ctx.lineTo(wandX + sz * 0.14, wandY);
  ctx.moveTo(wandX, wandY - sz * 0.14); ctx.lineTo(wandX, wandY + sz * 0.14);
  ctx.stroke();

  // ── head ──
  ctx.beginPath();
  ctx.arc(0, -sz * 0.30, sz * 0.20, 0, Math.PI * 2);
  ctx.fillStyle = withAlpha(col.skin, a);
  ctx.fill();

  // hair: swept bob with a little flip
  ctx.beginPath();
  ctx.arc(0, -sz * 0.33, sz * 0.21, Math.PI * 0.85, Math.PI * 2.15);
  ctx.quadraticCurveTo(sz * 0.30, -sz * 0.30, sz * 0.22, -sz * 0.16);
  ctx.quadraticCurveTo(sz * 0.12, -sz * 0.26, 0, -sz * 0.245);
  ctx.quadraticCurveTo(-sz * 0.14, -sz * 0.27, -sz * 0.20, -sz * 0.18);
  ctx.quadraticCurveTo(-sz * 0.28, -sz * 0.28, -sz * 0.205, -sz * 0.37);
  ctx.closePath();
  ctx.fillStyle = withAlpha(col.hair, a);
  ctx.fill();

  // face: two dot eyes + smile (facing slightly right)
  ctx.fillStyle = `rgba(40,30,40,${a})`;
  ctx.beginPath();
  ctx.arc(sz * 0.055, -sz * 0.295, sz * 0.022, 0, Math.PI * 2);
  ctx.arc(sz * 0.135, -sz * 0.295, sz * 0.022, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = `rgba(180,80,90,${a * 0.9})`;
  ctx.lineWidth = Math.max(0.6, sz * 0.025);
  ctx.beginPath();
  ctx.arc(sz * 0.095, -sz * 0.25, sz * 0.05, 0.25, Math.PI - 0.25);
  ctx.stroke();

  // ── near wing pair (in front, brighter) ──
  drawWingPair(ctx, sz, col, flap, a, false);

  ctx.restore();
}

function withAlpha(hex, a) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function colSkinStroke(col, a) {
  return withAlpha(col.skin, a * 0.95);
}

export default { name, init, update, draw };

export function draw(ctx, state) {
  ctx.save();
  // depth order: small (far) fairies draw first, large (near) on top
  [...state.fairies].sort((a, b) => a.sz - b.sz)
    .forEach(f => drawFairy(ctx, f));
  ctx.globalAlpha = 1;
  ctx.restore();
}
