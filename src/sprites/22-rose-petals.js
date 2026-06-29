// Rose Petals — realistic curled rose petals fluttering down.
// Each petal is a cupped, ruffled bezier shape with a notched outer edge,
// a radial blush gradient, a curl highlight, and a soft drop shadow.
// Petals flutter: they rock, flip (3D foreshortening via scaleY), and
// slip sideways as they fall — the way real petals tumble.

export const name = 'Rose Petals';

function rand(min, max) { return min + Math.random() * (max - min); }

// base hue, edge hue slightly deeper; lightness pairs
const PALETTES = [
  { h: 348, s: 78, lLight: 88, lMid: 74, lDeep: 58 },  // blush
  { h: 352, s: 85, lLight: 80, lMid: 64, lDeep: 46 },  // rose
  { h: 358, s: 80, lLight: 70, lMid: 52, lDeep: 38 },  // deep red rose
  { h:  18, s: 60, lLight: 95, lMid: 86, lDeep: 74 },  // ivory-cream
  { h: 340, s: 70, lLight: 92, lMid: 82, lDeep: 68 },  // pale pink
];

function makePetal(w, h, spreadXY) {
  const pal    = PALETTES[Math.floor(rand(0, PALETTES.length))];
  const r      = rand(16, 30);
  const vy     = rand(26, 58);
  const startY = spreadXY ? rand(-r, h) : -(r + rand(0, 70));
  return {
    x:         rand(r, w - r),
    y:         startY,
    r, pal,
    vy,
    drift:     rand(-12, 12),
    baseRot:   rand(0, Math.PI * 2),
    rock:      rand(0, Math.PI * 2),
    rockRate:  rand(0.8, 1.8),
    rockAmp:   rand(0.3, 0.7),
    flip:      rand(0, Math.PI * 2),
    flipRate:  rand(0.6, 1.6),
    ruffle:    rand(0, Math.PI * 2),
    notch:     rand(0.3, 0.85),
    alpha:     rand(0.85, 1.0),
    life:      0,
    maxLife:   (h + r - startY) / vy * rand(1.6, 2.0),
  };
}

export function init(w, h, density = 1) {
  const petals = [];
  const initCount = Math.round(26 * density);
  for (let i = 0; i < initCount; i++) petals.push(makePetal(w, h, true));
  return { petals, w, h, timer: 0 };
}

export function update(state, dt, elapsed, density = 1) {
  const { petals, w, h } = state;
  state.timer += dt;
  if (state.timer > 0.5 && petals.length < Math.round(40 * density)) {
    petals.push(makePetal(w, h, false));
    state.timer = 0;
  }
  for (let i = petals.length - 1; i >= 0; i--) {
    const p = petals[i];
    p.life += dt;
    p.rock += p.rockRate * dt;
    p.flip += p.flipRate * dt;
    // sideways slip follows the rock — petals "skate" on the air
    p.x += (p.drift + Math.sin(p.rock) * 26) * dt;
    // fall slows when petal is flat (catching air), speeds when edge-on
    const flatness = Math.abs(Math.cos(p.flip));         // 1 = face-on
    p.y += p.vy * (0.55 + 0.65 * (1 - flatness)) * dt;
    if (p.y - p.r > h + 10 || p.life > p.maxLife) petals.splice(i, 1);
  }
}

// Cupped petal silhouette: broad ruffled outer edge (top), narrowing to a
// small base. ruffle/notch give each petal an individual organic shape.
function petalPath(ctx, r, ruffle, notch) {
  const k = Math.sin(ruffle) * 0.12;          // asymmetry
  const top = -r;                              // outer edge
  ctx.beginPath();
  ctx.moveTo(0, r * 0.78);                     // base point
  // left flank: base out to left shoulder
  ctx.bezierCurveTo(-r * (0.55 + k), r * 0.55, -r * 0.95, -r * 0.05,
                    -r * (0.72 - k), top * 0.72);
  // left shoulder up to the notch dip in the centre of the outer edge
  ctx.bezierCurveTo(-r * 0.50, top * 1.02, -r * 0.18, top * (0.86 + notch * 0.14),
                     0,        top * (1.0 - notch * 0.22));
  // notch back up to right shoulder
  ctx.bezierCurveTo( r * 0.18, top * (0.86 + notch * 0.14), r * 0.50, top * 1.02,
                     r * (0.72 + k), top * 0.72);
  // right flank back to base
  ctx.bezierCurveTo( r * 0.95, -r * 0.05, r * (0.55 - k), r * 0.55,
                     0, r * 0.78);
  ctx.closePath();
}

function drawPetal(ctx, p) {
  const { r, pal, baseRot, rock, rockAmp, flip, ruffle, notch,
          alpha, life, maxLife } = p;
  const rot = baseRot + Math.sin(rock) * rockAmp;
  const squish = Math.cos(flip);                     // -1..1, 0 = edge-on
  const sy = Math.max(Math.abs(squish), 0.12) * (squish < 0 ? -1 : 1);
  const fadeIn  = Math.min(life / 0.6, 1);
  const fadeOut = Math.min((maxLife - life) / 1.2, 1);
  const a = alpha * fadeIn * fadeOut;

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(rot);
  ctx.scale(1, sy);

  // soft drop shadow (offset opposite the light)
  ctx.save();
  ctx.translate(r * 0.10, r * 0.14);
  petalPath(ctx, r, ruffle, notch);
  ctx.fillStyle = `rgba(60,20,30,${0.16 * a})`;
  ctx.fill();
  ctx.restore();

  // petal body — radial gradient: luminous base -> deeper ruffled edge
  petalPath(ctx, r, ruffle, notch);
  const grad = ctx.createRadialGradient(0, r * 0.5, r * 0.12, 0, -r * 0.1, r * 1.25);
  grad.addColorStop(0,    `hsla(${pal.h},${pal.s}%,${pal.lLight}%,${a})`);
  grad.addColorStop(0.55, `hsla(${pal.h},${pal.s}%,${pal.lMid}%,${a})`);
  grad.addColorStop(1,    `hsla(${pal.h},${pal.s}%,${pal.lDeep}%,${a})`);
  ctx.fillStyle = grad;
  ctx.fill();

  // when the petal shows its back (squish < 0), wash it paler
  if (squish < 0) {
    petalPath(ctx, r, ruffle, notch);
    ctx.fillStyle = `hsla(${pal.h},${Math.round(pal.s * 0.5)}%,${Math.min(pal.lLight + 6, 97)}%,${a * 0.55})`;
    ctx.fill();
  }

  // curl highlight: bright crescent along the outer edge (catching light)
  ctx.save();
  petalPath(ctx, r, ruffle, notch);
  ctx.clip();
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.72, r * 0.66, r * 0.30, 0, 0, Math.PI * 2);
  const hl = ctx.createRadialGradient(0, -r * 0.72, 0, 0, -r * 0.72, r * 0.66);
  hl.addColorStop(0, `hsla(${pal.h},${Math.round(pal.s * 0.6)}%,97%,${a * 0.5})`);
  hl.addColorStop(1, `hsla(${pal.h},${Math.round(pal.s * 0.6)}%,97%,0)`);
  ctx.fillStyle = hl;
  ctx.fill();
  // inner crease shadow near the base — gives the cupped look
  ctx.beginPath();
  ctx.ellipse(0, r * 0.45, r * 0.40, r * 0.28, 0, 0, Math.PI * 2);
  const cr = ctx.createRadialGradient(0, r * 0.45, 0, 0, r * 0.45, r * 0.40);
  cr.addColorStop(0, `hsla(${pal.h},${pal.s}%,${pal.lDeep}%,${a * 0.40})`);
  cr.addColorStop(1, `hsla(${pal.h},${pal.s}%,${pal.lDeep}%,0)`);
  ctx.fillStyle = cr;
  ctx.fill();
  ctx.restore();

  // delicate edge line
  petalPath(ctx, r, ruffle, notch);
  ctx.strokeStyle = `hsla(${pal.h},${pal.s}%,${pal.lDeep}%,${a * 0.45})`;
  ctx.lineWidth   = Math.max(0.4, r * 0.02);
  ctx.stroke();

  ctx.restore();
}

export default { name, init, update, draw };

export function draw(ctx, state) {
  ctx.save();
  // depth order: small (far) petals draw first, large (near) on top
  [...state.petals].sort((a, b) => a.r - b.r)
    .forEach(p => drawPetal(ctx, p));
  ctx.globalAlpha = 1;
  ctx.restore();
}
