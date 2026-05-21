// Fireworks — WebGL / GLSL.
//
// New Year's Eve fireworks over a city skyline.  Eight independent bursts
// cycle asynchronously through four phases:
//   1. Launch — a bright rising dot with a fading trail climbs from the
//      roofline to the burst apex.
//   2. Burst — an expanding ring of coloured light with N radial streaks
//      (primary + half-period secondary) and a blinding core flash.
//   3. Sparkle — an FBM-textured glitter cloud fills the burst sphere as
//      the main ring fades.
//   4. Afterglow — a soft wide gaussian glow lingers before dark.
//
// City silhouette: hash-based building columns with random roofline heights
// and scattered yellow window lights.  Twinkling star field in the sky.

import { createGLVariation } from '../engine.js';

export default createGLVariation('Fireworks', `
// One firework burst — returns its colour contribution at world point p.
vec3 firework(vec2 p, float asp, float t, float seed) {
  float bx     = hash(vec2(seed, 1.0)) * asp;
  float by     = 0.28 + hash(vec2(seed, 2.0)) * 0.52;
  float period = 4.2  + hash(vec2(seed, 3.0)) * 3.8;
  float phase  = fract(t / period + hash(vec2(seed, 4.0)));
  float nStr   = 6.0 + floor(hash(vec2(seed, 5.0)) * 7.0);   // 6–12 streaks
  float size   = 0.13 + hash(vec2(seed, 7.0)) * 0.11;
  float hue    = hash(vec2(seed, 6.0));

  vec3 burstCol;
  if      (hue < 0.17) burstCol = vec3(1.00, 0.90, 0.18);  // gold
  else if (hue < 0.34) burstCol = vec3(1.00, 0.16, 0.16);  // red
  else if (hue < 0.50) burstCol = vec3(0.18, 0.82, 1.00);  // cyan
  else if (hue < 0.66) burstCol = vec3(0.80, 0.18, 1.00);  // violet
  else if (hue < 0.82) burstCol = vec3(0.18, 1.00, 0.36);  // green
  else                 burstCol = vec3(1.00, 0.78, 0.92);   // rose-white

  vec3  col  = vec3(0.0);
  vec2  diff = p - vec2(bx, by);
  float dist = length(diff);

  if (phase < 0.10) {
    // ── 1. Launch ──────────────────────────────────────────────
    float prog = phase / 0.10;
    float dotY = 0.04 + prog * (by - 0.04);
    float ldist = length(p - vec2(bx, dotY));
    col += burstCol * exp(-ldist * ldist * 1800.0) * 4.0;
    // Fading trail: thin vertical strip below the dot
    float trailLen = 0.10;
    float tMask = smoothstep(0.006, 0.0, abs(p.x - bx));
    float tFade = clamp((p.y - (dotY - trailLen)) / trailLen, 0.0, 1.0);
    float tAbove = clamp((dotY - p.y) / 0.008, 0.0, 1.0);
    col += burstCol * tMask * tFade * tFade * tAbove * 1.0;

  } else if (phase < 0.44) {
    // ── 2. Burst + 3. Sparkle ──────────────────────────────────
    float bp    = (phase - 0.10) / 0.34;      // 0→1 through burst
    float angle = atan(diff.y, diff.x);

    // Expanding ring
    float burstR = bp * size;
    float ringW  = size * 0.055;
    float ring   = exp(-pow((dist - burstR) / ringW, 2.0));

    // Radial streaks: primary (N-fold) + secondary (offset by π)
    float s1 = pow(max(cos(angle * nStr), 0.0), 8.0);
    float s2 = pow(max(cos(angle * nStr + 3.14159), 0.0), 16.0) * 0.42;
    float streak = max(s1, s2);

    // Overall fade (exponential over burst lifetime)
    float fade = exp(-bp * bp * 5.0);

    // Core flash at moment of detonation
    float core = exp(-dist * dist * 250.0) * (1.0 - bp * 2.5) * 4.0;
    core = max(core, 0.0);

    col += burstCol * (ring * streak * 3.0 + core) * fade;

    // Glitter cloud (FBM-textured random sparks)
    float spark = fbm(diff * 20.0 + vec2(seed * 0.41, bp * 3.5));
    spark = pow(max(spark - 0.56, 0.0) * 5.8, 2.6);
    float sparkMask = smoothstep(burstR * 1.25, 0.0, dist);
    col += burstCol * spark * sparkMask * fade * 2.0;

  } else if (phase < 0.92) {
    // ── 4. Afterglow ───────────────────────────────────────────
    float ap   = (phase - 0.44) / 0.48;
    float glow = exp(-dist * dist * 20.0) * exp(-ap * ap * 5.5) * 0.38;
    col += burstCol * glow;
  }

  return col;
}

void main() {
  vec2  uv  = gl_FragCoord.xy / u_resolution;
  float asp = u_resolution.x / u_resolution.y;
  vec2  p   = uv * vec2(asp, 1.0);
  float t   = u_time * 0.72;

  // ── Night sky ─────────────────────────────────────────────────
  vec3 col = mix(vec3(0.01, 0.01, 0.07), vec3(0.03, 0.05, 0.16),
                 pow(uv.y, 0.55));

  // Twinkling stars
  vec2  starCell = floor(uv * vec2(220.0, 128.0));
  float star     = hash(starCell);
  star = pow(max(star - 0.975, 0.0) * 40.0, 2.5);
  star *= 0.50 + 0.50 * sin(u_time * (1.5 + hash(starCell + 0.4) * 3.8));
  col += star * vec3(0.86, 0.90, 1.00);

  // ── City skyline silhouette ───────────────────────────────────
  float bCol    = floor(uv.x * 24.0);
  float skyline = hash(vec2(bCol, 99.0)) * 0.14 + 0.05;
  float inBldg  = 1.0 - smoothstep(skyline - 0.003, skyline + 0.003, uv.y);

  // Window lights: random grid, only inside buildings
  vec2  winCell  = floor(uv * vec2(96.0, 38.0));
  float winHash  = hash(winCell);
  float win      = winHash > 0.80 ? 1.0 : 0.0;
  win *= inBldg;
  // Flicker slowly
  win *= 0.80 + 0.20 * sin(u_time * (0.4 + winHash * 2.0) + winHash * 6.28);

  vec3 bldgCol = vec3(0.04, 0.05, 0.10);
  bldgCol += win * vec3(0.68, 0.60, 0.24) * 0.55;
  col = mix(col, bldgCol, inBldg);

  // ── Fireworks (8 asynchronous bursts) ────────────────────────
  for (int i = 0; i < 8; i++) {
    col += firework(p, asp, t, float(i) * 17.31 + 2.73);
  }

  // Clamp before final composite — fireworks can oversaturate
  col = clamp(col, 0.0, 1.5);

  // ── Crowd / street glow at base ───────────────────────────────
  float crowd = smoothstep(0.18, 0.0, uv.y) * 0.30;
  col += crowd * vec3(0.28, 0.20, 0.06);

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`);
