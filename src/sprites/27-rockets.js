// Rockets — retro chrome-and-colour rockets that fly exactly along their
// thrust line. The nose always points where the rocket is going (rotation
// is derived from velocity every frame), with a flickering two-layer
// exhaust plume and a drifting smoke-puff trail behind the nozzle.

export const name = 'Rockets';

function rand(min, max) { return min + Math.random() * (max - min); }

const COLORS = [
  { hull: '#e84040', hullDark: '#9c1818', trim: '#f8f8fc', window: '#9adcff' },
  { hull: '#3a7ce8', hullDark: '#1a3e9c', trim: '#f8f8fc', window: '#c8f4ff' },
  { hull: '#f0f0f4', hullDark: '#a8a8b8', trim: '#e84040', window: '#9adcff' },
  { hull: '#ffb830', hullDark: '#b87208', trim: '#f8f8fc', window: '#d8f8ff' },
  { hull: '#28c060', hullDark: '#107038', trim: '#f8f8fc', window: '#c8ffe0' },
];

function makeRocket(w, h, spreadXY) {
  const col  = COLORS[Math.floor(rand(0, COLORS.length))];
  const size = rand(22, 40);
  // launch from bottom, flying up at a gentle slant
  const angle = -Math.PI / 2 + rand(-0.5, 0.5);
  const speed = rand(70, 150);
  return {
    x: spreadXY ? rand(size, w - size) : rand(w * 0.1, w * 0.9),
    y: spreadXY ? rand(size, h - size) : h + size * 2 + rand(0, 80),
    size, col,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    // slow graceful arc: angle drifts; rotation FOLLOWS velocity exactly
    turn:     rand(0, Math.PI * 2),
    turnRate: rand(0.2, 0.5) * (Math.random() < 0.5 ? 1 : -1),
    turnAmp:  rand(0.10, 0.32),
    flick:    rand(0, Math.PI * 2),     // flame flicker phase
    smoke:    [],                        // trailing smoke puffs
    smokeTimer: 0,
    life:    0,
    maxLife: rand(6, 13),
  };
}

export function init(w, h, density = 1) {
  const rockets = [];
  const initCount = Math.round(7 * density);
  for (let i = 0; i < initCount; i++) rockets.push(makeRocket(w, h, true));
  return { rockets, w, h, timer: 0 };
}

export function update(state, dt, elapsed, density = 1) {
  const { rockets, w, h } = state;
  state.timer += dt;
  if (state.timer > 1.1 && rockets.length < Math.round(12 * density)) {
    rockets.push(makeRocket(w, h, false));
    state.timer = 0;
  }
  for (let i = rockets.length - 1; i >= 0; i--) {
    const r = rockets[i];
    r.life  += dt;
    r.turn  += r.turnRate * dt;
    r.flick += dt * 30;
    r.smokeTimer += dt;

    // steer: rotate the velocity vector — motion and heading stay locked
    const steer = Math.sin(r.turn) * r.turnAmp * dt;
    const cs = Math.cos(steer), sn = Math.sin(steer);
    const nvx = r.vx * cs - r.vy * sn;
    const nvy = r.vx * sn + r.vy * cs;
    r.vx = nvx; r.vy = nvy;
    r.x += r.vx * dt;
    r.y += r.vy * dt;

    const offscreen = r.x < -r.size * 5 || r.x > w + r.size * 5 ||
                      r.y < -r.size * 5 || r.y > h + r.size * 5;
    const expired = r.life > r.maxLife || offscreen;

    // drop a smoke puff at the nozzle every so often
    // (stop once expired/offscreen so the rocket can actually be removed)
    if (!expired && r.smokeTimer > 0.07) {
      r.smokeTimer = 0;
      const ang = Math.atan2(r.vy, r.vx);
      const back = r.size * 1.05;
      r.smoke.push({
        x: r.x - Math.cos(ang) * back,
        y: r.y - Math.sin(ang) * back,
        vx: -Math.cos(ang) * 12 + rand(-8, 8),
        vy: -Math.sin(ang) * 12 + rand(-8, 8),
        r: rand(2, 4),
        life: 0,
        maxLife: rand(0.5, 1.1),
      });
    }
    for (let si = r.smoke.length - 1; si >= 0; si--) {
      const s = r.smoke[si];
      s.life += dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.r += dt * 9;                       // puffs expand
      if (s.life > s.maxLife) r.smoke.splice(si, 1);
    }

    if (expired && r.smoke.length === 0) rockets.splice(i, 1);
  }
}

function drawRocket(ctx, r) {
  const { size: sz, col, flick, life, maxLife } = r;
  const fadeIn  = Math.min(life / 0.5, 1);
  const fadeOut = Math.min((maxLife - life) / 1.0, 1);
  const a = Math.max(0, fadeIn * fadeOut);

  // smoke puffs render in world space (they're left behind)
  r.smoke.forEach(s => {
    const sa = (1 - s.life / s.maxLife) * 0.30 * Math.max(a, 0.3);
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200,200,210,${sa})`;
    ctx.fill();
  });
  if (a <= 0) return;
  ctx.globalAlpha = a;

  ctx.save();
  ctx.translate(r.x, r.y);
  // nose points exactly along velocity — drawn nose-up, so +90°
  ctx.rotate(Math.atan2(r.vy, r.vx) + Math.PI / 2);

  const bodyW = sz * 0.40;        // half width
  const noseY = -sz * 1.05;       // nose tip
  const tailY =  sz * 0.55;       // body bottom
  const flicker = 0.82 + Math.sin(flick) * 0.10 + Math.sin(flick * 2.7) * 0.08;

  // ── exhaust plume: outer orange + inner white-hot core, flickering ──
  const plumeL = sz * (1.3 * flicker);
  const nozzY  = tailY + sz * 0.16;
  // outer
  ctx.beginPath();
  ctx.moveTo(-bodyW * 0.50, nozzY);
  ctx.quadraticCurveTo(-bodyW * 0.62, nozzY + plumeL * 0.45, 0, nozzY + plumeL);
  ctx.quadraticCurveTo( bodyW * 0.62, nozzY + plumeL * 0.45, bodyW * 0.50, nozzY);
  ctx.closePath();
  const og = ctx.createLinearGradient(0, nozzY, 0, nozzY + plumeL);
  og.addColorStop(0, 'rgba(255,170,40,0.95)');
  og.addColorStop(0.6, 'rgba(255,90,20,0.7)');
  og.addColorStop(1, 'rgba(255,60,10,0)');
  ctx.fillStyle = og;
  ctx.fill();
  // core
  ctx.beginPath();
  ctx.moveTo(-bodyW * 0.26, nozzY);
  ctx.quadraticCurveTo(-bodyW * 0.30, nozzY + plumeL * 0.30, 0, nozzY + plumeL * 0.55);
  ctx.quadraticCurveTo( bodyW * 0.30, nozzY + plumeL * 0.30, bodyW * 0.26, nozzY);
  ctx.closePath();
  const cg = ctx.createLinearGradient(0, nozzY, 0, nozzY + plumeL * 0.55);
  cg.addColorStop(0, 'rgba(255,255,235,1)');
  cg.addColorStop(1, 'rgba(255,220,80,0)');
  ctx.fillStyle = cg;
  ctx.fill();

  // ── swept tail fins (3 visible: left, right, centre-front) ──
  const finTop = sz * 0.10;
  [[-1], [1]].forEach(([side]) => {
    ctx.beginPath();
    ctx.moveTo(side * bodyW * 0.9, finTop);
    ctx.bezierCurveTo(side * bodyW * 2.0, tailY * 0.6,
                      side * bodyW * 1.9, tailY + sz * 0.30,
                      side * bodyW * 1.45, tailY + sz * 0.28);
    ctx.lineTo(side * bodyW * 0.84, tailY);
    ctx.closePath();
    const fg = ctx.createLinearGradient(side * bodyW * 0.9, 0, side * bodyW * 2.0, 0);
    fg.addColorStop(0, col.hull);
    fg.addColorStop(1, col.hullDark);
    ctx.fillStyle = fg;
    ctx.fill();
    ctx.strokeStyle = col.hullDark;
    ctx.lineWidth = Math.max(0.7, sz * 0.025);
    ctx.lineJoin = 'round';
    ctx.stroke();
  });

  // ── hull: cigar profile with chrome shading ──
  ctx.beginPath();
  ctx.moveTo(0, noseY);
  ctx.bezierCurveTo( bodyW * 0.9, noseY + sz * 0.42,  bodyW, -sz * 0.1,  bodyW, sz * 0.12);
  ctx.bezierCurveTo( bodyW, sz * 0.38,  bodyW * 0.72, tailY,  bodyW * 0.5, tailY);
  ctx.lineTo(-bodyW * 0.5, tailY);
  ctx.bezierCurveTo(-bodyW * 0.72, tailY, -bodyW, sz * 0.38, -bodyW, sz * 0.12);
  ctx.bezierCurveTo(-bodyW, -sz * 0.1, -bodyW * 0.9, noseY + sz * 0.42, 0, noseY);
  ctx.closePath();
  const hg = ctx.createLinearGradient(-bodyW, 0, bodyW, 0);
  hg.addColorStop(0,    col.hullDark);
  hg.addColorStop(0.30, col.hull);
  hg.addColorStop(0.46, '#ffffff');     // chrome glint stripe
  hg.addColorStop(0.62, col.hull);
  hg.addColorStop(1,    col.hullDark);
  ctx.fillStyle = hg;
  ctx.fill();
  ctx.strokeStyle = col.hullDark;
  ctx.lineWidth = Math.max(0.8, sz * 0.030);
  ctx.stroke();

  // ── nose cone in trim colour ──
  ctx.beginPath();
  ctx.moveTo(0, noseY);
  ctx.bezierCurveTo(bodyW * 0.62, noseY + sz * 0.28, bodyW * 0.78, noseY + sz * 0.40, bodyW * 0.82, noseY + sz * 0.52);
  ctx.quadraticCurveTo(0, noseY + sz * 0.36, -bodyW * 0.82, noseY + sz * 0.52);
  ctx.bezierCurveTo(-bodyW * 0.78, noseY + sz * 0.40, -bodyW * 0.62, noseY + sz * 0.28, 0, noseY);
  ctx.closePath();
  ctx.fillStyle = col.trim;
  ctx.fill();
  ctx.strokeStyle = col.hullDark;
  ctx.lineWidth = Math.max(0.6, sz * 0.022);
  ctx.stroke();

  // ── porthole with rim + glint ──
  const winY = -sz * 0.18;
  const winR = sz * 0.20;
  ctx.beginPath();
  ctx.arc(0, winY, winR, 0, Math.PI * 2);
  ctx.fillStyle = col.trim;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, winY, winR * 0.72, 0, Math.PI * 2);
  const wg = ctx.createRadialGradient(-winR * 0.25, winY - winR * 0.25, 0, 0, winY, winR * 0.72);
  wg.addColorStop(0, '#ffffff');
  wg.addColorStop(0.35, col.window);
  wg.addColorStop(1, '#3a6a90');
  ctx.fillStyle = wg;
  ctx.fill();

  // ── nozzle skirt ──
  ctx.beginPath();
  ctx.moveTo(-bodyW * 0.5, tailY);
  ctx.lineTo(-bodyW * 0.62, nozzY);
  ctx.lineTo( bodyW * 0.62, nozzY);
  ctx.lineTo( bodyW * 0.5, tailY);
  ctx.closePath();
  ctx.fillStyle = col.hullDark;
  ctx.fill();

  ctx.restore();
}

export default { name, init, update, draw };

export function draw(ctx, state) {
  ctx.save();
  // depth order: small (far) rockets draw first, large (near) on top
  [...state.rockets].sort((a, b) => a.size - b.size)
    .forEach(r => drawRocket(ctx, r));
  ctx.globalAlpha = 1;
  ctx.restore();
}
