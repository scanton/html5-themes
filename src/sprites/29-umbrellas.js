// Umbrellas — colourful open umbrellas adrift on the storm wind,
// Mary-Poppins style. Each has a scalloped panelled canopy with
// alternating colour wedges, rib tips, a ferrule, a curved hook
// handle, and a wet sheen. They sway as they drift diagonally,
// bobbing on gusts; a few slowly pirouette.

export const name = 'Umbrellas';

function rand(min, max) { return min + Math.random() * (max - min); }

const SCHEMES = [
  { a: '#e84545', b: '#f8f0e8', pole: '#7a5230' },   // red & cream
  { a: '#2878d0', b: '#a8d8f8', pole: '#5a4a38' },   // blues
  { a: '#f2b830', b: '#f8ecd0', pole: '#7a5230' },   // gold & ivory
  { a: '#38a060', b: '#c8ecd8', pole: '#5a4a38' },   // greens
  { a: '#9050c8', b: '#e0c8f4', pole: '#4a4055' },   // purples
  { a: '#222831', b: '#3a4250', pole: '#2a2a30' },   // city black
  { a: '#e85d8a', b: '#f8d8e4', pole: '#7a5230' },   // pinks
];

const PANELS = 4;   // visible scallop panels

function makeUmbrella(w, h, spreadXY) {
  const scheme = SCHEMES[Math.floor(rand(0, SCHEMES.length))];
  const r = rand(22, 46);                      // canopy radius
  const spinner = Math.random() < 0.3;         // some slowly pirouette
  return {
    x: spreadXY ? rand(r, w - r) : -(r * 2 + rand(0, 120)),
    y: spreadXY ? rand(r, h - r) : rand(h * 0.05, h * 0.85),
    r, scheme, spinner,
    vx: rand(28, 60),                          // wind blows rightward
    vy: rand(-6, 14),
    sway:     rand(0, Math.PI * 2),
    swayRate: rand(0.7, 1.4),
    swayAmp:  rand(0.14, 0.30),
    spin:     rand(0, Math.PI * 2),
    spinRate: rand(0.25, 0.6) * (Math.random() < 0.5 ? 1 : -1),
    bob:      rand(0, Math.PI * 2),
    bobRate:  rand(0.5, 1.1),
    bobAmp:   rand(8, 20),
    gust:     rand(0, Math.PI * 2),
    gustRate: rand(0.2, 0.45),
    alpha:    rand(0.88, 1.0),
    life:     0,
    maxLife:  rand(12, 24),
  };
}

export function init(w, h, density = 1) {
  const umbrellas = [];
  const initCount = Math.round(9 * density);
  for (let i = 0; i < initCount; i++) umbrellas.push(makeUmbrella(w, h, true));
  return { umbrellas, w, h, timer: 0 };
}

export function update(state, dt, elapsed, density = 1) {
  const { umbrellas, w, h } = state;
  state.timer += dt;
  if (state.timer > 1.3 && umbrellas.length < Math.round(13 * density)) {
    umbrellas.push(makeUmbrella(w, h, false));
    state.timer = 0;
  }
  for (let i = umbrellas.length - 1; i >= 0; i--) {
    const u = umbrellas[i];
    u.life += dt;
    u.sway += u.swayRate * dt;
    u.bob  += u.bobRate * dt;
    u.gust += u.gustRate * dt;
    if (u.spinner) u.spin += u.spinRate * dt;
    // gusts surge the wind speed
    const gustK = 1.0 + Math.max(0, Math.sin(u.gust)) * 0.8;
    u.x += u.vx * gustK * dt;
    u.y += (u.vy + Math.sin(u.bob) * u.bobAmp) * dt;
    if (u.x - u.r * 3 > w || u.life > u.maxLife) umbrellas.splice(i, 1);
  }
}

// scalloped canopy outline: dome top, panel scallops along the bottom
function canopyPath(ctx, r) {
  const tips = [];
  for (let i = 0; i <= PANELS; i++) tips.push(-r + (2 * r * i) / PANELS);
  ctx.beginPath();
  ctx.moveTo(tips[0], 0);
  // dome: left tip up over the top to right tip
  ctx.bezierCurveTo(-r, -r * 0.52, -r * 0.55, -r * 0.78, 0, -r * 0.78);
  ctx.bezierCurveTo(r * 0.55, -r * 0.78, r, -r * 0.52, tips[PANELS], 0);
  // scallops: bottom edge curves up between rib tips
  for (let i = PANELS; i > 0; i--) {
    const x0 = tips[i], x1 = tips[i - 1];
    ctx.quadraticCurveTo((x0 + x1) / 2, -r * 0.16, x1, 0);
  }
  ctx.closePath();
}

function drawUmbrella(ctx, u) {
  const { r, scheme, sway, swayAmp, spin, spinner, alpha, life, maxLife } = u;
  const rot = Math.sin(sway) * swayAmp + 0.18 + (spinner ? spin : 0);
  const fadeIn  = Math.min(life / 0.8, 1);
  const fadeOut = Math.min((maxLife - life) / 1.6, 1);
  ctx.globalAlpha = Math.max(0, alpha * fadeIn * fadeOut);

  ctx.save();
  ctx.translate(u.x, u.y);
  ctx.rotate(rot);

  const tips = [];
  for (let i = 0; i <= PANELS; i++) tips.push(-r + (2 * r * i) / PANELS);

  // ── pole + hook handle (behind canopy) ──
  ctx.strokeStyle = scheme.pole;
  ctx.lineWidth = Math.max(1.6, r * 0.07);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.74);
  ctx.lineTo(0, r * 1.10);
  ctx.stroke();
  // hook
  ctx.beginPath();
  ctx.arc(-r * 0.13, r * 1.10, r * 0.13, 0, Math.PI, false);
  ctx.stroke();
  // ferrule above the dome
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.78);
  ctx.lineTo(0, -r * 0.96);
  ctx.stroke();

  // ── canopy: base colour, then alternate panel wedges ──
  canopyPath(ctx, r);
  ctx.fillStyle = scheme.a;
  ctx.fill();

  ctx.save();
  canopyPath(ctx, r);
  ctx.clip();
  // alternate panels in colour b (wedges from the apex)
  for (let i = 0; i < PANELS; i++) {
    if (i % 2 === 0) continue;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.80);
    ctx.lineTo(tips[i], r * 0.05);
    ctx.lineTo(tips[i + 1], r * 0.05);
    ctx.closePath();
    ctx.fillStyle = scheme.b;
    ctx.fill();
  }
  // wet sheen: soft diagonal highlight across the dome
  const sheen = ctx.createLinearGradient(-r, -r, r * 0.4, 0);
  sheen.addColorStop(0,   'rgba(255,255,255,0.34)');
  sheen.addColorStop(0.45,'rgba(255,255,255,0.10)');
  sheen.addColorStop(1,   'rgba(255,255,255,0)');
  canopyPath(ctx, r);
  ctx.fillStyle = sheen;
  ctx.fill();
  // shadow under the canopy lip
  const lip = ctx.createLinearGradient(0, -r * 0.2, 0, r * 0.05);
  lip.addColorStop(0, 'rgba(0,0,0,0)');
  lip.addColorStop(1, 'rgba(0,0,0,0.22)');
  canopyPath(ctx, r);
  ctx.fillStyle = lip;
  ctx.fill();
  ctx.restore();

  // panel seams: rib lines from apex to each tip
  ctx.strokeStyle = 'rgba(0,0,0,0.30)';
  ctx.lineWidth = Math.max(0.6, r * 0.022);
  for (let i = 1; i < PANELS; i++) {
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.80);
    ctx.quadraticCurveTo(tips[i] * 0.55, -r * 0.46, tips[i], 0);
    ctx.stroke();
  }
  // canopy outline
  canopyPath(ctx, r);
  ctx.stroke();

  // rib tip nubs
  ctx.fillStyle = scheme.pole;
  tips.forEach(tx => {
    ctx.beginPath();
    ctx.arc(tx, 0, Math.max(1, r * 0.035), 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}

export default { name, init, update, draw };

export function draw(ctx, state) {
  ctx.save();
  // depth order: small (far) umbrellas draw first, large (near) on top
  [...state.umbrellas].sort((a, b) => a.r - b.r)
    .forEach(u => drawUmbrella(ctx, u));
  ctx.globalAlpha = 1;
  ctx.restore();
}
