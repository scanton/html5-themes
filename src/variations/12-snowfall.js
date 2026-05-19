// Snowfall — WebGL / GLSL.
//
// Technique: hash-grid particle system with three depth layers.
//   Far layer  — many tiny slow flakes, dim.
//   Mid layer  — medium flakes at moderate speed.
//   Near layer — few large fast flakes, bright white.
//
// Air currents: each layer has a slowly oscillating global gust plus a
// per-flake sinusoidal drift so flakes weave individually.
// Flake size is in screen-fraction units so it scales with depth correctly.
//
// Background: cold blue-grey winter sky with faint cloud FBM and a soft
// ground-snow glow along the bottom edge.

import { createGLVariation } from '../engine.js';

export default createGLVariation('Snowfall', `
// One particle layer.  cellsX = horizontal cell count (controls density &
// apparent size).  spd = fall speed.  wnd = wind amplitude.
// flkR = flake radius in screen-fraction units.  seed = layer seed.
float snowLayer(vec2 uv, float t, float asp,
                float cellsX, float spd, float wnd, float flkR, float seed) {
  float cellsY = cellsX / asp;
  vec2  sc     = vec2(uv.x * cellsX, uv.y * cellsY);
  vec2  cell   = floor(sc);
  vec2  loc    = fract(sc);

  // Global wind gust — slowly oscillates, different phase per layer
  float gust = sin(t * 0.20 + seed * 2.31) * wnd;

  float bright = 0.0;
  for (int j = -1; j <= 1; j++) {
  for (int i = -1; i <= 1; i++) {
    vec2 nc  = cell + vec2(float(i), float(j));

    // Per-flake pseudo-random values
    float rx  = hash(nc + vec2(seed * 3.73, seed * 1.17));
    float ry  = hash(nc + vec2(seed * 0.83, seed * 2.41));
    float rw  = hash(nc + vec2(seed * 5.19, seed * 3.67));   // wind variation
    float rp  = hash(nc + vec2(seed * 1.93, seed * 7.13));   // phase
    float rsp = hash(nc + vec2(seed * 4.41, seed * 0.79));   // speed variation

    // Fall downward: y decreases, wraps from 1 → 0 → 1
    float py = fract(ry - t * spd * (0.78 + rsp * 0.44));

    // Lateral drift: global gust + per-flake sinusoidal weave
    float wx = gust + sin(t * (0.26 + rw * 0.42) + rp * 6.28) * wnd * 0.55;
    float px  = fract(rx + wx * 0.20);

    // Distance in screen-space fraction coords
    vec2 diff = loc - vec2(px, py) + vec2(float(i), float(j));
    vec2 sd   = vec2(diff.x / cellsX, diff.y * asp / cellsX);

    // Soft circular flake
    bright += 1.0 - smoothstep(flkR * 0.20, flkR, length(sd));
  }
  }
  return clamp(bright, 0.0, 1.0);
}

void main() {
  vec2  uv  = gl_FragCoord.xy / u_resolution;
  float asp = u_resolution.x / u_resolution.y;
  float t   = u_time;

  // ── Sky: cold dark-blue winter night ─────────────────────────
  vec3 skyTop = vec3(0.04, 0.07, 0.15);
  vec3 skyBot = vec3(0.12, 0.17, 0.26);
  vec3 col = mix(skyTop, skyBot, uv.y);

  // Faint cloud texture adds atmosphere
  vec2 cp = uv * vec2(asp, 1.0);
  float cloud = fbm(cp * 2.2 + vec2(t * 0.035, 0.0));
  col += cloud * vec3(0.03, 0.04, 0.06);

  // ── Ground glow: accumulated snow reflects ambient light ──────
  float glow = smoothstep(0.10, 0.0, uv.y);
  col = mix(col, vec3(0.66, 0.72, 0.80), glow * 0.50);

  // ── Snow layers: distant → near ───────────────────────────────
  // Far:  dense, tiny, slow — 42 cells across, 2.4px radius at 800px
  float far  = snowLayer(uv, t, asp, 42.0, 0.024, 0.016, 0.0030, 1.00);
  // Mid:  medium density and speed
  float mid  = snowLayer(uv, t, asp, 20.0, 0.052, 0.038, 0.0065, 4.73);
  // Near: sparse, large, fast — 8 cells across, ~13px radius at 800px
  float near = snowLayer(uv, t, asp,  8.0, 0.105, 0.075, 0.0165, 8.31);

  // Composite: far flakes dim, near flakes bright white
  vec3 snowCol = vec3(1.0);
  col = mix(col, snowCol, far  * 0.42);
  col = mix(col, snowCol, mid  * 0.72);
  col = mix(col, snowCol, near);

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`);
