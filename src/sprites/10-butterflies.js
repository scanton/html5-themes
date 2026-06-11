// Butterflies — winged creatures fluttering in lazy arcs across the canvas.
//
// Each butterfly has two upper and two lower wing lobes drawn as bezier
// ellipses.  Wings flap with a sine-driven scale so they open and close
// naturally.  Bodies are a small capsule between the wings.  They steer on
// gentle curved paths, occasionally pausing their flap to glide.
// Five colour schemes: monarch, blue morpho, swallowtail, white/pearl, pink.

export const name = 'Butterflies';

function rand(min, max) { return min + Math.random() * (max - min); }

const SCHEMES = [
  // upperFill, upperEdge, lowerFill, lowerEdge, bodyColor, spotColor
  { uf:'#E8820C', ue:'#2A1200', lf:'#F5A623', le:'#2A1200', body:'#1A0800', spot:'#FFFDE0' }, // monarch
  { uf:'#1060E8', ue:'#000835', lf:'#2280FF', le:'#001050', body:'#040820', spot:'#A0CFFF' }, // blue morpho
  { uf:'#D4E832', ue:'#1A2000', lf:'#B8D015', le:'#1A2000', body:'#0A1000', spot:'#FFFFA0' }, // swallowtail
  { uf:'#F5F5F5', ue:'#888888', lf:'#E8E0EE', le:'#999999', body:'#555555', spot:'#FFFFFF' }, // white/pearl
  { uf:'#FF6ED8', ue:'#660044', lf:'#FF9EE8', le:'#880055', body:'#330022', spot:'#FFDDFF' }, // pink
];

function makeButterfly(w, h, spreadXY) {
  const scheme = SCHEMES[Math.floor(rand(0, SCHEMES.length))];
  const scale  = rand(0.55, 1.10);
  const speed  = rand(45, 90);
  const angle  = rand(0, Math.PI * 2);
  return {
    x:          spreadXY ? rand(0, w) : rand(w * 0.05, w * 0.95),
    y:          spreadXY ? rand(0, h) : rand(h * 0.05, h * 0.95),
    scale,
    vx:         Math.cos(angle) * speed,
    vy:         Math.sin(angle) * speed,
    angle,
    steerPhase: rand(0, Math.PI * 2),
    steerRate:  rand(0.5, 1.5) * (Math.random() < 0.5 ? 1 : -1),
    steerAmp:   rand(0.6, 2.0),
    flapPhase:  rand(0, Math.PI * 2),
    flapRate:   rand(4, 9),      // flaps per second
    scheme,
    life:       0,
    maxLife:    rand(8, 16),
  };
}

export function init(w, h, density = 1) {
  const butterflies = [];
  const initCount = Math.round(10 * density);
  for (let i = 0; i < initCount; i++) butterflies.push(makeButterfly(w, h, true));
  return { butterflies, w, h, timer: 0 };
}

export function update(state, dt, elapsed, density = 1) {
  const { butterflies, w, h } = state;
  state.timer += dt;
  if (state.timer > 1.1 && butterflies.length < Math.round(14 * density)) {
    butterflies.push(makeButterfly(w, h, false));
    state.timer = 0;
  }

  for (let i = butterflies.length - 1; i >= 0; i--) {
    const b = butterflies[i];
    b.life       += dt;
    b.flapPhase  += b.flapRate * dt;
    b.steerPhase += b.steerRate * dt;

    b.angle += Math.sin(b.steerPhase) * b.steerAmp * dt;
    const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
    b.vx = Math.cos(b.angle) * speed;
    b.vy = Math.sin(b.angle) * speed;
    b.x += b.vx * dt;
    b.y += b.vy * dt;

    if (b.x < -60) b.x = w + 60;
    if (b.x > w + 60) b.x = -60;
    if (b.y < -60) b.y = h + 60;
    if (b.y > h + 60) b.y = -60;

    if (b.life > b.maxLife) butterflies.splice(i, 1);
  }
}

// Draw one wing lobe as a filled bezier ellipse
function wingLobe(ctx, x1, y1, cx1, cy1, cx2, cy2, x2, y2, fillColor, edgeColor, alpha) {
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(cx1, cy1, cx2, cy2, x2, y2);
  ctx.bezierCurveTo(x2 * 0.5, y2 * 1.1, x1 * 0.5, y1 * 1.1, 0, 0);
  ctx.closePath();
  ctx.fillStyle   = fillColor;
  ctx.fill();
  ctx.strokeStyle = edgeColor;
  ctx.lineWidth   = 1.0;
  ctx.stroke();
}

function drawButterfly(ctx, b) {
  const { x, y, scale, angle, flapPhase, scheme, life, maxLife } = b;
  const fadeIn  = Math.min(life / 1.0, 1);
  const fadeOut = Math.min((maxLife - life) / 1.5, 1);
  ctx.globalAlpha = fadeIn * fadeOut;

  ctx.save();
  ctx.translate(x, y);
  // Orient along flight direction
  ctx.rotate(angle + Math.PI * 0.5);
  ctx.scale(scale, scale);

  // Flap: wings open/close via X scale oscillation
  // flapOpen goes 0 (edge-on) → 1 (fully open)
  const flapOpen = 0.25 + 0.75 * Math.abs(Math.cos(flapPhase));
  const wScaleX  = flapOpen;   // X compression for flap

  const { uf, ue, lf, le, body, spot } = scheme;

  // ── Upper wings (left & right) ────────────────────────────────
  // Right upper
  ctx.save();
  ctx.scale(wScaleX, 1);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(18, -28,  38, -22,  34, -4);
  ctx.bezierCurveTo(30,  10,  10,  12,   0,  4);
  ctx.closePath();
  ctx.fillStyle   = uf;
  ctx.fill();
  ctx.strokeStyle = ue;
  ctx.lineWidth   = 1.2;
  ctx.stroke();
  // Wing vein
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(10, -12, 22, -10, 28, -5);
  ctx.strokeStyle = ue;
  ctx.lineWidth   = 0.6;
  ctx.globalAlpha = ctx.globalAlpha * 0.55;
  ctx.stroke();
  ctx.globalAlpha = fadeIn * fadeOut;
  // Spot
  ctx.beginPath();
  ctx.arc(22, -14, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = spot;
  ctx.fill();
  ctx.restore();

  // Left upper (mirror)
  ctx.save();
  ctx.scale(-wScaleX, 1);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(18, -28,  38, -22,  34, -4);
  ctx.bezierCurveTo(30,  10,  10,  12,   0,  4);
  ctx.closePath();
  ctx.fillStyle   = uf;
  ctx.fill();
  ctx.strokeStyle = ue;
  ctx.lineWidth   = 1.2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(22, -14, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = spot;
  ctx.fill();
  ctx.restore();

  // ── Lower wings (left & right) ────────────────────────────────
  ctx.save();
  ctx.scale(wScaleX, 1);
  ctx.beginPath();
  ctx.moveTo(0, 2);
  ctx.bezierCurveTo(14,  8,  28, 16,  24, 26);
  ctx.bezierCurveTo(18, 34,   4, 28,   0, 18);
  ctx.closePath();
  ctx.fillStyle   = lf;
  ctx.fill();
  ctx.strokeStyle = le;
  ctx.lineWidth   = 1.0;
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.scale(-wScaleX, 1);
  ctx.beginPath();
  ctx.moveTo(0, 2);
  ctx.bezierCurveTo(14,  8,  28, 16,  24, 26);
  ctx.bezierCurveTo(18, 34,   4, 28,   0, 18);
  ctx.closePath();
  ctx.fillStyle   = lf;
  ctx.fill();
  ctx.strokeStyle = le;
  ctx.lineWidth   = 1.0;
  ctx.stroke();
  ctx.restore();

  // ── Body capsule ──────────────────────────────────────────────
  ctx.beginPath();
  ctx.ellipse(0, 8, 2.8, 14, 0, 0, Math.PI * 2);
  ctx.fillStyle = body;
  ctx.fill();

  // Antennae
  ctx.strokeStyle = body;
  ctx.lineWidth   = 1.0;
  ctx.lineCap     = 'round';
  ctx.beginPath();
  ctx.moveTo(-2, -5);
  ctx.bezierCurveTo(-8, -18, -14, -22, -12, -28);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo( 2, -5);
  ctx.bezierCurveTo( 8, -18,  14, -22,  12, -28);
  ctx.stroke();
  // Antenna tips
  ctx.fillStyle = body;
  ctx.beginPath(); ctx.arc(-12, -29, 2, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( 12, -29, 2, 0, Math.PI*2); ctx.fill();

  ctx.restore();
}

export default { name, init, update, draw };

export function draw(ctx, state) {
  ctx.save();
  [...state.butterflies].sort((a, b) => a.scale - b.scale).forEach(b => drawButterfly(ctx, b));
  ctx.globalAlpha = 1;
  ctx.restore();
}
