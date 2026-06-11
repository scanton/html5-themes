// Koi Fish — top-down view, the way you see koi in a pond.
// The body is built from a spine of segments displaced by a travelling
// sine wave, so the whole fish undulates as it swims. Flowing veil tail,
// pectoral fins that sweep, organic colour patches (Kohaku-style), and a
// refracted drop shadow cast on the pond floor below.

export const name = 'Koi Fish';

function rand(min, max) { return min + Math.random() * (max - min); }

const COLORS = [
  // classic Kohaku: white body, orange-red patches
  { base: { h: 36, s: 30, l: 94 }, patch: { h: 14, s: 92, l: 52 }, fin: { h: 30, s: 25, l: 88 } },
  // orange Hi Utsuri style
  { base: { h: 22, s: 95, l: 56 }, patch: { h: 40, s: 40, l: 92 }, fin: { h: 22, s: 80, l: 62 } },
  // Yamabuki — gold
  { base: { h: 44, s: 85, l: 62 }, patch: { h: 46, s: 50, l: 84 }, fin: { h: 44, s: 70, l: 68 } },
  // Shiro Bekko: white with black patches
  { base: { h: 220, s: 8, l: 93 }, patch: { h: 230, s: 25, l: 16 }, fin: { h: 220, s: 8, l: 86 } },
  // Aka Matsuba — deep red
  { base: { h: 4, s: 80, l: 48 }, patch: { h: 14, s: 90, l: 60 }, fin: { h: 4, s: 65, l: 54 } },
];

const SEGS = 10;   // spine segments

function makeKoi(w, h, spreadXY) {
  const col = COLORS[Math.floor(rand(0, COLORS.length))];
  const len = rand(60, 110);
  const angle = rand(0, Math.PI * 2);
  const speed = rand(22, 46);
  // 1-3 patch blobs, each with position along spine + size + side offset
  const patches = [];
  const n = 1 + Math.floor(rand(0, 2.6));
  for (let i = 0; i < n; i++) {
    patches.push({
      u:    rand(0.08, 0.75),          // position along body 0=head 1=tail
      v:    rand(-0.5, 0.5),           // side offset
      rx:   rand(0.10, 0.22),          // size relative to len
      ry:   rand(0.07, 0.13),
      ang:  rand(0, Math.PI),
    });
  }
  return {
    x: rand(len, w - len),
    y: spreadXY ? rand(len, h - len) : h + len + rand(0, 50),
    len, col, patches,
    angle,
    speed,
    turn:      rand(0, Math.PI * 2),
    turnRate:  rand(0.15, 0.4) * (Math.random() < 0.5 ? 1 : -1),
    turnAmp:   rand(0.25, 0.6),
    undulate:  rand(0, Math.PI * 2),
    alpha:     rand(0.88, 1.0),
    life:      0,
    maxLife:   rand(14, 28),
  };
}

export function init(w, h, density = 1) {
  const fish = [];
  const initCount = Math.round(7 * density);
  for (let i = 0; i < initCount; i++) fish.push(makeKoi(w, h, true));
  return { fish, w, h, timer: 0 };
}

export function update(state, dt, elapsed, density = 1) {
  const { fish, w, h } = state;
  state.timer += dt;
  if (state.timer > 2.2 && fish.length < Math.round(10 * density)) {
    fish.push(makeKoi(w, h, false));
    state.timer = 0;
  }
  for (let i = fish.length - 1; i >= 0; i--) {
    const f = fish[i];
    f.life += dt;
    f.turn += f.turnRate * dt;
    f.angle += Math.sin(f.turn) * f.turnAmp * dt;
    // tail-beat frequency scales with speed
    f.undulate += (2.2 + f.speed * 0.03) * dt;
    f.x += Math.cos(f.angle) * f.speed * dt;
    f.y += Math.sin(f.angle) * f.speed * dt;
    const m = f.len * 1.6;
    if (f.x < -m) f.x = w + m * 0.9;
    if (f.x > w + m) f.x = -m * 0.9;
    if (f.y < -m) f.y = h + m * 0.9;
    if (f.y > h + m) f.y = -m * 0.9;
    if (f.life > f.maxLife) fish.splice(i, 1);
  }
}

// Compute spine points + body half-widths in local coords (nose at +x).
// Wave travels head -> tail; amplitude grows toward the tail.
function spine(f) {
  const { len, undulate } = f;
  const pts = [];
  for (let i = 0; i <= SEGS; i++) {
    const u = i / SEGS;                       // 0 = nose, 1 = tail base
    const x = len * (0.5 - u);
    const amp = len * 0.055 * Math.pow(u, 1.6);
    const y = Math.sin(undulate - u * 3.2) * amp;
    // top-down koi width profile: blunt round head, widest at shoulders,
    // long taper to the caudal peduncle
    const wProfile =
      u < 0.18 ? 0.105 * Math.sqrt(1 - Math.pow((0.18 - u) / 0.18, 2)) + 0.075
               : 0.18 - 0.135 * Math.pow((u - 0.18) / 0.82, 1.25);
    pts.push({ x, y, w: len * Math.max(wProfile, 0.02), u });
  }
  return pts;
}

function bodyPath(ctx, pts) {
  ctx.beginPath();
  // right side nose -> tail
  ctx.moveTo(pts[0].x + pts[0].w * 0.4, pts[0].y);   // nose tip rounding
  for (let i = 0; i <= SEGS; i++) {
    const p = pts[i];
    ctx.lineTo(p.x, p.y + p.w);
  }
  // around tail base
  const tb = pts[SEGS];
  ctx.lineTo(tb.x - tb.w, tb.y);
  // left side tail -> nose
  for (let i = SEGS; i >= 0; i--) {
    const p = pts[i];
    ctx.lineTo(p.x, p.y - p.w);
  }
  ctx.closePath();
}

function tailPath(ctx, f, pts) {
  // flowing veil tail: fan from the caudal peduncle, swept by the wave
  const { len, undulate } = f;
  const tb = pts[SEGS];
  const sweep = Math.sin(undulate - 3.9) * len * 0.16;
  const tipX = tb.x - len * 0.34;
  ctx.beginPath();
  ctx.moveTo(tb.x, tb.y - tb.w * 0.6);
  ctx.bezierCurveTo(tb.x - len * 0.12, tb.y - len * 0.10 + sweep * 0.4,
                    tipX + len * 0.04, tb.y - len * 0.15 + sweep,
                    tipX,              tb.y - len * 0.09 + sweep);
  ctx.quadraticCurveTo(tb.x - len * 0.18, tb.y + sweep * 0.5,
                       tipX,              tb.y + len * 0.09 + sweep);
  ctx.bezierCurveTo(tipX + len * 0.04, tb.y + len * 0.15 + sweep,
                    tb.x - len * 0.12, tb.y + len * 0.10 + sweep * 0.4,
                    tb.x, tb.y + tb.w * 0.6);
  ctx.closePath();
}

function pectorals(ctx, f, pts, col, a) {
  // sweeping pectoral fins just behind the head, beating gently
  const { len, undulate } = f;
  const p = pts[2];
  const beat = Math.sin(undulate * 0.9 + 1.0) * 0.22;
  [[1, beat], [-1, -beat]].forEach(([side, b]) => {
    ctx.save();
    ctx.translate(p.x, p.y + side * p.w * 0.85);
    ctx.rotate(side * (0.85 + b));
    ctx.beginPath();
    ctx.ellipse(len * 0.085, 0, len * 0.105, len * 0.045, 0, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${col.fin.h},${col.fin.s}%,${col.fin.l}%,${a * 0.75})`;
    ctx.fill();
    ctx.strokeStyle = `hsla(${col.fin.h},${col.fin.s}%,${Math.max(col.fin.l - 30, 10)}%,${a * 0.35})`;
    ctx.lineWidth = Math.max(0.5, len * 0.008);
    ctx.stroke();
    ctx.restore();
  });
}

function drawKoi(ctx, f) {
  const { len, col, angle, alpha, life, maxLife, patches } = f;
  const fadeIn  = Math.min(life / 1.2, 1);
  const fadeOut = Math.min((maxLife - life) / 2.2, 1);
  const a = alpha * fadeIn * fadeOut;
  const pts = spine(f);

  ctx.save();
  ctx.translate(f.x, f.y);
  ctx.rotate(angle);

  // ── refracted shadow on pond floor: offset, blurred, wobbly ──
  ctx.save();
  ctx.translate(len * 0.10, len * 0.16);
  ctx.scale(1.04, 1.04);
  bodyPath(ctx, pts);
  ctx.fillStyle = `rgba(0,12,10,${0.28 * a})`;
  ctx.filter = 'blur(3px)';
  ctx.fill();
  tailPath(ctx, f, pts);
  ctx.fill();
  ctx.filter = 'none';
  ctx.restore();

  // ── tail (behind body) ──
  tailPath(ctx, f, pts);
  const tailGrad = ctx.createLinearGradient(pts[SEGS].x, 0, pts[SEGS].x - len * 0.36, 0);
  tailGrad.addColorStop(0, `hsla(${col.fin.h},${col.fin.s}%,${col.fin.l}%,${a * 0.85})`);
  tailGrad.addColorStop(1, `hsla(${col.fin.h},${col.fin.s}%,${col.fin.l}%,${a * 0.25})`);
  ctx.fillStyle = tailGrad;
  ctx.fill();

  // ── pectoral fins ──
  pectorals(ctx, f, pts, col, a);

  // ── body ──
  bodyPath(ctx, pts);
  const bg = ctx.createLinearGradient(0, -len * 0.18, 0, len * 0.18);
  bg.addColorStop(0,   `hsla(${col.base.h},${col.base.s}%,${Math.min(col.base.l + 5, 97)}%,${a})`);
  bg.addColorStop(0.5, `hsla(${col.base.h},${col.base.s}%,${col.base.l}%,${a})`);
  bg.addColorStop(1,   `hsla(${col.base.h},${col.base.s}%,${Math.max(col.base.l - 14, 8)}%,${a})`);
  ctx.fillStyle = bg;
  ctx.fill();

  // ── colour patches, clipped to the body ──
  ctx.save();
  bodyPath(ctx, pts);
  ctx.clip();
  patches.forEach(pt => {
    const si = Math.min(SEGS, Math.max(0, Math.round(pt.u * SEGS)));
    const sp = pts[si];
    ctx.save();
    ctx.translate(sp.x, sp.y + pt.v * sp.w * 1.4);
    ctx.rotate(pt.ang);
    ctx.beginPath();
    ctx.ellipse(0, 0, len * pt.rx, len * pt.ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${col.patch.h},${col.patch.s}%,${col.patch.l}%,${a * 0.96})`;
    ctx.fill();
    ctx.restore();
  });
  // dorsal highlight stripe down the spine — the wet-back sheen
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i <= SEGS; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.strokeStyle = `hsla(${col.base.h},${Math.round(col.base.s * 0.5)}%,98%,${a * 0.30})`;
  ctx.lineWidth = len * 0.045;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();

  // body edge
  bodyPath(ctx, pts);
  ctx.strokeStyle = `hsla(${col.base.h},${col.base.s}%,${Math.max(col.base.l - 35, 6)}%,${a * 0.30})`;
  ctx.lineWidth = Math.max(0.6, len * 0.009);
  ctx.stroke();

  // ── head details: eyes on the sides (top-down) ──
  const hp = pts[1];
  [[1], [-1]].forEach(([side]) => {
    ctx.beginPath();
    ctx.arc(hp.x + len * 0.015, hp.y + side * hp.w * 0.74, Math.max(1.4, len * 0.022), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(10,10,12,${a})`;
    ctx.fill();
  });

  ctx.restore();
}

export default { name, init, update, draw };

export function draw(ctx, state) {
  ctx.save();
  // depth order: small (far) fish draw first, large (near) on top
  [...state.fish].sort((a, b) => a.len - b.len)
    .forEach(f => drawKoi(ctx, f));
  ctx.globalAlpha = 1;
  ctx.restore();
}
