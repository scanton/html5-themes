// Bubbles — iridescent soap bubbles that rise from the bottom.
//
// Each bubble has a thin iridescent ring (thin-film interference colors),
// a bright specular highlight at top-left, and a soft inner reflection arc
// at the bottom.  Sizes range from 22 to 64 px radius.

export const name = 'Bubbles';

function rand(min, max) { return min + Math.random() * (max - min); }

function makeBubble(w, h, spreadY) {
  const r      = rand(22, 64);
  const vy     = -(rand(38, 72));
  const startY = spreadY ? rand(-r, h + r) : h + r + rand(0, 80);
  return {
    x:          rand(r, w - r),
    y:          startY,
    r,
    vx:         rand(-18, 18),
    vy,
    wobble:     rand(0, Math.PI * 2),
    wobbleRate: rand(0.6, 1.8),
    hue:        rand(0, 360),
    hueSpread:  rand(60, 150),
    alpha:      rand(0.55, 0.82),
    life:       0,
    maxLife:    (startY + r) / Math.abs(vy) * rand(1.05, 1.15),
  };
}

export function init(w, h, density = 1) {
  const bubbles = [];
  const initCount = Math.round(16 * density);
  for (let i = 0; i < initCount; i++) bubbles.push(makeBubble(w, h, true));
  return { bubbles, w, h, timer: 0 };
}

export function update(state, dt, elapsed, density = 1) {
  const { bubbles, w, h } = state;

  // Spawn new bubbles
  state.timer += dt;
  if (state.timer > 0.9 && bubbles.length < Math.round(22 * density)) {
    bubbles.push(makeBubble(w, h, false));
    state.timer = 0;
  }

  for (let i = bubbles.length - 1; i >= 0; i--) {
    const b = bubbles[i];
    b.life    += dt;
    b.wobble  += b.wobbleRate * dt;
    b.x       += (b.vx + Math.sin(b.wobble) * 22) * dt;
    b.y       += b.vy * dt;
    if (b.y + b.r < -10 || b.life > b.maxLife) {
      bubbles.splice(i, 1);
    }
  }
}

export default { name, init, update, draw };

export function draw(ctx, state) {
  ctx.save();
  state.bubbles.forEach(b => {
    const fadeIn  = Math.min(b.life / 0.6, 1);
    const fadeOut = Math.min((b.maxLife - b.life) / 1.2, 1);
    const alpha   = b.alpha * fadeIn * fadeOut;
    if (alpha < 0.01) return;

    const { x, y, r, hue, hueSpread } = b;

    // ── Outer iridescent ring ──────────────────────────────────
    const ring = ctx.createRadialGradient(x, y, r * 0.62, x, y, r);
    ring.addColorStop(0,    `hsla(${hue},                   0%, 100%, 0)`);
    ring.addColorStop(0.55, `hsla(${hue},                  90%, 82%, ${alpha * 0.18})`);
    ring.addColorStop(0.72, `hsla(${(hue + hueSpread * 0.4) % 360}, 95%, 88%, ${alpha * 0.55})`);
    ring.addColorStop(0.88, `hsla(${(hue + hueSpread * 0.7) % 360}, 90%, 78%, ${alpha * 0.70})`);
    ring.addColorStop(1,    `hsla(${(hue + hueSpread)       % 360}, 80%, 85%, ${alpha * 0.30})`);

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = ring;
    ctx.fill();

    // ── Very faint interior tint ───────────────────────────────
    const interior = ctx.createRadialGradient(x, y - r * 0.1, 0, x, y, r * 0.95);
    interior.addColorStop(0,   `hsla(${(hue + 180) % 360}, 60%, 95%, ${alpha * 0.06})`);
    interior.addColorStop(0.6, `hsla(${hue},                60%, 85%, ${alpha * 0.04})`);
    interior.addColorStop(1,   `rgba(0,0,0,0)`);
    ctx.beginPath();
    ctx.arc(x, y, r * 0.95, 0, Math.PI * 2);
    ctx.fillStyle = interior;
    ctx.fill();

    // ── Bottom-inside reflection arc ──────────────────────────
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r * 0.88, 0, Math.PI * 2);
    ctx.clip();
    const reflect = ctx.createRadialGradient(x, y + r * 0.65, 0, x, y + r * 0.65, r * 0.5);
    reflect.addColorStop(0,   `hsla(${(hue + 90) % 360}, 80%, 88%, ${alpha * 0.28})`);
    reflect.addColorStop(1,   `rgba(0,0,0,0)`);
    ctx.beginPath();
    ctx.arc(x, y + r * 0.65, r * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = reflect;
    ctx.fill();
    ctx.restore();

    // ── Specular highlight — top-left ──────────────────────────
    const spec = ctx.createRadialGradient(
      x - r * 0.28, y - r * 0.30, 0,
      x - r * 0.28, y - r * 0.30, r * 0.48
    );
    spec.addColorStop(0,    `rgba(255,255,255,${alpha * 0.92})`);
    spec.addColorStop(0.35, `rgba(255,255,255,${alpha * 0.40})`);
    spec.addColorStop(1,    `rgba(255,255,255,0)`);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = spec;
    ctx.fill();

    // ── Small secondary specular dot ──────────────────────────
    const spec2 = ctx.createRadialGradient(
      x + r * 0.30, y - r * 0.20, 0,
      x + r * 0.30, y - r * 0.20, r * 0.16
    );
    spec2.addColorStop(0,  `rgba(255,255,255,${alpha * 0.55})`);
    spec2.addColorStop(1,  `rgba(255,255,255,0)`);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = spec2;
    ctx.fill();
  });
  ctx.restore();
}
