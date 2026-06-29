// Snowflakes — crystalline flakes falling from above.
//
// Each flake is drawn programmatically with 6-fold symmetry:
// a main arm, tip fork, three pairs of side branches, and sub-branches
// on the innermost two pairs.  Larger flakes get slightly thicker lines.
// Three depth layers give a parallax sense of near/mid/far.

export const name = 'Snowflakes';

function rand(min, max) { return min + Math.random() * (max - min); }

function makeFlake(w, h, spreadY) {
  const r      = rand(10, 44);
  const vy     = rand(28, 60) * (0.5 + r / 88);
  const startY = spreadY ? rand(-h * 0.1, h + r) : -(r + rand(0, 60));
  return {
    x:        rand(r, w - r),
    y:        startY,
    r,
    vx:       rand(-20, 20),
    vy,
    rot:      rand(0, Math.PI * 2),
    rotRate:  rand(-0.5, 0.5) * (0.4 / Math.max(r, 10)),
    drift:    rand(0, Math.PI * 2),
    driftRate:rand(0.3, 0.9),
    brightness: rand(0.70, 1.0),
    alpha:    rand(0.70, 0.95),
    life:     0,
    maxLife:  (h + r - startY) / vy * rand(1.05, 1.15),
  };
}

export function init(w, h, density = 1) {
  const flakes = [];
  const initCount = Math.round(28 * density);
  for (let i = 0; i < initCount; i++) flakes.push(makeFlake(w, h, true));
  return { flakes, w, h, timer: 0 };
}

export function update(state, dt, elapsed, density = 1) {
  const { flakes, w, h } = state;
  state.timer += dt;
  if (state.timer > 0.5 && flakes.length < Math.round(40 * density)) {
    flakes.push(makeFlake(w, h, false));
    state.timer = 0;
  }
  for (let i = flakes.length - 1; i >= 0; i--) {
    const f = flakes[i];
    f.life  += dt;
    f.drift += f.driftRate * dt;
    f.rot   += f.rotRate * dt;
    f.x     += (f.vx + Math.sin(f.drift) * 18) * dt;
    f.y     += f.vy * dt;
    if (f.y - f.r > h + 10 || f.life > f.maxLife) flakes.splice(i, 1);
  }
}

// Draw one arm of the snowflake (pointing along +y).  Called 6 times rotated.
function drawArm(ctx, r) {
  // Main spine
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, r);
  ctx.stroke();

  // Tip fork
  const forkLen = r * 0.16;
  ctx.beginPath();
  ctx.moveTo(0, r);
  ctx.lineTo(-forkLen, r - forkLen * 1.1);
  ctx.moveTo(0, r);
  ctx.lineTo( forkLen, r - forkLen * 1.1);
  ctx.stroke();

  // Three pairs of side branches: at r*0.28, r*0.52, r*0.74
  const branchDefs = [
    { pos: 0.28, len: 0.24, subBranch: true  },
    { pos: 0.52, len: 0.20, subBranch: true  },
    { pos: 0.74, len: 0.15, subBranch: false },
  ];

  branchDefs.forEach(({ pos, len, subBranch }) => {
    const y  = r * pos;
    const bl = r * len;

    // Main branch pair (horizontal)
    ctx.beginPath();
    ctx.moveTo(-bl, y);
    ctx.lineTo( bl, y);
    ctx.stroke();

    if (subBranch) {
      const sl = bl * 0.46;
      // Left sub-branch (angled up-inward at ~60°)
      ctx.beginPath();
      ctx.moveTo(-bl, y);
      ctx.lineTo(-bl + sl * 0.75, y - sl);
      ctx.stroke();
      // Right sub-branch
      ctx.beginPath();
      ctx.moveTo( bl, y);
      ctx.lineTo( bl - sl * 0.75, y - sl);
      ctx.stroke();
    }
  });
}

function drawSnowflake(ctx, f) {
  const { x, y, r, rot, brightness, alpha } = f;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);

  // Line style
  const lw = Math.max(0.8, r * 0.045);
  ctx.lineWidth   = lw;
  ctx.lineCap     = 'round';
  ctx.strokeStyle = `rgba(${Math.round(195 + 60 * brightness)}, ${Math.round(215 + 40 * brightness)}, 255, ${alpha})`;

  for (let arm = 0; arm < 6; arm++) {
    ctx.save();
    ctx.rotate((arm * Math.PI) / 3);
    drawArm(ctx, r);
    ctx.restore();
  }

  // Centre crystal hexagon
  ctx.beginPath();
  const cr = r * 0.09;
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 - Math.PI / 6;
    const px = Math.cos(a) * cr, py = Math.sin(a) * cr;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle   = `rgba(225, 240, 255, ${alpha})`;
  ctx.fill();

  // Soft centre glow
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.5);
  glow.addColorStop(0,   `rgba(200, 225, 255, ${alpha * 0.30})`);
  glow.addColorStop(1,   `rgba(180, 210, 255, 0)`);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
  ctx.fillStyle = glow;
  ctx.fill();

  ctx.restore();
}

export default { name, init, update, draw };

export function draw(ctx, state) {
  ctx.save();
  state.flakes.forEach(f => {
    const fadeIn  = Math.min(f.life / 0.8, 1);
    const fadeOut = Math.min((f.maxLife - f.life) / 1.5, 1);
    ctx.globalAlpha = fadeIn * fadeOut;
    drawSnowflake(ctx, f);
  });
  ctx.restore();
}
