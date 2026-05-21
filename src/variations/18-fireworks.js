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
    // ── 1. Launch — shell is 1/3 original size ─────────────────
    float prog = phase / 0.10;
    float dotY = 0.04 + prog * (by - 0.04);
    float ldist = length(p - vec2(bx, dotY));
    // Coefficient 9× larger → radius 1/3 of original
    col += burstCol * exp(-ldist * ldist * 16200.0) * 4.0;
    // Trail: 1/3 width and 1/3 length
    float trailLen = 0.033;
    float tMask = smoothstep(0.002, 0.0, abs(p.x - bx));
    float tFade = clamp((p.y - (dotY - trailLen)) / trailLen, 0.0, 1.0);
    float tAbove = clamp((dotY - p.y) / 0.003, 0.0, 1.0);
    col += burstCol * tMask * tFade * tFade * tAbove * 0.8;

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

  }
  // phase 0.44–1.0: dark / dormant (firework has fully faded)

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

  // Stars: 180 fixed random positions — no grid, no repeating pattern.
  // Each star's (x,y) comes from independent hash calls with unique seeds,
  // so placement is uncorrelated and looks genuinely scattered.
  float starBright = 0.0;
  for (int i = 0; i < 180; i++) {
    float fi = float(i);
    vec2  sp = vec2(hash(vec2(fi, 73.1)), hash(vec2(fi, 29.7)));
    float sb = 0.35 + hash(vec2(fi, 47.3)) * 0.65;
    float sd = length(uv - sp);
    starBright += exp(-sd * sd * 320000.0) * sb;
  }
  col += clamp(starBright, 0.0, 1.5) * vec3(0.88, 0.92, 1.00);

  // ── City skyline silhouette ───────────────────────────────────
  // 32 building columns — narrower, more urban
  float bCol    = floor(uv.x * 32.0);
  float skyline = hash(vec2(bCol, 99.0)) * 0.13 + 0.05;
  float inBldg  = 1.0 - smoothstep(skyline - 0.002, skyline + 0.002, uv.y);

  // Window lights: fine grid so windows are small dots, not large blocks
  vec2  winGS    = uv * vec2(200.0, 70.0);
  vec2  winCell  = floor(winGS);
  vec2  winFrac  = fract(winGS) - 0.5;
  float winHash  = hash(winCell);
  // Only ~12% of cells lit; gaussian within cell → soft window glow
  float hasWin   = max(winHash - 0.88, 0.0) * 8.33;
  float winGlow  = smoothstep(0.28, 0.0, length(winFrac)) * hasWin;
  winGlow *= inBldg;
  winGlow *= 0.75 + 0.25 * sin(u_time * (0.3 + winHash * 1.8) + winHash * 6.28);

  vec3 bldgCol = vec3(0.05, 0.06, 0.12);   // dark blue-grey silhouette
  bldgCol += winGlow * vec3(0.75, 0.65, 0.28) * 0.60;
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
