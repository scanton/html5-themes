// Hearts — red hearts that rise from the bottom with a gentle sway.
//
// Each heart has a radial gradient fill (light pink core → deep red edge),
// a diagonal shine overlay, and a soft glow bloom beneath it.
// They rise slowly, sway side-to-side, and rotate very slightly.

export const name = 'Hearts';

function rand(min, max) { return min + Math.random() * (max - min); }

// Draw a heart centred at (0,0) with "radius" r (half the total width).
function heartPath(ctx, r) {
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.25);
  ctx.bezierCurveTo( r * 0.48, -r,       r, -r * 0.52,   r,  0);
  ctx.bezierCurveTo( r,  r * 0.58,       0,  r,           0,  r * 1.28);
  ctx.bezierCurveTo( 0,  r,             -r,  r * 0.58,   -r,  0);
  ctx.bezierCurveTo(-r, -r * 0.52, -r * 0.48, -r,         0, -r * 0.25);
  ctx.closePath();
}

function makeHeart(w, h, spreadY) {
  const r      = rand(14, 38);
  const vy     = -(rand(32, 58));
  const startY = spreadY ? rand(-r, h + r) : h + r + rand(0, 60);
  return {
    x:          rand(r, w - r),
    y:          startY,
    r,
    vx:         rand(-14, 14),
    vy,
    wobble:     rand(0, Math.PI * 2),
    wobbleRate: rand(0.8, 2.2),
    tilt:       rand(-0.22, 0.22),
    hue:        rand(340, 360),
    sat:        rand(88, 100),
    life:       0,
    maxLife:    (startY + r) / Math.abs(vy) * rand(1.05, 1.15),
  };
}

export function init(w, h, density = 1) {
  const hearts = [];
  const initCount = Math.round(14 * density);
  for (let i = 0; i < initCount; i++) hearts.push(makeHeart(w, h, true));
  return { hearts, w, h, timer: 0 };
}

export function update(state, dt, elapsed, density = 1) {
  const { hearts, w, h } = state;
  state.timer += dt;
  if (state.timer > 0.7 && hearts.length < Math.round(20 * density)) {
    hearts.push(makeHeart(w, h, false));
    state.timer = 0;
  }
  for (let i = hearts.length - 1; i >= 0; i--) {
    const h_ = hearts[i];
    h_.life   += dt;
    h_.wobble += h_.wobbleRate * dt;
    h_.x      += (h_.vx + Math.sin(h_.wobble) * 18) * dt;
    h_.y      += h_.vy * dt;
    if (h_.y + h_.r * 1.5 < -10 || h_.life > h_.maxLife) hearts.splice(i, 1);
  }
}

export default { name, init, update, draw };

export function draw(ctx, state) {
  ctx.save();
  state.hearts.forEach(h => {
    const fadeIn  = Math.min(h.life / 0.5, 1);
    const fadeOut = Math.min((h.maxLife - h.life) / 1.0, 1);
    const alpha   = fadeIn * fadeOut;
    if (alpha < 0.01) return;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(h.x, h.y);
    ctx.rotate(h.tilt + Math.sin(h.wobble * 0.5) * 0.10);

    // ── Glow bloom underneath ──────────────────────────────────
    const glow = ctx.createRadialGradient(0, h.r * 0.3, 0, 0, h.r * 0.3, h.r * 1.9);
    glow.addColorStop(0,   `hsla(${h.hue}, ${h.sat}%, 55%, 0.30)`);
    glow.addColorStop(0.5, `hsla(${h.hue}, ${h.sat}%, 45%, 0.12)`);
    glow.addColorStop(1,   `hsla(${h.hue}, ${h.sat}%, 40%, 0)`);
    ctx.beginPath();
    ctx.arc(0, h.r * 0.3, h.r * 1.9, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    // ── Heart fill — radial gradient from bright centre to deep edge ─
    const fill = ctx.createRadialGradient(-h.r * 0.2, -h.r * 0.1, 0, h.r * 0.1, h.r * 0.5, h.r * 1.35);
    fill.addColorStop(0,   `hsl(${h.hue - 15}, ${h.sat}%, 80%)`);
    fill.addColorStop(0.30, `hsl(${h.hue},      ${h.sat}%, 60%)`);
    fill.addColorStop(0.65, `hsl(${h.hue + 5},  ${h.sat}%, 44%)`);
    fill.addColorStop(1,   `hsl(${h.hue + 10}, ${h.sat - 8}%, 28%)`);

    heartPath(ctx, h.r);
    ctx.fillStyle = fill;
    ctx.fill();

    // ── Shine — diagonal highlight across upper-left ───────────
    const shine = ctx.createLinearGradient(-h.r * 0.6, -h.r * 0.7, h.r * 0.3, h.r * 0.2);
    shine.addColorStop(0,   'rgba(255,255,255,0.55)');
    shine.addColorStop(0.4, 'rgba(255,255,255,0.18)');
    shine.addColorStop(1,   'rgba(255,255,255,0)');
    heartPath(ctx, h.r);
    ctx.fillStyle = shine;
    ctx.fill();

    // ── Thin stroke for crispness ──────────────────────────────
    heartPath(ctx, h.r);
    ctx.strokeStyle = `hsla(${h.hue + 8}, ${h.sat}%, 22%, 0.50)`;
    ctx.lineWidth   = Math.max(0.8, h.r * 0.04);
    ctx.stroke();

    ctx.restore();
  });
  ctx.restore();
}
