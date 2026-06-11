// Astronauts — chibi spacewalkers tumbling slowly in zero-g. Big round
// helmet with a gold mirrored visor (star glint sweeps across it as
// they rotate), white suit with chest panel and coloured trim, jointed
// limbs that drift lazily, a backpack, and occasional RCS thruster
// puffs that nudge them — the puff visibly matches the nudge.

export const name = 'Astronauts';

function rand(min, max) { return min + Math.random() * (max - min); }

const TRIMS = ['#e84545', '#2878d0', '#f2a030', '#38a060', '#9050c8'];

function makeAstronaut(w, h, spreadXY) {
  const sz = rand(26, 46);
  return {
    x: spreadXY ? rand(sz * 2, w - sz * 2) : (Math.random() < 0.5 ? -sz * 3 : w + sz * 3),
    y: spreadXY ? rand(sz * 2, h - sz * 2) : rand(h * 0.1, h * 0.9),
    sz,
    trim: TRIMS[Math.floor(rand(0, TRIMS.length))],
    vx: rand(-7, 7) || 5,                 // slow drift so burns read clearly
    vy: rand(-5, 5),
    rot:     rand(0, Math.PI * 2),
    rotRate: rand(-0.3, 0.3),
    // limb drift phases
    limb:     rand(0, Math.PI * 2),
    limbRate: rand(0.4, 0.8),
    puffs:    [],
    puffTimer: rand(2, 6),
    burstT:    0,                          // remaining burn time
    burstAng:  0,                          // thrust (acceleration) direction
    jetTimer:  0,
    glint:    rand(0, Math.PI * 2),
    life:     0,
    maxLife:  rand(16, 30),
  };
}

export function init(w, h, density = 1) {
  const nauts = [];
  const initCount = Math.round(6 * density);
  for (let i = 0; i < initCount; i++) nauts.push(makeAstronaut(w, h, true));
  return { nauts, w, h, timer: 0 };
}

export function update(state, dt, elapsed, density = 1) {
  const { nauts, w, h } = state;
  state.timer += dt;
  if (state.timer > 2.4 && nauts.length < Math.round(9 * density)) {
    nauts.push(makeAstronaut(w, h, false));
    state.timer = 0;
  }
  for (let i = nauts.length - 1; i >= 0; i--) {
    const n = nauts[i];
    n.life += dt;
    n.rot  += n.rotRate * dt;
    n.limb += n.limbRate * dt;
    n.glint += dt;
    n.x += n.vx * dt;
    n.y += n.vy * dt;
    n.puffTimer -= dt;

    // ── RCS burn: a deliberate, sustained thruster firing ──
    // The jet streams one way; the astronaut clearly accelerates the
    // opposite way for the whole burn (action/reaction you can see).
    if (n.puffTimer <= 0 && n.burstT <= 0 && n.life <= n.maxLife) {
      n.puffTimer = rand(4, 9);
      n.burstT = rand(0.6, 1.1);
      // thrust biased back toward the canvas centre, so burns also
      // visibly turn them around before they wander off
      const bias = Math.atan2(h / 2 - n.y, w / 2 - n.x);
      n.burstAng = bias + rand(-0.7, 0.7);
    }
    if (n.burstT > 0 && n.life <= n.maxLife) {
      n.burstT -= dt;
      const ax = Math.cos(n.burstAng), ay = Math.sin(n.burstAng);
      // strong, continuous acceleration along the thrust direction
      n.vx += ax * 60 * dt;
      n.vy += ay * 60 * dt;
      const sp = Math.hypot(n.vx, n.vy);
      if (sp > 42) { n.vx *= 42 / sp; n.vy *= 42 / sp; }
      // tight collimated exhaust jet from the nozzle, streaming the
      // exact opposite way — emitted continuously during the burn
      n.jetTimer -= dt;
      while (n.jetTimer <= 0) {
        n.jetTimer += 0.018;
        const nozX = n.x - ax * n.sz * 0.85;
        const nozY = n.y - ay * n.sz * 0.85;
        const jSpd = rand(90, 140);
        const spread = rand(-0.10, 0.10);        // narrow cone
        const jAng = n.burstAng + Math.PI + spread;
        n.puffs.push({
          x: nozX, y: nozY,
          vx: Math.cos(jAng) * jSpd + n.vx * 0.3,
          vy: Math.sin(jAng) * jSpd + n.vy * 0.3,
          r: rand(1.0, 2.0),
          hot: true,                              // fresh exhaust glows
          life: 0,
          maxLife: rand(0.35, 0.65),
        });
      }
      // burn steadies the tumble
      n.rotRate *= 1 - 1.5 * dt;
    }
    for (let pi = n.puffs.length - 1; pi >= 0; pi--) {
      const p = n.puffs[pi];
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.r += dt * 6;
      if (p.life > p.maxLife) n.puffs.splice(pi, 1);
    }

    const m = n.sz * 5;
    const off = n.x < -m || n.x > w + m || n.y < -m || n.y > h + m;
    if ((off || n.life > n.maxLife) && n.puffs.length === 0) nauts.splice(i, 1);
  }
}

// limb: dark outline capsule with white fill
function limb(ctx, x0, y0, x1, y1, w, a) {
  ctx.lineCap = 'round';
  ctx.strokeStyle = `rgba(70,75,95,${a})`;
  ctx.lineWidth = w * 1.30;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.strokeStyle = `rgba(238,240,248,${a})`;
  ctx.lineWidth = w;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
}

function drawAstronaut(ctx, n) {
  const { sz, trim, rot, limb: lp, glint, life, maxLife, puffs } = n;
  const fadeIn  = Math.min(life / 1.0, 1);
  const fadeOut = Math.min((maxLife - life) / 2.0, 1);
  const a = Math.max(0, fadeIn * fadeOut);

  // exhaust jet in world space — hot white-blue core fresh out of the
  // nozzle, expanding to a faint vapour cone
  puffs.forEach(p => {
    const u = p.life / p.maxLife;
    const pa = (1 - u) * 0.65 * Math.max(a, 0.4);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = u < 0.25
      ? `rgba(255,255,255,${pa})`          // hot core
      : `rgba(200,214,255,${pa * 0.8})`;   // cooling vapour
    ctx.fill();
  });
  if (a <= 0) return;
  ctx.globalAlpha = a;

  ctx.save();
  ctx.translate(n.x, n.y);
  ctx.rotate(rot);

  const s = sz;
  const drift1 = Math.sin(lp) * 0.18;
  const drift2 = Math.sin(lp * 1.3 + 1.2) * 0.18;

  // ── backpack (PLSS) behind the torso ──
  ctx.beginPath();
  ctx.roundRect(-s * 0.46, -s * 0.34, s * 0.92, s * 0.62, s * 0.10);
  ctx.fillStyle = '#aeb4c4';
  ctx.fill();
  ctx.strokeStyle = '#6a7088';
  ctx.lineWidth = Math.max(0.8, s * 0.03);
  ctx.stroke();

  // ── legs (drift lazily) ──
  const hipY = s * 0.34;
  limb(ctx, -s * 0.14, hipY, -s * 0.22 - drift1 * s * 0.3, hipY + s * 0.34, s * 0.15, a);
  limb(ctx, -s * 0.22 - drift1 * s * 0.3, hipY + s * 0.34,
            -s * 0.20 - drift1 * s * 0.5, hipY + s * 0.62, s * 0.13, a);
  limb(ctx,  s * 0.14, hipY,  s * 0.24 + drift2 * s * 0.3, hipY + s * 0.32, s * 0.15, a);
  limb(ctx,  s * 0.24 + drift2 * s * 0.3, hipY + s * 0.32,
             s * 0.30 + drift2 * s * 0.5, hipY + s * 0.60, s * 0.13, a);
  // boots
  [[-s * 0.20 - drift1 * s * 0.5, hipY + s * 0.66], [s * 0.30 + drift2 * s * 0.5, hipY + s * 0.64]].forEach(([bx, by]) => {
    ctx.beginPath();
    ctx.ellipse(bx, by, s * 0.10, s * 0.075, 0, 0, Math.PI * 2);
    ctx.fillStyle = trim;
    ctx.fill();
  });

  // ── arms ──
  const shY = -s * 0.06;
  limb(ctx, -s * 0.26, shY, -s * 0.44 + drift2 * s * 0.2, shY + s * 0.22, s * 0.13, a);
  limb(ctx, -s * 0.44 + drift2 * s * 0.2, shY + s * 0.22,
            -s * 0.52 + drift2 * s * 0.4, shY + s * 0.06, s * 0.115, a);
  limb(ctx,  s * 0.26, shY,  s * 0.46 - drift1 * s * 0.2, shY + s * 0.18, s * 0.13, a);
  limb(ctx,  s * 0.46 - drift1 * s * 0.2, shY + s * 0.18,
             s * 0.56 - drift1 * s * 0.4, shY + s * 0.38, s * 0.115, a);
  // gloves
  [[-s * 0.52 + drift2 * s * 0.4, shY + s * 0.06], [s * 0.56 - drift1 * s * 0.4, shY + s * 0.38]].forEach(([gx, gy]) => {
    ctx.beginPath();
    ctx.arc(gx, gy, s * 0.085, 0, Math.PI * 2);
    ctx.fillStyle = trim;
    ctx.fill();
  });

  // ── torso ──
  ctx.beginPath();
  ctx.roundRect(-s * 0.30, -s * 0.26, s * 0.60, s * 0.62, s * 0.16);
  const tg = ctx.createLinearGradient(-s * 0.3, 0, s * 0.3, 0);
  tg.addColorStop(0, '#c8ccd8');
  tg.addColorStop(0.4, '#f2f4fa');
  tg.addColorStop(1, '#b8bcc8');
  ctx.fillStyle = tg;
  ctx.fill();
  ctx.strokeStyle = '#6a7088';
  ctx.lineWidth = Math.max(0.8, s * 0.030);
  ctx.stroke();

  // chest control panel
  ctx.beginPath();
  ctx.roundRect(-s * 0.16, -s * 0.10, s * 0.32, s * 0.20, s * 0.04);
  ctx.fillStyle = '#3a4254';
  ctx.fill();
  [['#ff5050', -0.09], ['#50ff80', 0.0], ['#50a0ff', 0.09]].forEach(([c, ox]) => {
    ctx.beginPath();
    ctx.arc(s * ox, -s * 0.015, s * 0.026, 0, Math.PI * 2);
    ctx.fillStyle = c;
    ctx.fill();
  });
  // trim stripe
  ctx.beginPath();
  ctx.roundRect(-s * 0.30, s * 0.20, s * 0.60, s * 0.075, s * 0.03);
  ctx.fillStyle = trim;
  ctx.fill();

  // ── helmet ──
  const hy = -s * 0.52;
  ctx.beginPath();
  ctx.arc(0, hy, s * 0.34, 0, Math.PI * 2);
  const hg = ctx.createRadialGradient(-s * 0.12, hy - s * 0.12, 0, 0, hy, s * 0.36);
  hg.addColorStop(0, '#ffffff');
  hg.addColorStop(0.7, '#dde0ea');
  hg.addColorStop(1, '#a8aebe');
  ctx.fillStyle = hg;
  ctx.fill();
  ctx.strokeStyle = '#6a7088';
  ctx.lineWidth = Math.max(0.8, s * 0.030);
  ctx.stroke();

  // gold mirrored visor
  ctx.beginPath();
  ctx.ellipse(s * 0.035, hy, s * 0.245, s * 0.22, 0, 0, Math.PI * 2);
  const vg = ctx.createLinearGradient(-s * 0.2, hy - s * 0.2, s * 0.25, hy + s * 0.2);
  vg.addColorStop(0, '#ffe9a0');
  vg.addColorStop(0.45, '#e8a428');
  vg.addColorStop(1, '#8a5408');
  ctx.fillStyle = vg;
  ctx.fill();
  ctx.strokeStyle = '#7a6a48';
  ctx.lineWidth = Math.max(0.6, s * 0.022);
  ctx.stroke();
  // star glint sweeping across as the astronaut rotates
  const gx = Math.sin(glint * 0.7 + rot) * s * 0.14;
  ctx.beginPath();
  ctx.ellipse(s * 0.035 + gx, hy - s * 0.07, s * 0.05, s * 0.10, -0.5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(s * 0.035 + gx * 0.6, hy + s * 0.06, s * 0.022, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fill();

  ctx.restore();
}

export default { name, init, update, draw };

export function draw(ctx, state) {
  ctx.save();
  // depth order: small (far) astronauts draw first, large (near) on top
  [...state.nauts].sort((a, b) => a.sz - b.sz)
    .forEach(n => drawAstronaut(ctx, n));
  ctx.globalAlpha = 1;
  ctx.restore();
}
