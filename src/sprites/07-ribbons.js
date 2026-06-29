// Gift Ribbons — metallic ribbon streamers that twist and curl as they fall.
//
// Each ribbon is rendered as a chain of small quads along a sine-wave spine.
// The drawn half-width is modulated by |cos(twist + t)| so the ribbon
// narrows to an edge and flips to a darker shade, simulating a physical
// twist travelling along its length.  Seven metallic hues.

export const name = 'Gift Ribbons';

function rand(min, max) { return min + Math.random() * (max - min); }

const COLORS = [
  { h:   0, s: 90, l: 52 },   // red
  { h:  48, s: 95, l: 52 },   // gold
  { h: 135, s: 72, l: 38 },   // green
  { h: 215, s: 80, l: 55 },   // blue
  { h: 280, s: 68, l: 58 },   // purple
  { h:   0, s:  0, l: 72 },   // silver
  { h:  12, s: 88, l: 55 },   // orange-red
];

function makeRibbon(w, h, spreadY) {
  const col    = COLORS[Math.floor(rand(0, COLORS.length))];
  const len    = rand(55, 135);
  const vy     = rand(50, 115);
  const startY = spreadY ? rand(-len, h) : -(len + rand(0, 80));
  return {
    x:         rand(0, w),
    y:         startY,
    len,
    width:     rand(5, 13),
    vx:        rand(-28, 28),
    vy,
    rot:       rand(0, Math.PI * 2),
    rotRate:   rand(-0.7, 0.7),
    twist:     rand(0, Math.PI * 2),
    twistRate: rand(1.8, 5.5),
    waveCyc:   rand(0.5, 1.4),
    waveAmp:   rand(0.15, 0.45),
    hue: col.h, sat: col.s, lit: col.l,
    life:      0,
    maxLife:   (h + 20 + len - startY) / vy * rand(1.05, 1.15),
  };
}

export function init(w, h, density = 1) {
  const ribbons = [];
  const initCount = Math.round(20 * density);
  for (let i = 0; i < initCount; i++) ribbons.push(makeRibbon(w, h, true));
  return { ribbons, w, h, timer: 0 };
}

export function update(state, dt, elapsed, density = 1) {
  const { ribbons, w, h } = state;
  state.timer += dt;
  if (state.timer > 0.38 && ribbons.length < Math.round(28 * density)) {
    ribbons.push(makeRibbon(w, h, false));
    state.timer = 0;
  }
  for (let i = ribbons.length - 1; i >= 0; i--) {
    const r = ribbons[i];
    r.life   += dt;
    r.rot    += r.rotRate  * dt;
    r.twist  += r.twistRate * dt;
    r.x      += r.vx * dt;
    r.y      += r.vy * dt;
    r.vx     *= (1 - dt * 0.30);
    if (r.y - r.len > h + 20 || r.life > r.maxLife) ribbons.splice(i, 1);
  }
}

const SEGS = 22;

function drawRibbon(ctx, r) {
  const { x, y, len, width, rot, twist, waveCyc, waveAmp, hue, sat, lit } = r;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);

  for (let i = 0; i < SEGS; i++) {
    const t0 = i       / SEGS;
    const t1 = (i + 1) / SEGS;

    // Spine: sine wave along the ribbon's local y-axis
    const py0 = -len * 0.5 + len * t0;
    const py1 = -len * 0.5 + len * t1;
    const px0 = Math.sin(t0 * Math.PI * 2 * waveCyc) * len * waveAmp * 0.5;
    const px1 = Math.sin(t1 * Math.PI * 2 * waveCyc) * len * waveAmp * 0.5;

    // Twist: half-width oscillates, determines light vs dark face
    const cosT0 = Math.cos(twist + t0 * Math.PI * 3.5);
    const cosT1 = Math.cos(twist + t1 * Math.PI * 3.5);
    const hw0   = width * 0.5 * Math.abs(cosT0);
    const hw1   = width * 0.5 * Math.abs(cosT1);
    const avgC  = (cosT0 + cosT1) * 0.5;

    // Lightness: brighter when facing viewer, darker on back face
    const lMod  = avgC * 26;
    const sMod  = avgC > 0 ? 0 : -sat * 0.25;
    const lFin  = Math.max(18, Math.min(94, lit + lMod));
    const sFin  = Math.max(0,  sat + sMod);

    // Quad corners: top edge and bottom edge of this segment
    ctx.beginPath();
    ctx.moveTo(px0 - hw0, py0);
    ctx.lineTo(px1 - hw1, py1);
    ctx.lineTo(px1 + hw1, py1);
    ctx.lineTo(px0 + hw0, py0);
    ctx.closePath();
    ctx.fillStyle = `hsl(${hue},${Math.round(sFin)}%,${Math.round(lFin)}%)`;
    ctx.fill();
  }

  ctx.restore();
}

export default { name, init, update, draw };

export function draw(ctx, state) {
  ctx.save();
  [...state.ribbons].sort((a, b) => a.len - b.len).forEach(r => {
    const fadeIn  = Math.min(r.life / 0.5, 1);
    const fadeOut = Math.min((r.maxLife - r.life) / 0.8, 1);
    ctx.globalAlpha = fadeIn * fadeOut;
    drawRibbon(ctx, r);
  });
  ctx.restore();
}
