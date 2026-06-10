// Jellyfish — translucent pulsing jellyfish that drift upward slowly.
// Bell rhythmically contracts and expands; trailing tentacles sway.
// Soft bioluminescent glow in cyan, violet, and blue.

export const name = 'Jellyfish';

function rand(min, max) { return min + Math.random() * (max - min); }

const COLORS = [
  { h: 185, s: 80, l: 72 },  // cyan
  { h: 270, s: 70, l: 72 },  // violet
  { h: 210, s: 80, l: 68 },  // blue
  { h: 300, s: 60, l: 72 },  // pink-purple
  { h: 160, s: 65, l: 68 },  // sea-green
];

function makeJelly(w, h, spreadXY) {
  const col  = COLORS[Math.floor(rand(0, COLORS.length))];
  const r    = rand(22, 52);
  const nTentacles = Math.floor(rand(5, 10));
  const tentacles = [];
  for (let i = 0; i < nTentacles; i++) {
    tentacles.push({
      xOff:  rand(-r * 0.7, r * 0.7),
      len:   rand(r * 1.0, r * 2.8),
      phase: rand(0, Math.PI * 2),
      rate:  rand(0.5, 1.4),
      amp:   rand(r * 0.12, r * 0.32),
    });
  }
  return {
    x:        spreadXY ? rand(r, w - r) : rand(r, w - r),
    y:        spreadXY ? rand(r, h - r) : h + r + rand(0, 80),
    r, col,
    vy:       -(rand(16, 40)),   // float upward
    vx:       rand(-10, 10),
    pulse:    rand(0, Math.PI * 2),
    pulseRate: rand(1.0, 2.0),
    sway:     rand(0, Math.PI * 2),
    swayRate: rand(0.2, 0.6),
    swayAmp:  rand(8, 20),
    tentacles,
    alpha:    rand(0.55, 0.82),
    life:     0,
    maxLife:  rand(10, 22),
  };
}

export function init(w, h) {
  const jellies = [];
  for (let i = 0; i < 10; i++) jellies.push(makeJelly(w, h, true));
  return { jellies, w, h, timer: 0 };
}

export function update(state, dt) {
  const { jellies, w, h } = state;
  state.timer += dt;
  if (state.timer > 1.2 && jellies.length < 14) {
    jellies.push(makeJelly(w, h, false));
    state.timer = 0;
  }
  for (let i = jellies.length - 1; i >= 0; i--) {
    const j = jellies[i];
    j.life  += dt;
    j.pulse += j.pulseRate * dt;
    j.sway  += j.swayRate * dt;
    j.x     += (j.vx + Math.sin(j.sway) * j.swayAmp) * dt;
    j.y     += j.vy * dt;
    j.tentacles.forEach(t => { t.phase += t.rate * dt; });
    if (j.y + j.r < -10 || j.life > j.maxLife) jellies.splice(i, 1);
  }
}

function drawJelly(ctx, j) {
  const { r, col, pulse, alpha, life, maxLife, tentacles } = j;
  const fadeIn  = Math.min(life / 1.0, 1);
  const fadeOut = Math.min((maxLife - life) / 2.0, 1);
  const a = alpha * fadeIn * fadeOut;

  // Bell pulse: 0.82–1.0 radius scale
  const pScale = 0.90 + Math.sin(pulse) * 0.10;
  const bellR  = r * pScale;
  const bellH  = r * 0.66 * (1 + (1 - pScale) * 0.3);  // height squishes on contract

  ctx.save();
  ctx.translate(j.x, j.y);

  // Outer glow
  const glow = ctx.createRadialGradient(0, 0, bellR * 0.2, 0, 0, bellR * 1.6);
  glow.addColorStop(0, `hsla(${col.h},${col.s}%,${col.l}%,${a * 0.30})`);
  glow.addColorStop(1, `hsla(${col.h},${col.s}%,${col.l}%,0)`);
  ctx.beginPath();
  ctx.ellipse(0, 0, bellR * 1.6, bellH * 1.6, 0, 0, Math.PI * 2);
  ctx.fillStyle = glow;
  ctx.fill();

  // Tentacles — drawn before bell so they appear behind
  tentacles.forEach(t => {
    const tx  = t.xOff;
    const ty0 = bellH * 0.8;
    ctx.beginPath();
    ctx.moveTo(tx, ty0);
    for (let seg = 0; seg < 8; seg++) {
      const st  = (seg + 1) / 8;
      const sx  = tx + Math.sin(t.phase + seg * 0.7) * t.amp;
      const sy  = ty0 + st * t.len;
      ctx.lineTo(sx, sy);
    }
    ctx.strokeStyle = `hsla(${col.h},${col.s}%,${col.l}%,${a * 0.55})`;
    ctx.lineWidth   = Math.max(0.8, r * 0.028);
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.stroke();
  });

  // Bell dome — upper half ellipse
  ctx.beginPath();
  ctx.ellipse(0, 0, bellR, bellH, 0, Math.PI, Math.PI * 2);
  ctx.closePath();
  const bellGrad = ctx.createRadialGradient(0, -bellH * 0.3, 0, 0, 0, bellR);
  bellGrad.addColorStop(0, `hsla(${col.h},${col.s}%,${Math.min(col.l + 18, 95)}%,${a * 0.82})`);
  bellGrad.addColorStop(0.6, `hsla(${col.h},${col.s}%,${col.l}%,${a * 0.60})`);
  bellGrad.addColorStop(1,   `hsla(${col.h},${col.s}%,${col.l - 12}%,${a * 0.35})`);
  ctx.fillStyle = bellGrad;
  ctx.fill();
  ctx.strokeStyle = `hsla(${col.h},${col.s}%,${col.l}%,${a * 0.45})`;
  ctx.lineWidth   = Math.max(0.7, r * 0.024);
  ctx.stroke();

  // Bell skirt — lower frilled edge
  const frill = 6;
  ctx.beginPath();
  for (let fi = 0; fi <= frill; fi++) {
    const ang = Math.PI + (fi / frill) * Math.PI;
    const fx = Math.cos(ang) * bellR;
    const fy = Math.sin(ang) * bellH + (fi % 2 === 0 ? bellH * 0.12 : 0);
    fi === 0 ? ctx.moveTo(fx, fy) : ctx.lineTo(fx, fy);
  }
  ctx.strokeStyle = `hsla(${col.h},${col.s}%,${col.l}%,${a * 0.40})`;
  ctx.lineWidth   = Math.max(0.6, r * 0.020);
  ctx.stroke();

  ctx.restore();
}

export default { name, init, update, draw };

export function draw(ctx, state) {
  ctx.save();
  state.jellies.forEach(j => drawJelly(ctx, j));
  ctx.globalAlpha = 1;
  ctx.restore();
}
