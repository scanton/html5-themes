// Jellyfish — translucent moon-jelly style medusae with a properly
// connected anatomy: tentacles hang from the bell rim, frilly oral arms
// trail from the bell centre, and the bell contracts with a realistic
// pulse cycle (quick contraction, slow relaxation) that propels the
// jelly upward in surges.

export const name = 'Jellyfish';

function rand(min, max) { return min + Math.random() * (max - min); }

const COLORS = [
  { h: 190, s: 75, l: 70 },  // cyan
  { h: 265, s: 65, l: 72 },  // violet
  { h: 215, s: 75, l: 68 },  // blue
  { h: 315, s: 55, l: 74 },  // orchid
  { h: 165, s: 60, l: 68 },  // sea glass
];

const RIM_PTS = 24;   // bell rim resolution

function makeJelly(w, h, spreadXY) {
  const col = COLORS[Math.floor(rand(0, COLORS.length))];
  const r   = rand(28, 60);
  // marginal tentacles: thin, many, attached along the rim
  const tentacles = [];
  const nT = Math.floor(rand(9, 15));
  for (let i = 0; i < nT; i++) {
    tentacles.push({
      rimU:  (i + 0.5) / nT,             // 0..1 position along rim
      len:   rand(r * 1.4, r * 3.2),
      phase: rand(0, Math.PI * 2),
      rate:  rand(0.6, 1.3),
      amp:   rand(r * 0.10, r * 0.26),
    });
  }
  // oral arms: 4 thick frilly ribbons from the bell centre
  const arms = [];
  for (let i = 0; i < 4; i++) {
    arms.push({
      xOff:  (i - 1.5) * r * 0.16,
      len:   rand(r * 1.1, r * 1.9),
      phase: rand(0, Math.PI * 2),
      rate:  rand(0.4, 0.9),
      amp:   rand(r * 0.14, r * 0.30),
    });
  }
  return {
    x: rand(r, w - r),
    y: spreadXY ? rand(r, h - r) : h + r * 2 + rand(0, 80),
    r, col, tentacles, arms,
    vyBase:    -(rand(10, 22)),
    vx:        rand(-8, 8),
    pulse:     rand(0, Math.PI * 2),
    pulseRate: rand(1.4, 2.2),
    sway:      rand(0, Math.PI * 2),
    swayRate:  rand(0.18, 0.5),
    swayAmp:   rand(6, 16),
    tilt:      rand(-0.18, 0.18),
    alpha:     rand(0.60, 0.85),
    life:      0,
    maxLife:   rand(14, 26),
  };
}

export function init(w, h, density = 1) {
  const jellies = [];
  const initCount = Math.round(8 * density);
  for (let i = 0; i < initCount; i++) jellies.push(makeJelly(w, h, true));
  return { jellies, w, h, timer: 0 };
}

// Asymmetric pulse: fast contraction, slow relaxation (real medusae).
// Returns 0..1 contraction amount.
function pulseCurve(phase) {
  const p = phase % (Math.PI * 2);
  const u = p / (Math.PI * 2);
  return u < 0.3 ? Math.sin((u / 0.3) * Math.PI * 0.5)         // quick squeeze
                 : Math.cos(((u - 0.3) / 0.7) * Math.PI * 0.5); // slow release
}

export function update(state, dt, elapsed, density = 1) {
  const { jellies, w, h } = state;
  state.timer += dt;
  if (state.timer > 1.6 && jellies.length < Math.round(12 * density)) {
    jellies.push(makeJelly(w, h, false));
    state.timer = 0;
  }
  for (let i = jellies.length - 1; i >= 0; i--) {
    const j = jellies[i];
    j.life  += dt;
    j.pulse += j.pulseRate * dt;
    j.sway  += j.swayRate * dt;
    // propulsion surge follows the contraction
    const c = pulseCurve(j.pulse);
    j.x += (j.vx + Math.sin(j.sway) * j.swayAmp) * dt;
    j.y += j.vyBase * (0.4 + c * 1.6) * dt;
    j.tentacles.forEach(t => { t.phase += t.rate * dt; });
    j.arms.forEach(ar => { ar.phase += ar.rate * dt; });
    if (j.y + j.r * 4 < -10 || j.life > j.maxLife) jellies.splice(i, 1);
  }
}

// Bell rim point in local coords for contraction c (0 relaxed, 1 squeezed).
// The bell narrows and deepens when contracting; rim curls slightly under.
function rimPoint(u, r, c) {
  const ang = Math.PI * (1 + u);            // PI..2PI across the underside? no:
  // u: 0..1 left rim to right rim across the bottom of the dome
  const theta = Math.PI * u;                // 0..PI
  const bw = r * (1.0 - c * 0.22);          // bell half width
  const bh = r * (0.72 + c * 0.16);         // dome height
  const x = -Math.cos(theta) * bw;
  // rim sits at y = 0; slight under-curl when contracted
  const curl = Math.sin(theta) * c * r * 0.10;
  return { x, y: curl, bw, bh };
}

function drawJelly(ctx, j) {
  const { r, col, pulse, alpha, life, maxLife, tentacles, arms, tilt } = j;
  const c = pulseCurve(pulse);
  const fadeIn  = Math.min(life / 1.2, 1);
  const fadeOut = Math.min((maxLife - life) / 2.2, 1);
  const a = alpha * fadeIn * fadeOut;

  const bw = r * (1.0 - c * 0.22);
  const bh = r * (0.72 + c * 0.16);

  ctx.save();
  ctx.translate(j.x, j.y);
  ctx.rotate(tilt + Math.sin(j.sway) * 0.08);

  // ── ambient glow ──
  const glow = ctx.createRadialGradient(0, 0, bw * 0.2, 0, 0, bw * 2.0);
  glow.addColorStop(0, `hsla(${col.h},${col.s}%,${col.l}%,${a * 0.28})`);
  glow.addColorStop(1, `hsla(${col.h},${col.s}%,${col.l}%,0)`);
  ctx.beginPath();
  ctx.arc(0, 0, bw * 2.0, 0, Math.PI * 2);
  ctx.fillStyle = glow;
  ctx.fill();

  // ── oral arms (behind bell, from centre underside) ──
  arms.forEach(ar => {
    ctx.beginPath();
    ctx.moveTo(ar.xOff * (1 - c * 0.2), bh * 0.05);
    let px = ar.xOff * (1 - c * 0.2), py = bh * 0.05;
    const segs = 7;
    for (let s2 = 1; s2 <= segs; s2++) {
      const st = s2 / segs;
      const sx = ar.xOff * (1 - c * 0.2) + Math.sin(ar.phase + st * 3.4) * ar.amp * st;
      const sy = bh * 0.05 + st * ar.len;
      const mx = (px + sx) / 2 + Math.sin(ar.phase * 1.3 + st * 5.0) * ar.amp * 0.3;
      ctx.quadraticCurveTo(mx, (py + sy) / 2, sx, sy);
      px = sx; py = sy;
    }
    ctx.strokeStyle = `hsla(${col.h},${Math.round(col.s * 0.8)}%,${Math.min(col.l + 12, 92)}%,${a * 0.50})`;
    ctx.lineWidth = Math.max(1.4, r * 0.060);
    ctx.lineCap = 'round';
    ctx.stroke();
    // frilly edge: thinner brighter line wiggling around the arm
    ctx.strokeStyle = `hsla(${col.h},${col.s}%,${Math.min(col.l + 22, 96)}%,${a * 0.35})`;
    ctx.lineWidth = Math.max(0.6, r * 0.022);
    ctx.stroke();
  });

  // ── marginal tentacles — attached AT the rim ──
  tentacles.forEach(t => {
    const rp = rimPoint(t.rimU, r, c);
    ctx.beginPath();
    ctx.moveTo(rp.x, rp.y);
    let px = rp.x, py = rp.y;
    const segs = 9;
    for (let s2 = 1; s2 <= segs; s2++) {
      const st = s2 / segs;
      // drift trails opposite the sway; amplitude grows down the strand
      const sx = rp.x + Math.sin(t.phase + st * 4.2) * t.amp * st
                 - Math.sin(j.sway) * st * r * 0.18;
      const sy = rp.y + st * t.len;
      const mx = (px + sx) / 2 + Math.sin(t.phase * 1.4 + st * 6.0) * t.amp * 0.25 * st;
      ctx.quadraticCurveTo(mx, (py + sy) / 2, sx, sy);
      px = sx; py = sy;
    }
    const tg = ctx.createLinearGradient(rp.x, 0, rp.x, t.len);
    tg.addColorStop(0, `hsla(${col.h},${col.s}%,${col.l}%,${a * 0.60})`);
    tg.addColorStop(1, `hsla(${col.h},${col.s}%,${col.l}%,0)`);
    ctx.strokeStyle = tg;
    ctx.lineWidth = Math.max(0.7, r * 0.020);
    ctx.lineCap = 'round';
    ctx.stroke();
  });

  // ── bell dome ──
  ctx.beginPath();
  ctx.moveTo(-bw, 0);
  ctx.bezierCurveTo(-bw, -bh * 0.85, -bw * 0.55, -bh, 0, -bh);
  ctx.bezierCurveTo(bw * 0.55, -bh, bw, -bh * 0.85, bw, 0);
  // scalloped rim across the bottom
  const scallops = 6;
  for (let s2 = 0; s2 < scallops; s2++) {
    const x0 = bw - (s2 + 0) * (2 * bw / scallops);
    const x1 = bw - (s2 + 1) * (2 * bw / scallops);
    const dip = (s2 % 2 === 0 ? 1 : 0.55) * r * 0.06 * (1 + c * 0.8);
    ctx.quadraticCurveTo((x0 + x1) / 2, dip, x1, 0);
  }
  ctx.closePath();

  const bellGrad = ctx.createRadialGradient(0, -bh * 0.45, bw * 0.05, 0, -bh * 0.2, bw * 1.15);
  bellGrad.addColorStop(0,    `hsla(${col.h},${Math.round(col.s * 0.7)}%,${Math.min(col.l + 22, 95)}%,${a * 0.85})`);
  bellGrad.addColorStop(0.55, `hsla(${col.h},${col.s}%,${col.l}%,${a * 0.55})`);
  bellGrad.addColorStop(1,    `hsla(${col.h},${col.s}%,${Math.max(col.l - 10, 20)}%,${a * 0.28})`);
  ctx.fillStyle = bellGrad;
  ctx.fill();
  ctx.strokeStyle = `hsla(${col.h},${col.s}%,${Math.min(col.l + 14, 92)}%,${a * 0.50})`;
  ctx.lineWidth = Math.max(0.8, r * 0.022);
  ctx.stroke();

  // ── internal anatomy: 4-leaf-clover gonads (moon jelly signature) ──
  ctx.save();
  ctx.translate(0, -bh * 0.42);
  for (let g = 0; g < 4; g++) {
    const ga = (g / 4) * Math.PI * 2 + Math.PI / 4;
    ctx.beginPath();
    ctx.ellipse(Math.cos(ga) * bw * 0.18, Math.sin(ga) * bh * 0.16,
                bw * 0.15, bh * 0.13, ga, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${col.h},${col.s}%,${Math.min(col.l + 18, 94)}%,${a * 0.42})`;
    ctx.fill();
  }
  ctx.restore();

  // ── apex highlight — light through the dome top ──
  ctx.beginPath();
  ctx.ellipse(-bw * 0.22, -bh * 0.78, bw * 0.34, bh * 0.18, -0.4, 0, Math.PI * 2);
  const hl = ctx.createRadialGradient(-bw * 0.22, -bh * 0.78, 0, -bw * 0.22, -bh * 0.78, bw * 0.34);
  hl.addColorStop(0, `hsla(${col.h},30%,98%,${a * 0.50})`);
  hl.addColorStop(1, `hsla(${col.h},30%,98%,0)`);
  ctx.fillStyle = hl;
  ctx.fill();

  ctx.restore();
}

export default { name, init, update, draw };

export function draw(ctx, state) {
  ctx.save();
  // depth order: small (far) jellies draw first, large (near) on top
  [...state.jellies].sort((a, b) => a.r - b.r)
    .forEach(j => drawJelly(ctx, j));
  ctx.globalAlpha = 1;
  ctx.restore();
}
