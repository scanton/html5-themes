// Liquid Metal — WebGL / GLSL.
//
// Technique: two-level domain warp with circular-orbit offsets keeps the
// surface churning in-place (no panning).  Finite-difference gradient on the
// warped height field gives a proxy surface normal.  Steep slopes (large
// |grad|) catch the "environment" and go bright silver; flat concave areas
// stay near-black, exactly like mercury.  A faster independent FBM layer
// drives moving specular flashes.
//
// Palette: near-black → dark blue-steel → cool silver → near-white.
// Very high contrast to sell the liquid metal read.

import { createGLVariation } from '../engine.js';

export default createGLVariation('Liquid Metal', `
void main() {
  vec2 uv  = gl_FragCoord.xy / u_resolution;
  float asp = u_resolution.x / u_resolution.y;
  vec2 p = (uv - 0.5) * vec2(asp, 1.0) * 1.2;

  float t = u_time * 0.42;

  // ── warp level 1 — mid-speed circular orbits ──────────────────
  vec2 q = vec2(
    fbm(p + vec2( cos(t*0.51)*1.05,  sin(t*0.43)*0.90)),
    fbm(p + vec2( sin(t*0.46)*0.90, -cos(t*0.54)*1.05) + vec2(5.30, 2.70))
  );

  // ── warp level 2 — slower, larger radius ──────────────────────
  vec2 r = vec2(
    fbm(p + 3.4*q + vec2( cos(t*0.28)*1.40,  sin(t*0.24)*1.20) + vec2(1.80, 8.30)),
    fbm(p + 3.4*q + vec2(-sin(t*0.32)*1.25,  cos(t*0.26)*1.40) + vec2(6.90, 1.50))
  );

  // Height field
  float h  = fbm(p + 2.8*r);

  // ── Surface gradient (holding r fixed) → slope proxy ─────────
  float eps = 0.006;
  float hR  = fbm((p + vec2(eps, 0.0)) + 2.8*r);
  float hU  = fbm((p + vec2(0.0, eps)) + 2.8*r);
  vec2  grad  = vec2(hR - h, hU - h) / eps;
  float slope = length(grad);

  // Steep slopes face the environment → high reflectance → bright
  float refl = clamp(h * 0.35 + slope * 0.55, 0.0, 1.0);

  // ── Palette: near-black → dark steel → cool silver → near-white
  vec3 c0 = vec3(0.14, 0.17, 0.24);   // dark blue-grey (not black)
  vec3 c1 = vec3(0.28, 0.34, 0.46);   // mid blue-steel
  vec3 c2 = vec3(0.54, 0.60, 0.70);   // cool silver
  vec3 c3 = vec3(0.76, 0.80, 0.88);   // light silver (not white)

  float s1 = smoothstep(0.05, 0.38, refl);
  float s2 = smoothstep(0.36, 0.66, refl);
  float s3 = smoothstep(0.63, 0.92, refl);
  vec3 col  = mix(c0, c1, s1);
  col       = mix(col, c2, s2);
  col       = mix(col, c3, s3);

  // ── Moving specular flashes — faster, higher-freq FBM layer ───
  float specH = fbm(p * 1.8 + 2.2*r + vec2(cos(t*0.65)*0.60, sin(t*0.59)*0.55));
  float spec   = pow(max(specH - 0.60, 0.0) * 4.0, 5.0);
  col += spec * vec3(0.92, 0.90, 0.88) * 0.9;

  // ── Dark liquid rivulets ───────────────────────────────────────
  float groove = fbm(p * 1.5 + 2.0*q + vec2(cos(t*0.21)*0.70, -sin(t*0.18)*0.65));
  col *= 0.42 + 0.58 * smoothstep(0.26, 0.52, groove);

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`);
