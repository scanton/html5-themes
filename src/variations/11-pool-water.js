// Pool Water — WebGL / GLSL.
//
// Technique: two-level domain warp produces a rippled height field (top-down
// view of water).  Finite-difference gradient on the warped field gives surface
// slope — high slope areas catch and focus light into caustic lines.
// A faster independent FBM layer adds fine sparkle on the surface.
// Dark-trough shadowing gives depth between the bright caustic lines.
//
// Palette: deep azure shadow → mid pool blue → bright aqua → caustic near-white.

import { createGLVariation } from '../engine.js';

export default createGLVariation('Pool Water', `
void main() {
  vec2 uv  = gl_FragCoord.xy / u_resolution;
  float asp = u_resolution.x / u_resolution.y;
  vec2 p = (uv - 0.5) * vec2(asp, 1.0) * 1.4;

  float t = u_time * 0.28;

  // ── warp level 1 — ripple orbits ─────────────────────────────
  vec2 q = vec2(
    fbm(p + vec2( cos(t*0.47)*0.72,  sin(t*0.41)*0.65)),
    fbm(p + vec2( sin(t*0.43)*0.68, -cos(t*0.51)*0.72) + vec2(3.80, 1.90))
  );

  // ── warp level 2 — slower swell ──────────────────────────────
  vec2 r = vec2(
    fbm(p + 2.6*q + vec2( cos(t*0.22)*1.10,  sin(t*0.19)*0.95) + vec2(1.50, 6.80)),
    fbm(p + 2.6*q + vec2(-sin(t*0.25)*1.00,  cos(t*0.21)*1.10) + vec2(5.70, 2.10))
  );

  // Height field
  float h = fbm(p + 2.0*r);

  // ── Caustics via surface gradient ─────────────────────────────
  float eps = 0.005;
  float hR  = fbm((p + vec2(eps, 0.0)) + 2.0*r);
  float hU  = fbm((p + vec2(0.0, eps)) + 2.0*r);
  vec2  grad  = vec2(hR - h, hU - h) / eps;
  float slope = length(grad);

  // Narrow bright caustic lines at wave edges
  float caustic = pow(clamp(slope * 0.58, 0.0, 1.0), 3.2) * 2.4;

  // Fine sparkle: faster high-freq FBM layer
  float fineH = fbm(p * 2.6 + 1.9*r + vec2(cos(t*0.71)*0.55, sin(t*0.65)*0.48));
  float spark  = pow(max(fineH - 0.57, 0.0) * 5.5, 4.0);
  caustic += spark * 0.7;

  // ── Palette: deep azure → mid pool blue → bright aqua → caustic ─
  vec3 c0 = vec3(0.01, 0.12, 0.36);   // deep azure shadow
  vec3 c1 = vec3(0.03, 0.38, 0.70);   // mid pool blue
  vec3 c2 = vec3(0.06, 0.68, 0.88);   // bright aqua
  vec3 c3 = vec3(0.84, 0.97, 1.00);   // caustic near-white / cyan

  float s1 = smoothstep(0.22, 0.54, h);
  float s2 = smoothstep(0.50, 0.78, h);
  vec3 col  = mix(c0, c1, s1);
  col       = mix(col, c2, s2);

  // Caustic overlay
  col = mix(col, c3, clamp(caustic, 0.0, 1.0) * 0.88);

  // ── Dark troughs — depth between wave crests ──────────────────
  float trough = fbm(p * 1.3 + 1.7*q + vec2(cos(t*0.17)*0.58, -sin(t*0.15)*0.52));
  col *= 0.68 + 0.32 * smoothstep(0.28, 0.58, trough);

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`);
