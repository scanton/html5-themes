// Comets — long-tailed comets arcing slowly across the canvas with glowing
// comas and colour-shifting tails that fade from white-hot to deep blue-violet.
//
// Each comet travels in a straight line at a random angle.  The tail is drawn
// as a series of overlapping gradient ellipses shrinking away from the head,
// rotated to align with the travel direction, giving a wide brushstroke look.
// A secondary ion-tail streaks as a thin narrow stripe behind the main coma.

export const name = 'Comets';

function rand(min, max) { return min + Math.random() * (max - min); }

const COMET_PALETTES = [
  { head: '#FFFFFF', mid: '#AADDFF', tail: '#2244AA', ion: '#66BBFF' },   // blue-white
  { head: '#FFFFFF', mid: '#FFEEAA', tail: '#AA6622', ion: '#FFCC44' },   // golden
  { head: '#FFFFFF', mid: '#CCFFEE', tail: '#116644', ion: '#88FFCC' },   // green
  { head: '#FFFFFF', mid: '#FFCCFF', tail: '#882299', ion: '#DD88FF' },   // violet
];

// Spawn from one edge, travel to the opposite
function makeComet(w, h) {
  const pal   = COMET_PALETTES[Math.floor(rand(0, COMET_PALETTES.length))];
  const speed = rand(110, 220);
  const angle = rand(-Math.PI * 0.35, Math.PI * 0.35) + (Math.random() < 0.5 ? 0 : Math.PI);

  // Start off one edge
  const edge = Math.floor(rand(0, 4));
  let sx, sy;
  if (edge === 0) { sx = rand(0, w);     sy = -80; }           // top
  else if (edge === 1) { sx = w + 80;    sy = rand(0, h); }    // right
  else if (edge === 2) { sx = rand(0, w); sy = h + 80; }       // bottom
  else                 { sx = -80;        sy = rand(0, h); }    // left

  return {
    x:       sx,
    y:       sy,
    vx:      Math.cos(angle) * speed,
    vy:      Math.sin(angle) * speed,
    angle,
    r:       rand(5, 14),           // head radius
    tailLen: rand(120, 340),        // tail length in px
    tailW:   rand(18, 45),          // tail max half-width
    pal,
    glow:    rand(0, Math.PI * 2),
    glowRate:rand(1.0, 2.5),
    life:    0,
    maxLife: rand(8, 18),
  };
}

export function init(w, h, density = 1) {
  const comets = [];
  const initCount = Math.round(8 * density);
  for (let i = 0; i < initCount; i++) comets.push(makeComet(w, h));
  return { comets, w, h, timer: 0 };
}

export function update(state, dt, elapsed, density = 1) {
  const { comets, w, h } = state;
  state.timer += dt;
  if (state.timer > 0.5 && comets.length < Math.round(14 * density)) {
    comets.push(makeComet(w, h));
    state.timer = 0;
  }
  for (let i = comets.length - 1; i >= 0; i--) {
    const c = comets[i];
    c.life  += dt;
    c.glow  += c.glowRate * dt;
    c.x     += c.vx * dt;
    c.y     += c.vy * dt;
    // Off any edge
    const offscreen = c.x < -400 || c.x > w + 400 || c.y < -400 || c.y > h + 400;
    if (offscreen || c.life > c.maxLife) comets.splice(i, 1);
  }
}

function parseHex(hex) {
  return [
    parseInt(hex.slice(1,3),16),
    parseInt(hex.slice(3,5),16),
    parseInt(hex.slice(5,7),16),
  ];
}

function mixHex(hex1, hex2, t) {
  const [r1,g1,b1] = parseHex(hex1);
  const [r2,g2,b2] = parseHex(hex2);
  return `rgb(${Math.round(r1+(r2-r1)*t)},${Math.round(g1+(g2-g1)*t)},${Math.round(b1+(b2-b1)*t)})`;
}

function drawComet(ctx, c) {
  const { x, y, vx, vy, r, tailLen, tailW, angle, pal, glow, life, maxLife } = c;
  const fadeIn  = Math.min(life / 1.5, 1);
  const fadeOut = Math.min((maxLife - life) / 2.5, 1);
  const alpha   = fadeIn * fadeOut;
  if (alpha < 0.01) return;
  ctx.globalAlpha = alpha;

  // Direction of travel — tail points backward
  const speed = Math.sqrt(vx * vx + vy * vy);
  const dx    = speed > 0.01 ? vx / speed : 0;
  const dy    = speed > 0.01 ? vy / speed : 0;
  const tailAng = Math.atan2(dy, dx);

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tailAng + Math.PI);   // rotate so tail goes "back"

  // ── Main dust tail — overlapping gradient ellipses ────────────
  const STEPS = 14;
  for (let i = 0; i < STEPS; i++) {
    const t  = i / STEPS;
    const tx = tailLen * (t * t);         // quadratic: tail gets wider further back
    const tw = tailW * t * (1.0 - t * 0.3);
    const ta = (1.0 - t) * 0.55;
    if (ta < 0.005) continue;

    const col = t < 0.4
      ? mixHex(pal.head, pal.mid,  t / 0.4)
      : mixHex(pal.mid,  pal.tail, (t - 0.4) / 0.6);

    const grad = ctx.createRadialGradient(tx, 0, 0, tx, 0, tw * 1.5);
    grad.addColorStop(0,   col.replace('rgb', 'rgba').replace(')', `,${ta})`));
    grad.addColorStop(0.5, col.replace('rgb', 'rgba').replace(')', `,${ta * 0.5})`));
    grad.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.ellipse(tx, 0, Math.max(tw * 0.5, 1), Math.max(tw * 1.5, 1), Math.PI * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  // ── Narrow ion tail ───────────────────────────────────────────
  const ionGrad = ctx.createLinearGradient(0, 0, tailLen * 0.85, 0);
  ionGrad.addColorStop(0,    pal.ion.replace(')', ``) + '');
  ionGrad.addColorStop(0,   `${pal.ion}`);
  const [ir,ig,ib] = parseHex(pal.ion);
  ionGrad.addColorStop(0,    `rgba(${ir},${ig},${ib},0.65)`);
  ionGrad.addColorStop(0.6,  `rgba(${ir},${ig},${ib},0.25)`);
  ionGrad.addColorStop(1,    `rgba(${ir},${ig},${ib},0)`);
  ctx.beginPath();
  ctx.moveTo(0, -1.5);
  ctx.lineTo(tailLen * 0.85, -0.5);
  ctx.lineTo(tailLen * 0.85,  0.5);
  ctx.lineTo(0,  1.5);
  ctx.closePath();
  ctx.fillStyle = ionGrad;
  ctx.fill();

  ctx.restore();

  // ── Coma — bright head glow ───────────────────────────────────
  ctx.save();
  ctx.translate(x, y);
  const pulsed = 0.80 + 0.20 * (0.5 + 0.5 * Math.sin(glow));
  const comaR  = r * (4.0 + pulsed * 2.0);
  const coma   = ctx.createRadialGradient(0, 0, 0, 0, 0, comaR);
  coma.addColorStop(0,   `rgba(255,255,255,0.90)`);
  coma.addColorStop(0.25, `rgba(220,240,255,0.55)`);
  coma.addColorStop(0.55, `rgba(180,210,255,0.20)`);
  coma.addColorStop(1,   'rgba(100,150,255,0)');
  ctx.beginPath();
  ctx.arc(0, 0, comaR, 0, Math.PI * 2);
  ctx.fillStyle = coma;
  ctx.fill();

  // Bright nucleus
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.98)';
  ctx.fill();
  ctx.restore();
}

export default { name, init, update, draw };

export function draw(ctx, state) {
  ctx.save();
  [...state.comets].sort((a, b) => a.r - b.r).forEach(c => drawComet(ctx, c));
  ctx.globalAlpha = 1;
  ctx.restore();
}
