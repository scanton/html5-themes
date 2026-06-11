// Spell Runes — glowing arcane symbols that drift upward, rotate, and
// slowly dissolve into sparkling motes.
//
// Six rune types: circle-glyph, triangle-glyph, hexagon-glyph, eye-glyph,
// spiral-glyph, cross-glyph.  Each has an outer ring, inner geometric
// detail, and a pulsing glow.  Colour palette: violet, cyan, gold, emerald.

export const name = 'Spell Runes';

function rand(min, max) { return min + Math.random() * (max - min); }

const PALETTES = [
  { glow: '#9B30FF', line: '#CC80FF', core: '#E8CCFF' },   // violet
  { glow: '#00CCFF', line: '#66EEFF', core: '#CCFCFF' },   // cyan
  { glow: '#FFD700', line: '#FFE866', core: '#FFFACC' },   // gold
  { glow: '#00E87A', line: '#66FFB3', core: '#CCFFE8' },   // emerald
  { glow: '#FF4488', line: '#FF88BB', core: '#FFCCDD' },   // rose
];

const TYPES = ['circle', 'triangle', 'hexagon', 'eye', 'spiral', 'cross'];

function makeRune(w, h, spreadY) {
  const pal  = PALETTES[Math.floor(rand(0, PALETTES.length))];
  const type = TYPES[Math.floor(rand(0, TYPES.length))];
  const r    = rand(18, 42);
  return {
    x:         rand(r * 1.5, w - r * 1.5),
    y:         spreadY ? rand(h * 0.1, h * 0.9) : h + r + rand(0, 60),
    r,
    type,
    pal,
    vx:        rand(-12, 12),
    vy:        -(rand(18, 42)),
    rot:       rand(0, Math.PI * 2),
    rotRate:   rand(-0.8, 0.8),
    pulse:     rand(0, Math.PI * 2),
    pulseRate: rand(1.5, 3.5),
    alpha:     rand(0.70, 0.95),
    life:      0,
    maxLife:   rand(5, 12),
  };
}

export function init(w, h, density = 1) {
  const runes = [];
  const initCount = Math.round(12 * density);
  for (let i = 0; i < initCount; i++) runes.push(makeRune(w, h, true));
  return { runes, w, h, timer: 0 };
}

export function update(state, dt, elapsed, density = 1) {
  const { runes, w, h } = state;
  state.timer += dt;
  if (state.timer > 0.9 && runes.length < Math.round(18 * density)) {
    runes.push(makeRune(w, h, false));
    state.timer = 0;
  }
  for (let i = runes.length - 1; i >= 0; i--) {
    const r = runes[i];
    r.life   += dt;
    r.rot    += r.rotRate  * dt;
    r.pulse  += r.pulseRate * dt;
    r.x      += r.vx * dt;
    r.y      += r.vy * dt;
    if (r.y + r.r < -10 || r.life > r.maxLife) runes.splice(i, 1);
  }
}

function parseHex(hex) {
  return [
    parseInt(hex.slice(1,3),16),
    parseInt(hex.slice(3,5),16),
    parseInt(hex.slice(5,7),16),
  ];
}

function glowStyle(hexColor, a) {
  const [r,g,b] = parseHex(hexColor);
  return `rgba(${r},${g},${b},${a})`;
}

function drawRuneGlyph(ctx, type, r, lineCol) {
  ctx.strokeStyle = lineCol;
  ctx.lineWidth   = Math.max(1.2, r * 0.06);
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';

  if (type === 'circle') {
    // Outer ring + inner divided circle
    ctx.beginPath(); ctx.arc(0, 0, r * 0.75, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2); ctx.stroke();
    // 3 radial lines
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI * 2) / 3;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.35, Math.sin(a) * r * 0.35);
      ctx.lineTo(Math.cos(a) * r * 0.75, Math.sin(a) * r * 0.75);
      ctx.stroke();
    }

  } else if (type === 'triangle') {
    // Outer triangle + inner inverted triangle
    for (let flip = 0; flip < 2; flip++) {
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const a = (i * Math.PI * 2) / 3 + (flip ? Math.PI : 0);
        const v = { x: Math.cos(a) * r * 0.80, y: Math.sin(a) * r * 0.80 };
        i === 0 ? ctx.moveTo(v.x, v.y) : ctx.lineTo(v.x, v.y);
      }
      ctx.closePath();
      ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(0, 0, r * 0.16, 0, Math.PI * 2); ctx.stroke();

  } else if (type === 'hexagon') {
    // Hexagon + centre dot + spoke lines
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const v = { x: Math.cos(a) * r * 0.78, y: Math.sin(a) * r * 0.78 };
      i === 0 ? ctx.moveTo(v.x, v.y) : ctx.lineTo(v.x, v.y);
    }
    ctx.closePath(); ctx.stroke();
    for (let i = 0; i < 6; i += 2) {
      const a = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * r * 0.78, Math.sin(a) * r * 0.78);
      ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(0, 0, r * 0.18, 0, Math.PI * 2); ctx.stroke();

  } else if (type === 'eye') {
    // Almond eye shape + vertical slit pupil + outer ring
    ctx.beginPath(); ctx.arc(0, 0, r * 0.80, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-r * 0.60, 0);
    ctx.bezierCurveTo(-r * 0.30, -r * 0.40, r * 0.30, -r * 0.40, r * 0.60, 0);
    ctx.bezierCurveTo( r * 0.30,  r * 0.40, -r * 0.30,  r * 0.40, -r * 0.60, 0);
    ctx.closePath(); ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.14, r * 0.30, 0, 0, Math.PI * 2);
    ctx.stroke();

  } else if (type === 'spiral') {
    // Outer ring + 2-arm spiral approximation
    ctx.beginPath(); ctx.arc(0, 0, r * 0.80, 0, Math.PI * 2); ctx.stroke();
    for (let arm = 0; arm < 2; arm++) {
      ctx.beginPath();
      for (let t = 0; t <= 1; t += 0.04) {
        const a  = arm * Math.PI + t * Math.PI * 2.5;
        const ri = r * (0.12 + 0.60 * t);
        const px = Math.cos(a) * ri, py = Math.sin(a) * ri;
        t === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

  } else {
    // cross-glyph: ornate cross + diamond + ring
    ctx.beginPath(); ctx.arc(0, 0, r * 0.80, 0, Math.PI * 2); ctx.stroke();
    const cl = r * 0.65;
    ctx.beginPath();
    ctx.moveTo(0, -cl); ctx.lineTo(0, cl);
    ctx.moveTo(-cl, 0); ctx.lineTo(cl, 0);
    ctx.stroke();
    const dl = r * 0.34;
    ctx.beginPath();
    ctx.moveTo(0, -dl); ctx.lineTo(dl, 0); ctx.lineTo(0, dl); ctx.lineTo(-dl, 0);
    ctx.closePath(); ctx.stroke();
  }
}

function drawRune(ctx, ru) {
  const { r, type, pal, rot, pulse, alpha, life, maxLife } = ru;
  const fadeIn  = Math.min(life / 1.0, 1);
  const fadeOut = Math.min((maxLife - life) / 1.5, 1);
  const pulsed  = 0.65 + 0.35 * (0.5 + 0.5 * Math.sin(pulse));
  ctx.globalAlpha = alpha * fadeIn * fadeOut;

  ctx.save();
  ctx.translate(ru.x, ru.y);
  ctx.rotate(rot);

  // ── Outer glow bloom ─────────────────────────────────────────
  const bloom = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 2.2);
  bloom.addColorStop(0,   glowStyle(pal.glow, 0.45 * pulsed));
  bloom.addColorStop(0.5, glowStyle(pal.glow, 0.18 * pulsed));
  bloom.addColorStop(1,   glowStyle(pal.glow, 0));
  ctx.beginPath();
  ctx.arc(0, 0, r * 2.2, 0, Math.PI * 2);
  ctx.fillStyle = bloom;
  ctx.fill();

  // ── Glyph drawn twice — wide dim pass + narrow bright pass ───
  ctx.shadowColor = pal.glow;
  ctx.shadowBlur  = r * 0.5 * pulsed;
  drawRuneGlyph(ctx, type, r, glowStyle(pal.line, 0.5 * pulsed));
  ctx.shadowBlur  = 0;
  drawRuneGlyph(ctx, type, r, pal.core);

  ctx.restore();
}

export default { name, init, update, draw };

export function draw(ctx, state) {
  ctx.save();
  state.runes.forEach(r => drawRune(ctx, r));
  ctx.globalAlpha = 1;
  ctx.shadowBlur  = 0;
  ctx.restore();
}
