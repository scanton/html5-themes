// Snowfall — WebGL / GLSL.
//
// Technique: 1-D column strip particle system.  Each strip owns particles
// whose y position is tracked in full screen-space (not cell-local), so the
// fract() wrap always happens outside the visible area (py > 1.12 or < -0.12).
// Flakes always enter from above the screen and exit below — never pop in mid-air.
//
// Three depth layers:
//   Far  — many thin strips, slow, small, dim.
//   Mid  — fewer wider strips, moderate speed.
//   Near — sparse large fast flakes.
//
// Two particles per strip (staggered seeds) keep density reasonable without
// blowing loop counts.  ±2 neighbour check catches wind-drifted particles.
//
// Air currents: each particle has a global slow gust + per-particle sinusoidal
// weave, so no two flakes fall on the same path.

import { createGLVariation } from '../engine.js';

export default createGLVariation('Snowfall', `
// One depth layer.  numS = strips across width.
// spd = fall speed (screen-heights per second).
// wnd = lateral wind amplitude (screen fraction).
// flkR = flake radius in screen fraction.
// seed = layer seed (must differ per layer).
float snowLayer(vec2 uv, float t, float asp,
                float numS, float spd, float wnd, float flkR, float seed) {
  float sx     = uv.x * numS;
  float cell_x = floor(sx);

  // Global gust slowly oscillates (different phase per layer via seed)
  float gust = sin(t * 0.20 + seed * 2.31) * wnd;

  float bright = 0.0;

  // Check ±2 neighbouring strips to catch wind-drifted particles
  for (int i = -2; i <= 2; i++) {
    float nc = cell_x + float(i);

    // Two staggered particles per strip
    for (int k = 0; k < 2; k++) {
      float sk = float(k) * 31.71 + seed;

      float rx = hash(vec2(nc + 17.30, sk));   // x jitter within strip
      float ry = hash(vec2(nc,          sk));   // initial y phase
      float rs = hash(vec2(nc +  5.91,  sk));   // per-particle speed variation
      float rw = hash(vec2(nc + 11.37,  sk));   // per-particle wind variation
      float rp = hash(vec2(nc + 23.13,  sk));   // per-particle wind phase

      // y in full screen space: travels from 1.12 (just above top) down to -0.12
      // (just below bottom).  fract() wrap jumps from -0.12 → 1.12 — both off-screen.
      float py_raw = fract(ry - t * spd * (0.80 + rs * 0.40));
      float py = 1.12 - py_raw * 1.24;

      // Lateral wind: global gust + per-particle sinusoidal weave
      float windOff = gust + sin(t * (0.26 + rw * 0.42) + rp * 6.28) * wnd * 0.55;
      float px = (nc + rx) / numS + windOff;

      // Screen-space distance (aspect-corrected so flakes are circular)
      vec2  diff = vec2((uv.x - px) * asp, uv.y - py);
      bright += 1.0 - smoothstep(flkR * 0.25, flkR, length(diff));
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

  // ── Three depth layers: distant → near ────────────────────────
  // Far:  60 strips, 2 particles each → ~95 flakes, 2.4px radius
  float far  = snowLayer(uv, t, asp, 60.0, 0.024, 0.015, 0.0030, 1.00);
  // Mid:  24 strips, 2 particles each → ~38 flakes, 5px radius
  float mid  = snowLayer(uv, t, asp, 24.0, 0.052, 0.035, 0.0065, 4.73);
  // Near: 10 strips, 2 particles each → ~16 flakes, 14px radius
  float near = snowLayer(uv, t, asp, 10.0, 0.105, 0.060, 0.0175, 8.31);

  vec3 snowCol = vec3(1.0);
  col = mix(col, snowCol, far  * 0.42);
  col = mix(col, snowCol, mid  * 0.72);
  col = mix(col, snowCol, near);

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`);
