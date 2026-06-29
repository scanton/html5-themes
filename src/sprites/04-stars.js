// Stars & Sparkles — golden starburst sparkles and 6-point stars falling
// from above, with a soft glow bloom and a twinkle pulse as they fall.
//
// Two types:
//   'sparkle' — 4-point elongated starburst (lens-flare style), bright white/gold
//   'star'    — 6-point star with shorter inner points, warm gold/silver

export const name = 'Stars & Sparkles';

function rand(min, max) { return min + Math.random() * (max - min); }

const PALETTES = [
  { h: 48,  s: 100, l: 75, name: 'gold'   },
  { h: 55,  s: 100, l: 82, name: 'yellow' },
  { h: 35,  s: 100, l: 72, name: 'amber'  },
  { h: 200, s:  70, l: 88, name: 'ice'    },
  { h: 0,   s:   0, l: 96, name: 'white'  },
];

function makeStar(w, h, spreadY) {
  const r      = rand(8, 30);
  const pal    = PALETTES[Math.floor(rand(0, PALETTES.length))];
  const type   = Math.random() < 0.55 ? 'sparkle' : 'star';
  const vy     = rand(22, 52) * (0.4 + r / 60);
  const startY = spreadY ? rand(-r, h + r) : -(r + rand(0, 80));
  return {
    x:          rand(r, w - r),
    y:          startY,
    r,
    type,
    vx:         rand(-16, 16),
    vy,
    rot:        rand(0, Math.PI * 2),
    rotRate:    rand(-1.2, 1.2) * (0.5 / Math.max(r, 8)),
    drift:      rand(0, Math.PI * 2),
    driftRate:  rand(0.4, 1.1),
    twinkle:    rand(0, Math.PI * 2),
    twinkleRate:rand(3, 8),
    hue:        pal.h,
    sat:        pal.s,
    lit:        pal.l,
    alpha:      rand(0.75, 1.0),
    life:       0,
    maxLife:    (h + r - startY) / vy * rand(1.05, 1.15),
  };
}

export function init(w, h, density = 1) {
  const stars = [];
  const initCount = Math.round(22 * density);
  for (let i = 0; i < initCount; i++) stars.push(makeStar(w, h, true));
  return { stars, w, h, timer: 0 };
}

export function update(state, dt, elapsed, density = 1) {
  const { stars, w, h } = state;
  state.timer += dt;
  if (state.timer > 0.6 && stars.length < Math.round(32 * density)) {
    stars.push(makeStar(w, h, false));
    state.timer = 0;
  }
  for (let i = stars.length - 1; i >= 0; i--) {
    const s = stars[i];
    s.life       += dt;
    s.drift      += s.driftRate  * dt;
    s.rot        += s.rotRate    * dt;
    s.twinkle    += s.twinkleRate * dt;
    s.x          += (s.vx + Math.sin(s.drift) * 14) * dt;
    s.y          += s.vy * dt;
    if (s.y - s.r > h + 10 || s.life > s.maxLife) stars.splice(i, 1);
  }
}

// 4-point lens-flare starburst
function drawSparkle(ctx, r, hue, sat, lit, alpha) {
  // Soft glow bloom
  const bloom = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 2.8);
  bloom.addColorStop(0,   `hsla(${hue},${sat}%,${lit}%,${alpha * 0.45})`);
  bloom.addColorStop(0.4, `hsla(${hue},${sat}%,${lit}%,${alpha * 0.18})`);
  bloom.addColorStop(1,   `hsla(${hue},${sat}%,${lit}%,0)`);
  ctx.beginPath();
  ctx.arc(0, 0, r * 2.8, 0, Math.PI * 2);
  ctx.fillStyle = bloom;
  ctx.fill();

  // 4-point starburst body — diamond cross with elongated spikes
  // Points at 0°/90° are long (r), at 45° are short (r*0.18)
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle  = (i * Math.PI) / 4;
    const radius = i % 2 === 0 ? r : r * 0.18;
    const px = Math.cos(angle) * radius;
    const py = Math.sin(angle) * radius;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();

  const starFill = ctx.createRadialGradient(0, -r * 0.2, 0, 0, 0, r);
  starFill.addColorStop(0,   `hsl(${hue},${sat}%,${Math.min(lit + 12, 100)}%)`);
  starFill.addColorStop(0.6, `hsl(${hue},${sat}%,${lit}%)`);
  starFill.addColorStop(1,   `hsl(${hue},${sat - 10}%,${lit - 15}%)`);
  ctx.fillStyle = starFill;
  ctx.fill();

  // Elongated horizontal + vertical spikes (thin lines extending beyond body)
  ctx.strokeStyle = `hsla(${hue},${sat}%,${Math.min(lit + 10, 100)}%,${alpha * 0.55})`;
  ctx.lineWidth   = Math.max(0.6, r * 0.07);
  ctx.lineCap     = 'round';
  ctx.beginPath();
  ctx.moveTo(-r * 1.7, 0);
  ctx.lineTo( r * 1.7, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -r * 1.7);
  ctx.lineTo(0,  r * 1.7);
  ctx.stroke();
}

// 6-point star
function drawStar6(ctx, r, hue, sat, lit, alpha) {
  // Soft glow bloom
  const bloom = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 2.4);
  bloom.addColorStop(0,   `hsla(${hue},${sat}%,${lit}%,${alpha * 0.38})`);
  bloom.addColorStop(1,   `hsla(${hue},${sat}%,${lit}%,0)`);
  ctx.beginPath();
  ctx.arc(0, 0, r * 2.4, 0, Math.PI * 2);
  ctx.fillStyle = bloom;
  ctx.fill();

  // 6-point star body — outer points at r, inner at r*0.45
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    const angle  = (i * Math.PI) / 6 - Math.PI / 2;
    const radius = i % 2 === 0 ? r : r * 0.45;
    const px = Math.cos(angle) * radius;
    const py = Math.sin(angle) * radius;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();

  const starFill = ctx.createRadialGradient(0, -r * 0.15, 0, 0, 0, r);
  starFill.addColorStop(0,   `hsl(${hue},${sat}%,${Math.min(lit + 10, 100)}%)`);
  starFill.addColorStop(0.55, `hsl(${hue},${sat}%,${lit}%)`);
  starFill.addColorStop(1,   `hsl(${hue},${sat - 8}%,${lit - 12}%)`);
  ctx.fillStyle = starFill;
  ctx.fill();

  // Thin stroke
  ctx.strokeStyle = `hsla(${hue},${sat}%,${lit - 10}%,0.25)`;
  ctx.lineWidth   = Math.max(0.5, r * 0.04);
  ctx.stroke();
}

export default { name, init, update, draw };

export function draw(ctx, state) {
  ctx.save();
  state.stars.forEach(s => {
    const fadeIn  = Math.min(s.life / 0.6, 1);
    const fadeOut = Math.min((s.maxLife - s.life) / 1.2, 1);
    // Twinkle: brightness pulses ~3-8 Hz
    const twink   = 0.65 + 0.35 * (0.5 + 0.5 * Math.sin(s.twinkle));
    ctx.globalAlpha = s.alpha * fadeIn * fadeOut * twink;

    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rot);

    if (s.type === 'sparkle') {
      drawSparkle(ctx, s.r, s.hue, s.sat, s.lit, 1);
    } else {
      drawStar6(ctx, s.r, s.hue, s.sat, s.lit, 1);
    }

    ctx.restore();
  });
  ctx.globalAlpha = 1;
  ctx.restore();
}
