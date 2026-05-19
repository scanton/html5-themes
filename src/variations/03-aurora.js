// Aurora Borealis — WebGL / GLSL.
//
// Technique: one continuous luminous sheet (not discrete columns).
// A fabric-wave domain warp displaces sample coords so the whole sheet
// undulates like a curtain in wind.  Two-scale FBM — broad zones (3-5 per
// frame) lifted with pow(x,0.65) so there are no black voids, plus fine
// filaments layered on top — gives the brightness variation that reads as
// curtain texture without discrete separation.  Color is a vertical gradient:
// green (base) → teal → violet → magenta (tips).

import { createGLVariation } from '../engine.js';

export default createGLVariation('Aurora Borealis', `
void main() {
  vec2 uv  = gl_FragCoord.xy / u_resolution;
  float asp = u_resolution.x / u_resolution.y;
  float t   = u_time * 0.22;

  // ── night sky ─────────────────────────────────────────────────
  vec3 sky = vec3(0.003, 0.007, 0.036);

  // ── fabric-wave domain warp ───────────────────────────────────
  // Mostly lateral displacement so the sheet sways left/right.
  float xd1 = fbm(vec2(uv.x * 0.9 + t*0.16, uv.y * 1.1 + t*0.11)) * 0.28;
  float xd2 = fbm(vec2(uv.x * 1.7 - t*0.13, uv.y * 0.7 - t*0.09) + vec2(4.1, 2.3)) * 0.14;
  float yd  = fbm(vec2(uv.x * 1.2 + t*0.10, uv.y * 0.5 + t*0.08) + vec2(1.8, 5.2)) * 0.06;
  vec2 wp = uv + vec2(xd1 + xd2, yd);

  // ── aurora band extent ────────────────────────────────────────
  float aBase  = 0.16;
  float topVar = fbm(vec2(uv.x * 1.9 + t*0.07, 1.5)) * 0.13;
  float aTop   = 0.84 + topVar;
  float yN     = clamp((uv.y - aBase) / (aTop - aBase), 0.0, 1.0);

  float mask = smoothstep(aBase - 0.04, aBase + 0.09, uv.y)
             * smoothstep(aTop  + 0.04, aTop  - 0.10, uv.y);

  // ── curtain brightness: two-scale FBM on warped coords ────────
  // Broad zones (3-5 across width): power < 1 lifts midtones → no voids
  float broad = fbm(vec2(wp.x * asp * 3.2 + cos(t*0.38)*1.4, wp.y * 0.9));
  broad = pow(broad, 0.65);

  // Fine filaments (6-9 across width): higher contrast texture
  float fine = fbm(vec2(wp.x * asp * 6.8 + sin(t*0.55)*2.2 + cos(t*0.44)*1.0,
                        wp.y * 2.2 + t*0.18));
  fine = pow(fine, 1.1);

  float brightness = broad * 0.60 + fine * 0.40;

  // Taper: brightest in lower-mid portion, fades toward tips
  float taper = smoothstep(0.0, 0.12, yN) * (1.0 - pow(yN, 1.8));

  float intensity = mask * brightness * taper;

  // ── colour: vertical gradient ─────────────────────────────────
  vec3 cGreen  = vec3(0.06, 0.90, 0.40);
  vec3 cTeal   = vec3(0.00, 0.70, 0.94);
  vec3 cViolet = vec3(0.50, 0.05, 1.00);
  vec3 cMag    = vec3(0.98, 0.12, 0.76);

  vec3 aCol;
  if      (yN < 0.38) aCol = mix(cGreen,  cTeal,   yN / 0.38);
  else if (yN < 0.68) aCol = mix(cTeal,   cViolet, (yN - 0.38) / 0.30);
  else                aCol = mix(cViolet, cMag,    min((yN - 0.68) / 0.32, 1.0));

  // ── composite ─────────────────────────────────────────────────
  float eFade = smoothstep(0.0, 0.04, uv.x) * smoothstep(1.0, 0.96, uv.x);

  vec3 col = sky;
  col += aCol * intensity * eFade * 3.8;

  col = pow(col, vec3(0.88));
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`);
