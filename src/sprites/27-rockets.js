// Rockets — cartoon rockets and spaceships that zoom across the canvas,
// leaving short flame trails. Bold primary colours, chunky shapes.

export const name = 'Rockets';

function rand(min, max) { return min + Math.random() * (max - min); }

const COLORS = [
  { body: '#ff3333', fin: '#cc0000', window: '#88eeff', flame: '#ffaa00' },  // red
  { body: '#3388ff', fin: '#0044cc', window: '#ccffff', flame: '#ffcc00' },  // blue
  { body: '#22cc44', fin: '#007722', window: '#aaffcc', flame: '#ff8800' },  // green
  { body: '#ffcc00', fin: '#cc8800', window: '#ffffff', flame: '#ff4400' },  // yellow
  { body: '#cc44ff', fin: '#7700cc', window: '#ffeeff', flame: '#ff8800' },  // purple
];

function makeRocket(w, h, spreadXY) {
  const col   = COLORS[Math.floor(rand(0, COLORS.length))];
  const size  = rand(18, 36);
  const angle = rand(-Math.PI * 0.4, Math.PI * 0.4) - Math.PI / 2; // mostly upward
  const speed = rand(90, 200);
  return {
    x:       spreadXY ? rand(size, w - size) : rand(size * 2, w - size * 2),
    y:       spreadXY ? rand(size, h - size) : h + size + rand(0, 60),
    size, col,
    vx:      Math.cos(angle) * speed,
    vy:      Math.sin(angle) * speed,
    rot:     angle + Math.PI / 2,  // nose points in direction of travel
    wobble:  rand(0, Math.PI * 2),
    wobRate: rand(1.5, 3.0),
    wobAmp:  rand(0.02, 0.06),
    life:    0,
    maxLife: rand(5, 12),
  };
}

export function init(w, h) {
  const rockets = [];
  for (let i = 0; i < 8; i++) rockets.push(makeRocket(w, h, true));
  return { rockets, w, h, timer: 0 };
}

export function update(state, dt) {
  const { rockets, w, h } = state;
  state.timer += dt;
  if (state.timer > 0.9 && rockets.length < 14) {
    rockets.push(makeRocket(w, h, false));
    state.timer = 0;
  }
  for (let i = rockets.length - 1; i >= 0; i--) {
    const r = rockets[i];
    r.life   += dt;
    r.wobble += r.wobRate * dt;
    r.x      += r.vx * dt;
    r.y      += r.vy * dt;
    // Gentle wobble to rotation
    r.rot = (r.rot * 0.96 + (Math.atan2(r.vy, r.vx) + Math.PI / 2) * 0.04)
            + Math.sin(r.wobble) * r.wobAmp;
    if (r.x < -r.size * 4 || r.x > w + r.size * 4 ||
        r.y < -r.size * 4 || r.y > h + r.size * 4 ||
        r.life > r.maxLife) {
      rockets.splice(i, 1);
    }
  }
}

function drawRocket(ctx, r) {
  const { size: sz, col, rot, life, maxLife } = r;
  const fadeIn  = Math.min(life / 0.5, 1);
  const fadeOut = Math.min((maxLife - life) / 1.0, 1);
  ctx.globalAlpha = fadeIn * fadeOut;

  ctx.save();
  ctx.translate(r.x, r.y);
  ctx.rotate(rot);

  // Flame trail (below / behind the rocket body)
  const flameLen = sz * 1.2;
  const flameGrad = ctx.createLinearGradient(0, sz * 0.55, 0, sz * 0.55 + flameLen);
  flameGrad.addColorStop(0, col.flame);
  flameGrad.addColorStop(0.4, '#ffff44');
  flameGrad.addColorStop(1, 'rgba(255,100,0,0)');
  ctx.beginPath();
  ctx.moveTo(-sz * 0.22, sz * 0.55);
  ctx.lineTo( sz * 0.22, sz * 0.55);
  ctx.lineTo( sz * 0.06, sz * 0.55 + flameLen);
  ctx.lineTo(-sz * 0.06, sz * 0.55 + flameLen);
  ctx.closePath();
  ctx.fillStyle = flameGrad;
  ctx.fill();

  // Side fins — two small triangles
  const finW = sz * 0.36;
  const finH = sz * 0.38;
  const finY = sz * 0.22;
  [[-1, 1], [1, -1]].forEach(([sx]) => {
    ctx.beginPath();
    ctx.moveTo(sx * sz * 0.22, finY);
    ctx.lineTo(sx * (sz * 0.22 + finW), finY + finH);
    ctx.lineTo(sx * sz * 0.22, finY + finH * 0.6);
    ctx.closePath();
    ctx.fillStyle = col.fin;
    ctx.fill();
  });

  // Body — tall rounded rectangle
  const bodyW = sz * 0.44;
  const bodyH = sz * 1.0;
  const bodyY = -sz * 0.45;
  ctx.beginPath();
  ctx.roundRect(-bodyW, bodyY, bodyW * 2, bodyH, [bodyW, bodyW, bodyW * 0.3, bodyW * 0.3]);
  ctx.fillStyle = col.body;
  ctx.fill();
  ctx.strokeStyle = col.fin;
  ctx.lineWidth   = Math.max(0.8, sz * 0.036);
  ctx.stroke();

  // Nose cone (triangle cap)
  ctx.beginPath();
  ctx.moveTo(0, bodyY - sz * 0.5);
  ctx.lineTo(-bodyW, bodyY);
  ctx.lineTo( bodyW, bodyY);
  ctx.closePath();
  ctx.fillStyle = col.fin;
  ctx.fill();

  // Porthole window
  const winR = sz * 0.16;
  ctx.beginPath();
  ctx.arc(0, bodyY + sz * 0.28, winR, 0, Math.PI * 2);
  ctx.fillStyle = col.window;
  ctx.fill();
  ctx.strokeStyle = col.fin;
  ctx.lineWidth   = Math.max(0.6, sz * 0.030);
  ctx.stroke();
  // Window shine
  ctx.beginPath();
  ctx.arc(-winR * 0.3, bodyY + sz * 0.28 - winR * 0.3, winR * 0.35, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fill();

  ctx.restore();
}

export default { name, init, update, draw };

export function draw(ctx, state) {
  ctx.save();
  state.rockets.forEach(r => drawRocket(ctx, r));
  ctx.globalAlpha = 1;
  ctx.restore();
}
