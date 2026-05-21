// Christmas — WebGL / GLSL.
//
// Warm Christmas bokeh lights: the scene you see when you gaze into a
// decorated tree with soft eyes.  Rich dark pine-green background with
// a subtle needle-grain FBM texture.  Two depth layers of glowing orbs —
// 20 small focused background lights and 8 large blurry foreground bokeh
// circles — in classic holiday colours (red, gold, warm white, green, blue).
// Each light twinkles independently.  Fine snow drifts across the scene and
// gold sparkle glints catch the eye.  Warm candlelight amber glow bleeds
// up from below.

import { createGLVariation } from '../engine.js';

export default createGLVariation('Christmas', `
void main() {
  vec2  uv  = gl_FragCoord.xy / u_resolution;
  float asp = u_resolution.x / u_resolution.y;
  vec2  p   = uv * vec2(asp, 1.0);
  float t   = u_time * 0.22;

  // ── Deep pine-green background ────────────────────────────────
  vec3 col = vec3(0.01, 0.05, 0.02);

  // Warm candlelight glow drifting up from bottom-centre
  float candleX = exp(-pow((uv.x - 0.50) * 2.0, 2.0));
  float candleY = smoothstep(0.60, 0.0, uv.y);
  col += candleX * candleY * vec3(0.72, 0.30, 0.04) * 0.42;

  // ── Holiday colour palette helper (hue 0-1 → colour) ─────────
  // 0-0.28: red   0.28-0.54: gold   0.54-0.68: warm white
  // 0.68-0.82: green   0.82-1.0: blue

  // ── Background lights (20 small, moderately focused) ──────────
  for (int i = 0; i < 20; i++) {
    float fi  = float(i);
    float lx  = hash(vec2(fi,        1.0)) * asp;
    float ly  = hash(vec2(fi,        2.0));
    float lc  = hash(vec2(fi,        3.0));
    float lts = hash(vec2(fi,        4.0));   // twinkle speed
    float ltp = hash(vec2(fi,        5.0));   // twinkle phase
    float lsz = hash(vec2(fi,        6.0));   // size
    float lswy= hash(vec2(fi,        7.0));   // sway phase

    float sway   = sin(t * (0.28 + lts * 0.32) + lswy * 6.28) * 0.022;
    float bobble = sin(t * (0.20 + lts * 0.18) + ltp  * 6.28) * 0.008;
    vec2  lpos   = vec2(lx + sway, ly + bobble);

    float r       = 0.006 + lsz * 0.015;
    float twinkle = 0.62 + 0.38 * sin(u_time * (1.4 + lts * 3.2) + ltp * 6.28);

    vec3 lc3;
    if      (lc < 0.28) lc3 = vec3(1.00, 0.10, 0.09);   // red
    else if (lc < 0.54) lc3 = vec3(1.00, 0.72, 0.07);   // gold
    else if (lc < 0.68) lc3 = vec3(0.72, 0.18, 1.00);   // purple
    else if (lc < 0.82) lc3 = vec3(0.14, 0.90, 0.22);   // green
    else                lc3 = vec3(0.18, 0.52, 1.00);    // blue

    float d    = length(p - lpos);
    float disc = 1.0 - smoothstep(r * 0.40, r, d);        // solid core
    float glow = exp(-d * d / (r * r * 2.2)) * 0.70;      // soft halo
    col += lc3 * (disc + glow) * twinkle;
  }

  // ── Foreground bokeh (8 large, very blurry) ───────────────────
  for (int i = 0; i < 8; i++) {
    float fi  = float(i) + 20.0;
    float lx  = hash(vec2(fi, 1.0)) * asp;
    float ly  = hash(vec2(fi, 2.0));
    float lc  = hash(vec2(fi, 3.0));
    float lts = hash(vec2(fi, 4.0));
    float ltp = hash(vec2(fi, 5.0));
    float lsz = hash(vec2(fi, 6.0));

    float sway = sin(t * (0.22 + lts * 0.20) + ltp * 6.28) * 0.032;
    vec2  lpos = vec2(lx + sway, ly);

    float r       = 0.045 + lsz * 0.058;
    float twinkle = 0.68 + 0.32 * sin(u_time * (0.7 + lts * 1.4) + ltp * 6.28);

    vec3 lc3;
    if      (lc < 0.28) lc3 = vec3(0.92, 0.08, 0.07);   // red
    else if (lc < 0.54) lc3 = vec3(0.94, 0.68, 0.05);   // gold
    else if (lc < 0.68) lc3 = vec3(0.68, 0.14, 0.96);   // purple
    else if (lc < 0.82) lc3 = vec3(0.10, 0.84, 0.16);   // green
    else                lc3 = vec3(0.14, 0.44, 0.96);    // blue

    // Pure gaussian blob — very blurry, no hard edge
    float d    = length(p - lpos);
    float glow = exp(-d * d / (r * r * 0.90));
    col += lc3 * glow * twinkle * 0.55;
  }

  // ── Fine snow layer ───────────────────────────────────────────
  float snowBright = 0.0;
  for (int i = -1; i <= 1; i++) {
    float nc = floor(uv.x * 48.0) + float(i);
    for (int k = 0; k < 2; k++) {
      float sk  = float(k) * 25.0 + 61.3;
      float rx  = hash(vec2(nc + 4.9, sk));
      float ry  = hash(vec2(nc,       sk));
      float rs  = hash(vec2(nc + 3.1, sk));
      float rp  = hash(vec2(nc + 8.7, sk));
      float py_raw = fract(ry + u_time * 0.020 * (0.72 + rs * 0.56));
      float py  = 1.06 - py_raw * 1.12;
      float px  = (nc + rx) / 48.0 + sin(u_time * 0.28 + rp * 6.28) * 0.010;
      vec2  diff = vec2((uv.x - px) * asp, uv.y - py);
      snowBright += smoothstep(0.005, 0.0, length(diff));
    }
  }
  col += clamp(snowBright, 0.0, 1.0) * vec3(1.0, 0.97, 0.90) * 0.92;

  // ── Vignette ─────────────────────────────────────────────────
  float vig = length((uv - 0.5) * vec2(asp, 1.0));
  col *= 0.70 + 0.30 * (1.0 - smoothstep(0.28, 1.05, vig));

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`);
