// Hemp Leaves — 7-fingered cannabis leaves that drift and tumble slowly.
// Authentic palmate silhouette with serrated leaflets, rendered with
// Canvas 2D paths. Earthy green palette.

export const name = 'Hemp Leaves';

function rand(min, max) { return min + Math.random() * (max - min); }

const PALETTES = [
  { h: 115, s: 65, lBright: 52, lBase: 36, lDark: 22 },  // fresh green
  { h: 100, s: 55, lBright: 44, lBase: 30, lDark: 18 },  // deep green
  { h: 120, s: 50, lBright: 60, lBase: 44, lDark: 28 },  // lime green
  { h:  90, s: 45, lBright: 48, lBase: 34, lDark: 20 },  // olive
];

function makeLeaf(w, h, spreadXY) {
  const pal = PALETTES[Math.floor(rand(0, PALETTES.length))];
  const r   = rand(20, 42);
  return {
    x:        spreadXY ? rand(r, w - r) : rand(r, w - r),
    y:        spreadXY ? rand(r, h - r) : -(r + rand(0, 80)),
    r, pal,
    vx:       rand(-14, 14),
    vy:       rand(20, 55),
    rot:      rand(0, Math.PI * 2),
    rotRate:  rand(-1.2, 1.2),
    sway:     rand(0, Math.PI * 2),
    swayRate: rand(0.3, 0.8),
    swayAmp:  rand(8, 20),
    alpha:    rand(0.80, 0.96),
    life:     0,
    maxLife:  rand(8, 18),
  };
}

export function init(w, h) {
  const leaves = [];
  for (let i = 0; i < 18; i++) leaves.push(makeLeaf(w, h, true));
  return { leaves, w, h, timer: 0 };
}

export function update(state, dt) {
  const { leaves, w, h } = state;
  state.timer += dt;
  if (state.timer > 0.65 && leaves.length < 28) {
    leaves.push(makeLeaf(w, h, false));
    state.timer = 0;
  }
  for (let i = leaves.length - 1; i >= 0; i--) {
    const l = leaves[i];
    l.life  += dt;
    l.rot   += l.rotRate * dt;
    l.sway  += l.swayRate * dt;
    l.x     += (l.vx + Math.sin(l.sway) * l.swayAmp) * dt;
    l.y     += l.vy * dt;
    if (l.y - l.r > h + 10 || l.life > l.maxLife) leaves.splice(i, 1);
  }
}

// Draw one serrated leaflet pointing in direction (angle) with length len
// and half-width w at the base, narrowing to a point.
function leaflet(ctx, angle, len, baseW) {
  ctx.save();
  ctx.rotate(angle);
  const segs = 5;  // serrations per side
  ctx.beginPath();
  ctx.moveTo(0, 0);
  // Right edge with serrations
  for (let i = 0; i < segs; i++) {
    const t0 = i / segs;
    const t1 = (i + 0.5) / segs;
    const t2 = (i + 1) / segs;
    const w0 = baseW * (1 - t0);
    const w1 = baseW * (1 - t1) * 1.18;  // serration tip
    ctx.lineTo( w0, -len * t0);
    ctx.lineTo( w1, -len * t1);
    ctx.lineTo( baseW * (1 - t2), -len * t2);
  }
  ctx.lineTo(0, -len);  // tip
  // Left edge (mirror)
  for (let i = segs - 1; i >= 0; i--) {
    const t0 = i / segs;
    const t1 = (i + 0.5) / segs;
    ctx.lineTo(-baseW * (1 - (i + 1) / segs), -len * ((i + 1) / segs));
    ctx.lineTo(-baseW * (1 - t1) * 1.18,      -len * t1);
    ctx.lineTo(-baseW * (1 - t0),              -len * t0);
  }
  ctx.closePath();
  ctx.restore();
}

function drawLeaf(ctx, l) {
  const { r, pal, rot, alpha, life, maxLife } = l;
  const fadeIn  = Math.min(life / 0.7, 1);
  const fadeOut = Math.min((maxLife - life) / 1.4, 1);
  ctx.globalAlpha = alpha * fadeIn * fadeOut;

  ctx.save();
  ctx.translate(l.x, l.y);
  ctx.rotate(rot);

  const colBright = `hsl(${pal.h},${pal.s}%,${pal.lBright}%)`;
  const colBase   = `hsl(${pal.h},${pal.s}%,${pal.lBase}%)`;
  const colDark   = `hsl(${pal.h},${pal.s - 10}%,${pal.lDark}%)`;

  // 7 leaflets: centre (longest), 2 inner pairs, 2 outer pairs
  // angles spread fan-like from the tip (upward = 0)
  const leafletDefs = [
    { ang: 0,            len: r,        w: r * 0.14 },  // centre
    { ang:  Math.PI / 6, len: r * 0.88, w: r * 0.12 },  // inner right
    { ang: -Math.PI / 6, len: r * 0.88, w: r * 0.12 },  // inner left
    { ang:  Math.PI / 3.2, len: r * 0.72, w: r * 0.10 },// mid right
    { ang: -Math.PI / 3.2, len: r * 0.72, w: r * 0.10 },// mid left
    { ang:  Math.PI / 2.2, len: r * 0.52, w: r * 0.08 },// outer right
    { ang: -Math.PI / 2.2, len: r * 0.52, w: r * 0.08 },// outer left
  ];

  // Fill pass
  ctx.fillStyle = colBase;
  leafletDefs.forEach(d => {
    leaflet(ctx, d.ang, d.len, d.w);
    ctx.fill();
  });

  // Bright gradient overlay on centre leaflet
  const grad = ctx.createLinearGradient(0, 0, 0, -r);
  grad.addColorStop(0, colBase);
  grad.addColorStop(1, colBright);
  ctx.fillStyle = grad;
  leaflet(ctx, 0, r, r * 0.14);
  ctx.fill();

  // Outline pass
  ctx.strokeStyle = colDark;
  ctx.lineWidth   = Math.max(0.6, r * 0.028);
  leafletDefs.forEach(d => {
    leaflet(ctx, d.ang, d.len, d.w);
    ctx.stroke();
  });

  // Stem
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, r * 0.32);
  ctx.strokeStyle = colDark;
  ctx.lineWidth   = Math.max(0.8, r * 0.042);
  ctx.lineCap     = 'round';
  ctx.stroke();

  ctx.restore();
}

export default { name, init, update, draw };

export function draw(ctx, state) {
  ctx.save();
  state.leaves.forEach(l => drawLeaf(ctx, l));
  ctx.globalAlpha = 1;
  ctx.restore();
}
