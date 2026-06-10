// Rose Petals — soft blush and ivory petals that drift and flutter down.
// Each petal is a rounded teardrop bezier shape with a subtle gradient and
// a gentle sinusoidal rock side-to-side as it falls.

export const name = 'Rose Petals';

function rand(min, max) { return min + Math.random() * (max - min); }

const PALETTES = [
  { h: 345, s: 72, lBright: 88, lBase: 72, lEdge: 56 },  // blush pink
  { h: 350, s: 60, lBright: 94, lBase: 82, lEdge: 68 },  // pale rose
  { h:  10, s: 55, lBright: 96, lBase: 84, lEdge: 70 },  // ivory-peach
  { h: 340, s: 80, lBright: 82, lBase: 62, lEdge: 46 },  // deep rose
  { h:   0, s:  0, lBright: 98, lBase: 90, lEdge: 76 },  // white
];

function makePetal(w, h, spreadXY) {
  const pal = PALETTES[Math.floor(rand(0, PALETTES.length))];
  const r   = rand(14, 28);
  return {
    x:         spreadXY ? rand(r, w - r) : rand(r, w - r),
    y:         spreadXY ? rand(-r, h)    : -(r + rand(0, 60)),
    r, pal,
    vx:        rand(-16, 16),
    vy:        rand(30, 70),
    baseRot:   rand(0, Math.PI * 2),
    rock:      rand(0, Math.PI * 2),
    rockRate:  rand(0.5, 1.4),
    rockAmp:   rand(0.15, 0.45),
    sway:      rand(0, Math.PI * 2),
    swayRate:  rand(0.3, 0.9),
    swayAmp:   rand(10, 24),
    alpha:     rand(0.72, 0.95),
    life:      0,
    maxLife:   rand(7, 16),
  };
}

export function init(w, h) {
  const petals = [];
  for (let i = 0; i < 28; i++) petals.push(makePetal(w, h, true));
  return { petals, w, h, timer: 0 };
}

export function update(state, dt) {
  const { petals, w, h } = state;
  state.timer += dt;
  if (state.timer > 0.45 && petals.length < 42) {
    petals.push(makePetal(w, h, false));
    state.timer = 0;
  }
  for (let i = petals.length - 1; i >= 0; i--) {
    const p = petals[i];
    p.life  += dt;
    p.rock  += p.rockRate * dt;
    p.sway  += p.swayRate * dt;
    p.x     += (p.vx + Math.sin(p.sway) * p.swayAmp) * dt;
    p.y     += p.vy * dt;
    if (p.y - p.r > h + 10 || p.life > p.maxLife) petals.splice(i, 1);
  }
}

function drawPetal(ctx, p) {
  const { r, pal, baseRot, rock, rockAmp, alpha, life, maxLife } = p;
  const rot = baseRot + Math.sin(rock) * rockAmp;
  const fadeIn  = Math.min(life / 0.6, 1);
  const fadeOut = Math.min((maxLife - life) / 1.2, 1);
  ctx.globalAlpha = alpha * fadeIn * fadeOut;

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(rot);

  // Petal shape: rounded teardrop, tip at top (0,-r), round base below
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.bezierCurveTo( r * 0.72, -r * 0.55,  r * 0.82,  r * 0.20,  0,  r * 0.72);
  ctx.bezierCurveTo(-r * 0.82,  r * 0.20, -r * 0.72, -r * 0.55,  0, -r);
  ctx.closePath();

  const grad = ctx.createLinearGradient(0, -r, 0, r * 0.72);
  grad.addColorStop(0, `hsl(${pal.h},${pal.s}%,${pal.lBright}%)`);
  grad.addColorStop(1, `hsl(${pal.h},${pal.s}%,${pal.lBase}%)`);
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.strokeStyle = `hsl(${pal.h},${pal.s}%,${pal.lEdge}%)`;
  ctx.lineWidth   = Math.max(0.5, r * 0.028);
  ctx.stroke();

  // Central vein
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.85);
  ctx.lineTo(0, r * 0.55);
  ctx.strokeStyle = `hsl(${pal.h},${pal.s}%,${pal.lEdge}%)`;
  ctx.lineWidth   = Math.max(0.4, r * 0.022);
  ctx.lineCap     = 'round';
  ctx.stroke();

  ctx.restore();
}

export default { name, init, update, draw };

export function draw(ctx, state) {
  ctx.save();
  state.petals.forEach(p => drawPetal(ctx, p));
  ctx.globalAlpha = 1;
  ctx.restore();
}
