// Autumn Leaves — crisp maple and oak leaf shapes in crimson, amber, and gold
// that tumble and spin as they fall.
//
// Two leaf types rendered entirely with bezier outlines:
//   maple — iconic 7-lobe palmate silhouette (top + 3 pairs) with palmate veins
//   oak   — elongated with 4 rounded lobes per side and lateral veins
// Each leaf has a gradient fill (bright tip → deeper base), dark vein lines,
// and a short stem.  Physics: free tumble rotation + gentle horizontal sway.

export const name = 'Autumn Leaves';

function rand(min, max) { return min + Math.random() * (max - min); }

// h=hue, s=sat, lBright=tip lightness, lBase=body, lDark=vein/edge
const PALETTES = [
  { h:  4, s: 88, lBright: 62, lBase: 44, lDark: 26 },  // crimson
  { h:  0, s: 78, lBright: 50, lBase: 36, lDark: 20 },  // deep red
  { h: 18, s: 95, lBright: 64, lBase: 50, lDark: 32 },  // orange
  { h: 28, s: 95, lBright: 68, lBase: 52, lDark: 34 },  // amber
  { h: 38, s: 92, lBright: 70, lBase: 54, lDark: 36 },  // amber-gold
  { h: 45, s: 95, lBright: 72, lBase: 56, lDark: 36 },  // gold
  { h: 14, s: 68, lBright: 52, lBase: 38, lDark: 24 },  // russet
];

function makeLeaf(w, h, spreadXY) {
  const pal    = PALETTES[Math.floor(rand(0, PALETTES.length))];
  const type   = Math.random() < 0.55 ? 'maple' : 'oak';
  const r      = rand(22, 44);
  const vy     = rand(42, 98);
  const startY = spreadXY ? rand(-r * 2, h) : -(r + rand(0, 90));
  return {
    x:        rand(r, w - r),
    y:        startY,
    r, type, pal,
    vx:       rand(-22, 22),
    vy,
    rot:      rand(0, Math.PI * 2),
    rotRate:  rand(-1.6, 1.6) * (26 / r),
    sway:     rand(0, Math.PI * 2),
    swayRate: rand(0.4, 1.1),
    swayAmp:  rand(12, 30),
    alpha:    rand(0.84, 1.0),
    life:     0,
    maxLife:  (h + r - startY) / vy * rand(1.05, 1.15),
  };
}

export function init(w, h, density = 1) {
  const leaves = [];
  const initCount = Math.round(24 * density);
  for (let i = 0; i < initCount; i++) leaves.push(makeLeaf(w, h, true));
  return { leaves, w, h, timer: 0 };
}

export function update(state, dt, elapsed, density = 1) {
  const { leaves, w, h } = state;
  state.timer += dt;
  if (state.timer > 0.55 && leaves.length < Math.round(36 * density)) {
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

// ── Maple leaf — 7-lobed palmate silhouette ───────────────────────────────────
// Tip at (0, -r), stem at (0, r).  Path is symmetric about the y-axis.
function pathMaple(ctx, r) {
  ctx.beginPath();
  ctx.moveTo(0, -r);
  // Right upper lobe
  ctx.bezierCurveTo( r*.14,-r*.86,  r*.42,-r*.76,  r*.50,-r*.56);
  // Sinus (upper → main)
  ctx.bezierCurveTo( r*.56,-r*.42,  r*.30,-r*.32,  r*.30,-r*.22);
  // Right main lobe
  ctx.bezierCurveTo( r*.38,-r*.14,  r*.92,-r*.12,  r*.92, r*.00);
  ctx.bezierCurveTo( r*.92, r*.14,  r*.56, r*.24,  r*.50, r*.30);
  // Lower-right sinus
  ctx.bezierCurveTo( r*.56, r*.34,  r*.48, r*.44,  r*.44, r*.52);
  // Taper to stem (right)
  ctx.bezierCurveTo( r*.38, r*.58,  r*.16, r*.66,  r*.07, r*.72);
  ctx.bezierCurveTo( r*.05, r*.82,  r*.04, r*.92,  r*.04, r     );
  ctx.lineTo(        -r*.04, r     );
  // Taper to stem (left) then mirror up
  ctx.bezierCurveTo(-r*.04, r*.92, -r*.05, r*.82, -r*.07, r*.72);
  ctx.bezierCurveTo(-r*.16, r*.66, -r*.38, r*.58, -r*.44, r*.52);
  ctx.bezierCurveTo(-r*.48, r*.44, -r*.56, r*.34, -r*.50, r*.30);
  ctx.bezierCurveTo(-r*.56, r*.24, -r*.92, r*.14, -r*.92, r*.00);
  ctx.bezierCurveTo(-r*.92,-r*.12, -r*.38,-r*.14, -r*.30,-r*.22);
  ctx.bezierCurveTo(-r*.30,-r*.32, -r*.56,-r*.42, -r*.50,-r*.56);
  ctx.bezierCurveTo(-r*.42,-r*.76, -r*.14,-r*.86,  0,    -r    );
  ctx.closePath();
}

// ── Oak leaf — elongated with 4 rounded lobes per side ───────────────────────
function pathOak(ctx, r) {
  const w = r * 0.52;
  ctx.beginPath();
  ctx.moveTo(0, -r);
  // Right — 4 lobes
  ctx.bezierCurveTo( w*.5,-r*.88,  w*1.1,-r*.76,  w,    -r*.62);
  ctx.bezierCurveTo( w*.9,-r*.50,  w*.45,-r*.46,  w*.45,-r*.40);
  ctx.bezierCurveTo( w*.9,-r*.36,  w*1.1,-r*.22,  w,    -r*.08);
  ctx.bezierCurveTo( w*.9, r*.04,  w*.45, r*.08,  w*.45, r*.14);
  ctx.bezierCurveTo( w*.9, r*.18,  w*1.1, r*.32,  w,     r*.44);
  ctx.bezierCurveTo( w*.9, r*.54,  w*.45, r*.56,  w*.40, r*.60);
  ctx.bezierCurveTo( w*.75,r*.64,  w*.82, r*.74,  w*.55, r*.80);
  ctx.bezierCurveTo( w*.35,r*.86,  w*.18, r*.92,  r*.06, r    );
  ctx.lineTo(        -r*.06, r    );
  // Left — mirror
  ctx.bezierCurveTo(-w*.18, r*.92,-w*.35, r*.86, -w*.55, r*.80);
  ctx.bezierCurveTo(-w*.82, r*.74,-w*.75, r*.64, -w*.40, r*.60);
  ctx.bezierCurveTo(-w*.45, r*.56,-w*.9,  r*.54, -w,     r*.44);
  ctx.bezierCurveTo(-w*1.1, r*.32,-w*.9,  r*.18, -w*.45, r*.14);
  ctx.bezierCurveTo(-w*.45, r*.08,-w*.9,  r*.04, -w,    -r*.08);
  ctx.bezierCurveTo(-w*1.1,-r*.22,-w*.9, -r*.36, -w*.45,-r*.40);
  ctx.bezierCurveTo(-w*.45,-r*.46,-w*.9, -r*.50, -w,    -r*.62);
  ctx.bezierCurveTo(-w*1.1,-r*.76,-w*.5, -r*.88,  0,    -r    );
  ctx.closePath();
}

// ── Maple veins — palmate: all 5 primary veins radiate from the base ──────────
function veinMaple(ctx, r, col) {
  ctx.strokeStyle = col;
  ctx.lineCap     = 'round';

  const base = r * 0.65;   // y-position of the palmate junction

  // Central vein (thicker)
  ctx.lineWidth = Math.max(0.9, r * 0.044);
  ctx.beginPath();
  ctx.moveTo(0, base);
  ctx.lineTo(0, -r);
  ctx.stroke();

  // Four primary side veins pointing toward each lobe pair
  ctx.lineWidth = Math.max(0.55, r * 0.028);
  const primary = [
    [ r * 0.92,  0       ],   // right main lobe
    [-r * 0.92,  0       ],   // left main lobe
    [ r * 0.50, -r * 0.56],   // upper right lobe
    [-r * 0.50, -r * 0.56],   // upper left lobe
  ];
  primary.forEach(([tx, ty]) => {
    ctx.beginPath();
    ctx.moveTo(0, base);
    ctx.lineTo(tx, ty);
    ctx.stroke();
  });

  // Short sub-veins to the lower lobes (branching from mid-main-vein)
  ctx.lineWidth = Math.max(0.4, r * 0.020);
  ctx.beginPath();
  ctx.moveTo(0, r * 0.28);
  ctx.lineTo( r * 0.44, r * 0.52);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, r * 0.28);
  ctx.lineTo(-r * 0.44, r * 0.52);
  ctx.stroke();
}

// ── Oak veins — pinnate: lateral veins branch off central vein ────────────────
function veinOak(ctx, r, col) {
  const w = r * 0.52;
  ctx.strokeStyle = col;
  ctx.lineCap     = 'round';

  // Central vein
  ctx.lineWidth = Math.max(0.9, r * 0.044);
  ctx.beginPath();
  ctx.moveTo(0, r * 0.88);
  ctx.lineTo(0, -r * 0.88);
  ctx.stroke();

  // Lateral veins: one pair per lobe pair
  ctx.lineWidth = Math.max(0.55, r * 0.030);
  const lats = [
    { y: -r * 0.62, xr:  w        },
    { y: -r * 0.08, xr:  w        },
    { y:  r * 0.44, xr:  w * 0.85 },
  ];
  lats.forEach(({ y, xr }) => {
    const tipY = y + xr * 0.18;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo( xr, tipY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(-xr, tipY);
    ctx.stroke();
  });
}

function drawLeaf(ctx, l) {
  const { r, type, pal, rot, alpha, life, maxLife } = l;
  const fadeIn  = Math.min(life / 0.8, 1);
  const fadeOut = Math.min((maxLife - life) / 1.5, 1);
  ctx.globalAlpha = alpha * fadeIn * fadeOut;

  ctx.save();
  ctx.translate(l.x, l.y);
  ctx.rotate(rot);

  const colBright = `hsl(${pal.h},${pal.s}%,${pal.lBright}%)`;
  const colBase   = `hsl(${pal.h},${pal.s}%,${pal.lBase}%)`;
  const colDark   = `hsl(${pal.h},${Math.round(pal.s * 0.72)}%,${pal.lDark}%)`;

  // Build the leaf path
  if (type === 'maple') pathMaple(ctx, r);
  else                  pathOak(ctx, r);

  // Gradient fill: bright tip → deeper base
  const grad = ctx.createLinearGradient(0, -r, 0, r * 0.72);
  grad.addColorStop(0, colBright);
  grad.addColorStop(1, colBase);
  ctx.fillStyle = grad;
  ctx.fill();

  // Crisp edge outline
  ctx.strokeStyle = colDark;
  ctx.lineWidth   = Math.max(0.7, r * 0.034);
  ctx.stroke();

  // Veins
  if (type === 'maple') veinMaple(ctx, r, colDark);
  else                  veinOak(ctx, r, colDark);

  // Stem
  ctx.beginPath();
  ctx.moveTo(0, r);
  ctx.lineTo(0, r + r * 0.44);
  ctx.strokeStyle = colDark;
  ctx.lineWidth   = Math.max(0.9, r * 0.046);
  ctx.lineCap     = 'round';
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
