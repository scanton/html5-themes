// Moon Phases — ivory and gold crescent-to-full moons drifting slowly across
// the canvas, each showing a different phase of the lunar cycle.
//
// Phase is rendered via a clip trick: the lit disc is drawn, then an offset
// shadow disc is subtracted (for crescent) or the terminator is simply a
// gradient boundary.  Eight distinct phases cycle through the pool.
// Moons drift slowly with a gentle vertical oscillation.

export const name = 'Moon Phases';

function rand(min, max) { return min + Math.random() * (max - min); }

// 8 phases: 0=new(skip), 1=waxing crescent, 2=first quarter, 3=waxing gibbous,
//           4=full, 5=waning gibbous, 6=last quarter, 7=waning crescent
const PHASES = [1, 2, 3, 4, 4, 4, 5, 6, 7];   // full moon more common

function makeMoon(w, h, spreadXY) {
  const phase = PHASES[Math.floor(rand(0, PHASES.length))];
  const r     = rand(20, 50);
  return {
    x:          spreadXY ? rand(r * 2, w - r * 2) : rand(r * 2, w - r * 2),
    y:          spreadXY ? rand(r, h - r) : -r - rand(0, 60),
    r,
    phase,
    tilt:       rand(-0.3, 0.3),     // slight random tilt
    vx:         rand(-10, 10),
    vy:         rand(15, 35),
    bob:        rand(0, Math.PI * 2),
    bobRate:    rand(0.3, 0.8),
    bobAmp:     rand(8, 20),
    alpha:      rand(0.75, 0.95),
    life:       0,
    maxLife:    rand(8, 18),
  };
}

export function init(w, h, density = 1) {
  const moons = [];
  const initCount = Math.round(6 * density);
  for (let i = 0; i < initCount; i++) moons.push(makeMoon(w, h, true));
  return { moons, w, h, timer: 0 };
}

export function update(state, dt, elapsed, density = 1) {
  const { moons, w, h } = state;
  state.timer += dt;
  if (state.timer > 1.8 && moons.length < Math.round(9 * density)) {
    moons.push(makeMoon(w, h, false));
    state.timer = 0;
  }
  for (let i = moons.length - 1; i >= 0; i--) {
    const m = moons[i];
    m.life  += dt;
    m.bob   += m.bobRate * dt;
    m.x     += m.vx * dt;
    m.y     += (m.vy + Math.sin(m.bob) * m.bobAmp) * dt;
    if (m.y - m.r > h + 10 || m.life > m.maxLife) moons.splice(i, 1);
  }
}

function drawMoon(ctx, m) {
  const { r, phase, tilt, alpha, life, maxLife } = m;
  const fadeIn  = Math.min(life / 1.5, 1);
  const fadeOut = Math.min((maxLife - life) / 2.0, 1);
  ctx.globalAlpha = alpha * fadeIn * fadeOut;

  ctx.save();
  ctx.translate(m.x, m.y);
  ctx.rotate(tilt);

  // ── Outer glow halo ───────────────────────────────────────────
  const haloR  = r * 2.0;
  const halo   = ctx.createRadialGradient(0, 0, r * 0.8, 0, 0, haloR);
  halo.addColorStop(0,   'rgba(255,245,200,0.18)');
  halo.addColorStop(0.5, 'rgba(255,235,160,0.08)');
  halo.addColorStop(1,   'rgba(255,220,120,0)');
  ctx.beginPath();
  ctx.arc(0, 0, haloR, 0, Math.PI * 2);
  ctx.fillStyle = halo;
  ctx.fill();

  // Phase: 4 = full moon, 1-3 = waxing, 5-7 = waning
  // Use a clip region (full disc) then draw illuminated portion via
  // composition trick: draw lit disc, then mask out dark region with
  // a dark disc offset to create crescent.

  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.clip();

  if (phase === 4) {
    // ── Full moon ─────────────────────────────────────────────
    const fill = ctx.createRadialGradient(-r * 0.15, -r * 0.15, 0, 0, 0, r);
    fill.addColorStop(0,   'rgb(255,252,225)');
    fill.addColorStop(0.6, 'rgb(245,235,190)');
    fill.addColorStop(1,   'rgb(220,205,160)');
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();

    // Mare (dark patches) suggestion
    const mare = [
      { x: -r*0.22, y: -r*0.18, r: r*0.22 },
      { x:  r*0.18, y:  r*0.10, r: r*0.16 },
      { x: -r*0.10, y:  r*0.25, r: r*0.13 },
    ];
    mare.forEach(ma => {
      ctx.beginPath();
      ctx.arc(ma.x, ma.y, ma.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(180,165,120,0.28)';
      ctx.fill();
    });

  } else {
    // ── Crescent / quarter / gibbous ─────────────────────────
    // Draw the full lit disc first
    const fill = ctx.createRadialGradient(-r * 0.1, -r * 0.1, 0, 0, 0, r);
    fill.addColorStop(0,   'rgb(255,252,225)');
    fill.addColorStop(0.7, 'rgb(240,228,185)');
    fill.addColorStop(1,   'rgb(215,200,152)');
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();

    // Terminator offset determines phase
    // phase 1: crescent (shadow covers most of disc)
    // phase 2: quarter (shadow covers half)
    // phase 3: gibbous (shadow covers ~¼)
    // phases 5-7: same but mirrored
    const waxing  = phase <= 4;
    const t       = ((waxing ? phase : 8 - phase) - 1) / 3;   // 0=crescent, 1=full
    const offX    = r * (1.0 - t * 2.0) * (waxing ? 1 : -1);  // shadow circle offset

    ctx.beginPath();
    ctx.arc(offX, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(8,6,20,0.94)';
    ctx.fill();
  }

  ctx.restore();

  // ── Limb outline ──────────────────────────────────────────────
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,245,190,0.20)';
  ctx.lineWidth   = Math.max(0.8, r * 0.035);
  ctx.stroke();

  ctx.restore();
}

export default { name, init, update, draw };

export function draw(ctx, state) {
  ctx.save();
  state.moons.forEach(m => drawMoon(ctx, m));
  ctx.globalAlpha = 1;
  ctx.restore();
}
