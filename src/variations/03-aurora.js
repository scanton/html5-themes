// Aurora Borealis — WebGL / GLSL.
//
// Technique: four independently-waving sine-wave ribbons, each with its own
// colour, overlaid on a shared FBM striation texture.  Ribbon centres follow
// a dual-frequency sine profile (slow broad + fast ripple) matching the
// Canvas reference technique, while the fabric-wave domain warp from the
// original preserves the vertical curtain/striation look.
// Colours: green (low) → teal → violet → magenta (high), same palette.

import { createGLVariation } from '../engine.js';

export default createGLVariation('Aurora Borealis', `
void main() {
  vec2 uv  = gl_FragCoord.xy / u_resolution;
  float asp = u_resolution.x / u_resolution.y;
  float t   = u_time * 0.22;

  // ── night sky ─────────────────────────────────────────────────
  vec3 sky = vec3(0.003, 0.007, 0.036);

  // ── fabric-wave domain warp (preserves vertical striations) ───
  float xd1 = fbm(vec2(uv.x * 0.9 + t*0.16, uv.y * 1.1 + t*0.11)) * 0.28;
  float xd2 = fbm(vec2(uv.x * 1.7 - t*0.13, uv.y * 0.7 - t*0.09) + vec2(4.1, 2.3)) * 0.14;
  float yd  = fbm(vec2(uv.x * 1.2 + t*0.10, uv.y * 0.5 + t*0.08) + vec2(1.8, 5.2)) * 0.06;
  vec2 wp = uv + vec2(xd1 + xd2, yd);

  // ── curtain brightness: two-scale FBM on warped coords ────────
  float broad = fbm(vec2(wp.x * asp * 3.2 + cos(t*0.38)*1.4, wp.y * 0.9));
  broad = pow(broad, 0.65);
  float fine = fbm(vec2(wp.x * asp * 6.8 + sin(t*0.55)*2.2 + cos(t*0.44)*1.0,
                        wp.y * 2.2 + t*0.18));
  fine = pow(fine, 1.1);
  float striation = broad * 0.60 + fine * 0.40;

  // ── sine-wave ribbon centres ───────────────────────────────────
  // wx: horizontal position in aspect space so frequency is screen-relative.
  // Dual-frequency per ribbon — slow broad wave (≈5.5 cycles across screen)
  // + fast ripple (≈13 cycles), each band independently phased in time.
  float wx = uv.x * asp;
  float r1 = 0.38 + sin(wx * 5.5 + t * 0.85)          * 0.065
                  + sin(wx * 13.0 - t * 0.60)           * 0.018;
  float r2 = 0.50 + sin(wx * 5.5 + t * 0.62 + 1.57)    * 0.085
                  + sin(wx * 13.0 - t * 0.60)           * 0.024;
  float r3 = 0.62 + sin(wx * 5.5 + t * 0.74 + 3.14)    * 0.070
                  + sin(wx * 13.0 - t * 0.60)           * 0.020;
  float r4 = 0.73 + sin(wx * 5.5 + t * 0.50 + 4.71)    * 0.050
                  + sin(wx * 13.0 - t * 0.60)           * 0.014;

  // Soft ribbon masks — fade from full brightness at centre to 0 at half-width
  float m1 = smoothstep(0.22, 0.0, abs(uv.y - r1));
  float m2 = smoothstep(0.20, 0.0, abs(uv.y - r2));
  float m3 = smoothstep(0.18, 0.0, abs(uv.y - r3));
  float m4 = smoothstep(0.16, 0.0, abs(uv.y - r4));

  // Keep aurora off the very bottom of the screen
  float liftFade = smoothstep(0.10, 0.22, uv.y);
  m1 *= liftFade; m2 *= liftFade; m3 *= liftFade; m4 *= liftFade;

  // ── colour: same palette as original ─────────────────────────
  vec3 cGreen  = vec3(0.06, 0.90, 0.40);
  vec3 cTeal   = vec3(0.00, 0.70, 0.94);
  vec3 cViolet = vec3(0.50, 0.05, 1.00);
  vec3 cMag    = vec3(0.98, 0.12, 0.76);

  vec3 aurora = cGreen  * m1 * striation
              + cTeal   * m2 * striation
              + cViolet * m3 * striation
              + cMag    * m4 * striation;

  // ── composite ─────────────────────────────────────────────────
  float eFade = smoothstep(0.0, 0.04, uv.x) * smoothstep(1.0, 0.96, uv.x);

  vec3 col = sky;
  col += aurora * eFade * 3.8;

  col = pow(col, vec3(0.88));
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`);
