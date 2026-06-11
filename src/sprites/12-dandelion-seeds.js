// Dandelion Seeds — feathery seed puffs drifting weightlessly in all directions.
//
// Each seed has a tiny oval achene (seed body) at the bottom, a slender
// stalk, and a radiating "parachute" of fine filaments (pappus) at the top —
// rendered as 14-18 thin bezier lines fanning out from the stalk tip.
// They drift in gentle arcs, rotating slowly, and respond to a subtle
// simulated wind that occasionally gusts.

export const name = 'Dandelion Seeds';

function rand(min, max) { return min + Math.random() * (max - min); }

function makeSeed(w, h, spreadXY) {
  const angle = rand(0, Math.PI * 2);
  const speed = rand(20, 50);
  return {
    x:          spreadXY ? rand(0, w) : rand(w * 0.05, w * 0.95),
    y:          spreadXY ? rand(0, h) : rand(-30, h * 0.3),
    vx:         Math.cos(angle) * speed,
    vy:         Math.sin(angle) * speed * 0.5 + rand(-10, 10),
    baseRot:    rand(-0.28, 0.28),   // fixed gentle tilt
    rockPhase:  rand(0, Math.PI * 2),
    rockRate:   rand(0.5, 1.5),
    rockAmp:    rand(0.12, 0.30),    // ≈ ±7–17° — never inverts
    scale:      rand(0.6, 1.3),
    filaments:  Math.floor(rand(13, 19)),
    filamentLen:rand(10, 20),
    filamentSpread: rand(0.45, 0.70),   // cone half-angle (rad)
    alpha:      rand(0.75, 1.0),
    life:       0,
    maxLife:    rand(6, 14),
  };
}

export function init(w, h, density = 1) {
  const seeds = [];
  const initCount = Math.round(28 * density);
  for (let i = 0; i < initCount; i++) seeds.push(makeSeed(w, h, true));
  return { seeds, w, h, timer: 0, wind: 0, windTarget: 0, windTimer: 0 };
}

export function update(state, dt, elapsed, density = 1) {
  const { seeds, w, h } = state;

  // Slowly shifting wind
  state.windTimer += dt;
  if (state.windTimer > rand(2, 5)) {
    state.windTarget = rand(-30, 30);
    state.windTimer  = 0;
  }
  state.wind += (state.windTarget - state.wind) * dt * 0.6;

  state.timer += dt;
  if (state.timer > 0.45 && seeds.length < Math.round(40 * density)) {
    seeds.push(makeSeed(w, h, false));
    state.timer = 0;
  }

  for (let i = seeds.length - 1; i >= 0; i--) {
    const s = seeds[i];
    s.life       += dt;
    s.rockPhase  += s.rockRate * dt;
    s.vx         += (state.wind - s.vx) * dt * 0.25;
    s.vy    += (18 - s.vy) * dt * 0.15;    // gentle gravity
    s.x     += s.vx * dt;
    s.y     += s.vy * dt;

    if (s.y - s.filamentLen * s.scale > h + 10 || s.life > s.maxLife) seeds.splice(i, 1);
  }
}

function drawSeed(ctx, s) {
  const { scale, baseRot, rockPhase, rockAmp, filaments, filamentLen, filamentSpread, alpha, life, maxLife } = s;
  const rot = baseRot + Math.sin(rockPhase) * rockAmp;

  const fadeIn  = Math.min(life / 1.0, 1);
  const fadeOut = Math.min((maxLife - life) / 1.5, 1);
  ctx.globalAlpha = alpha * fadeIn * fadeOut;

  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(rot);
  ctx.scale(scale, scale);

  const stalkLen = filamentLen * 1.1;

  // ── Stalk ─────────────────────────────────────────────────────
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -stalkLen);
  ctx.strokeStyle = 'rgba(200,190,160,0.85)';
  ctx.lineWidth   = 0.9;
  ctx.lineCap     = 'round';
  ctx.stroke();

  // ── Pappus filaments — fan out from stalk tip ─────────────────
  const tipY = -stalkLen;
  for (let i = 0; i < filaments; i++) {
    const t     = (i / (filaments - 1)) - 0.5;        // -0.5 → +0.5
    const ang   = t * filamentSpread * 2;              // fan angle
    const fl    = filamentLen * (0.85 + Math.abs(t) * 0.30);
    const ex    = Math.sin(ang) * fl;
    const ey    = -Math.cos(ang) * fl;

    // Slight curve to each filament
    const cx    = Math.sin(ang) * fl * 0.6 + rand(-1, 1);
    const cy    = -Math.cos(ang) * fl * 0.55;

    ctx.beginPath();
    ctx.moveTo(0, tipY);
    ctx.quadraticCurveTo(cx, tipY + cy, ex, tipY + ey);
    ctx.strokeStyle = 'rgba(240,236,220,0.80)';
    ctx.lineWidth   = 0.7;
    ctx.stroke();

    // Tiny sphere at filament tip
    ctx.beginPath();
    ctx.arc(ex, tipY + ey, 1.2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(245,240,225,0.90)';
    ctx.fill();
  }

  // ── Seed achene (oval body at base of stalk) ──────────────────
  ctx.beginPath();
  ctx.ellipse(0, 4, 2.0, 4.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(160,140,100,0.88)';
  ctx.fill();

  ctx.restore();
}

export default { name, init, update, draw };

export function draw(ctx, state) {
  ctx.save();
  [...state.seeds].sort((a, b) => a.scale - b.scale).forEach(s => drawSeed(ctx, s));
  ctx.globalAlpha = 1;
  ctx.restore();
}
