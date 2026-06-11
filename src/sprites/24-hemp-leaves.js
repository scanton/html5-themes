// Hemp Leaves — botanical 7-fingered cannabis leaves. Each leaflet is a
// lanceolate blade (widest a third up, tapering to a fine tip) with
// curved serrated margins, its own central vein, and a light gradient
// running base->tip. Leaves tumble lazily with a gentle sway.

export const name = 'Hemp Leaves';

function rand(min, max) { return min + Math.random() * (max - min); }

const PALETTES = [
  { h: 112, s: 62, lBright: 50, lBase: 34, lDark: 20 },  // fresh green
  { h: 100, s: 55, lBright: 42, lBase: 28, lDark: 16 },  // deep forest
  { h: 122, s: 48, lBright: 58, lBase: 42, lDark: 26 },  // lime
  { h:  88, s: 48, lBright: 46, lBase: 32, lDark: 18 },  // olive
  { h: 140, s: 45, lBright: 44, lBase: 30, lDark: 18 },  // blue-green
];

function makeLeaf(w, h, spreadXY) {
  const pal = PALETTES[Math.floor(rand(0, PALETTES.length))];
  const r   = rand(26, 50);
  return {
    x: rand(r, w - r),
    y: spreadXY ? rand(r, h - r) : -(r + rand(0, 80)),
    r, pal,
    vx:       rand(-12, 12),
    vy:       rand(18, 46),
    rot:      rand(0, Math.PI * 2),
    rotRate:  rand(-0.9, 0.9),
    sway:     rand(0, Math.PI * 2),
    swayRate: rand(0.3, 0.8),
    swayAmp:  rand(8, 22),
    // 3D flutter: leaf tilts in/out of plane
    flip:     rand(0, Math.PI * 2),
    flipRate: rand(0.4, 1.0),
    alpha:    rand(0.85, 1.0),
    life:     0,
    maxLife:  rand(9, 19),
  };
}

export function init(w, h, density = 1) {
  const leaves = [];
  const initCount = Math.round(14 * density);
  for (let i = 0; i < initCount; i++) leaves.push(makeLeaf(w, h, true));
  return { leaves, w, h, timer: 0 };
}

export function update(state, dt, elapsed, density = 1) {
  const { leaves, w, h } = state;
  state.timer += dt;
  if (state.timer > 0.8 && leaves.length < Math.round(22 * density)) {
    leaves.push(makeLeaf(w, h, false));
    state.timer = 0;
  }
  for (let i = leaves.length - 1; i >= 0; i--) {
    const l = leaves[i];
    l.life += dt;
    l.rot  += l.rotRate * dt;
    l.sway += l.swayRate * dt;
    l.flip += l.flipRate * dt;
    l.x    += (l.vx + Math.sin(l.sway) * l.swayAmp) * dt;
    l.y    += l.vy * dt;
    if (l.y - l.r > h + 10 || l.life > l.maxLife) leaves.splice(i, 1);
  }
}

// Lanceolate serrated leaflet pointing up (-y), length len, max half-width hw.
// Margins curve out to widest at ~32% then taper to a fine tip; serration
// teeth are small forward-curving hooks (like real cannabis margins).
function leafletPath(ctx, len, hw) {
  const TEETH = 8;
  // width profile: 0 at base, peak at t=0.32, 0 at tip
  const width = t => hw * Math.sin(Math.PI * Math.pow(t, 0.62)) * (1 - t * 0.25);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  // right margin up with teeth
  for (let i = 0; i < TEETH; i++) {
    const t0 = i / TEETH;
    const t1 = (i + 1) / TEETH;
    const tm = (t0 + t1) / 2;
    const w0 = width(t0), wm = width(tm), w1 = width(t1);
    // tooth: bulge out at midpoint, notch in at the segment end
    ctx.quadraticCurveTo(wm * 1.22, -len * (tm - 0.02),
                         w1 * 0.92, -len * t1);
  }
  ctx.lineTo(0, -len);                          // fine tip
  // left margin down with teeth (mirror)
  for (let i = TEETH; i > 0; i--) {
    const t0 = i / TEETH;
    const t1 = (i - 1) / TEETH;
    const tm = (t0 + t1) / 2;
    const wm = width(tm), w1 = width(t1);
    ctx.quadraticCurveTo(-wm * 1.22, -len * (tm + 0.02),
                         -w1 * 0.92, -len * t1);
  }
  ctx.closePath();
}

// leaflet layout: angle from vertical, relative length
const FINGERS = [
  { ang:  0,     len: 1.00, hw: 0.130 },
  { ang:  0.45,  len: 0.92, hw: 0.120 },
  { ang: -0.45,  len: 0.92, hw: 0.120 },
  { ang:  0.95,  len: 0.74, hw: 0.105 },
  { ang: -0.95,  len: 0.74, hw: 0.105 },
  { ang:  1.45,  len: 0.48, hw: 0.085 },
  { ang: -1.45,  len: 0.48, hw: 0.085 },
];

function drawLeaf(ctx, l) {
  const { r, pal, rot, flip, alpha, life, maxLife } = l;
  const fadeIn  = Math.min(life / 0.7, 1);
  const fadeOut = Math.min((maxLife - life) / 1.4, 1);
  const a = alpha * fadeIn * fadeOut;
  // 3D flutter — squash horizontally as the leaf tilts
  const sx = 0.45 + 0.55 * Math.abs(Math.cos(flip));

  ctx.save();
  ctx.translate(l.x, l.y);
  ctx.rotate(rot);
  ctx.scale(sx, 1);
  ctx.globalAlpha = a;

  const colBright = `hsl(${pal.h},${pal.s}%,${pal.lBright}%)`;
  const colBase   = `hsl(${pal.h},${pal.s}%,${pal.lBase}%)`;
  const colDark   = `hsl(${pal.h},${Math.max(pal.s - 12, 20)}%,${pal.lDark}%)`;
  const colVein   = `hsl(${pal.h},${Math.max(pal.s - 20, 15)}%,${Math.min(pal.lBright + 18, 78)}%)`;

  // soft shadow under the leaf
  ctx.save();
  ctx.translate(r * 0.06, r * 0.09);
  FINGERS.forEach(fg => {
    ctx.save();
    ctx.rotate(fg.ang);
    leafletPath(ctx, r * fg.len, r * fg.hw);
    ctx.fillStyle = `rgba(0,20,5,0.16)`;
    ctx.fill();
    ctx.restore();
  });
  ctx.restore();

  // leaflets — back fingers first so overlaps read correctly
  const order = [5, 6, 3, 4, 1, 2, 0];
  order.forEach(idx => {
    const fg = FINGERS[idx];
    const len = r * fg.len, hw = r * fg.hw;
    ctx.save();
    ctx.rotate(fg.ang);

    leafletPath(ctx, len, hw);
    const grad = ctx.createLinearGradient(0, 0, 0, -len);
    grad.addColorStop(0, colBase);
    grad.addColorStop(0.7, colBright);
    grad.addColorStop(1, `hsl(${pal.h},${pal.s}%,${Math.min(pal.lBright + 8, 70)}%)`);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = colDark;
    ctx.lineWidth = Math.max(0.5, r * 0.016);
    ctx.lineJoin = 'round';
    ctx.stroke();

    // central vein + side veinlets
    ctx.strokeStyle = colVein;
    ctx.lineWidth = Math.max(0.5, r * 0.018);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -len * 0.02);
    ctx.lineTo(0, -len * 0.96);
    ctx.stroke();
    ctx.lineWidth = Math.max(0.35, r * 0.010);
    for (let v = 1; v <= 4; v++) {
      const ty = v / 5;
      const vw = hw * Math.sin(Math.PI * Math.pow(ty, 0.62)) * 0.8;
      ctx.beginPath();
      ctx.moveTo(0, -len * ty);
      ctx.lineTo( vw, -len * (ty + 0.08));
      ctx.moveTo(0, -len * ty);
      ctx.lineTo(-vw, -len * (ty + 0.08));
      ctx.stroke();
    }
    ctx.restore();
  });

  // petiole (stem)
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(r * 0.03, r * 0.18, 0, r * 0.34);
  ctx.strokeStyle = colDark;
  ctx.lineWidth = Math.max(1, r * 0.040);
  ctx.lineCap = 'round';
  ctx.stroke();

  ctx.restore();
}

export default { name, init, update, draw };

export function draw(ctx, state) {
  ctx.save();
  // depth order: small (far) leaves draw first, large (near) on top
  [...state.leaves].sort((a, b) => a.r - b.r)
    .forEach(l => drawLeaf(ctx, l));
  ctx.globalAlpha = 1;
  ctx.restore();
}
