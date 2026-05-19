// Smoke — WebGL / GLSL.
//
// Motion: circular-orbit offsets in both warp levels create in-place
// rolling/churning turbulence.  A steady upward y-drift on p makes the
// whole pattern rise, so it reads as smoke billowing upward rather than
// marble panning sideways.
//
// Softness: coordinate scale halved (1.4 vs old 2.8) so FBM features are
// larger and rounder.  Wider smoothstep range (0.28→0.60) and a squared
// density ramp keep transitions diffuse — no sharp veining.

import { createGLVariation } from '../engine.js';

export default createGLVariation('Smoke', `
void main() {
  vec2 uv  = gl_FragCoord.xy / u_resolution;
  float asp = u_resolution.x / u_resolution.y;
  float t   = u_time * 0.20;

  // Centre-normalised, aspect-corrected coords at soft scale
  vec2 p = (uv - 0.5) * vec2(asp, 1.0) * 1.4;

  // Smoke rises: subtract from y so the pattern drifts upward
  p.y -= t * 0.55;

  // ── warp level 1 — circular orbits for in-place churn ────────
  vec2 q = vec2(
    fbm(p + vec2( cos(t*0.44)*0.65,  sin(t*0.37)*0.65)),
    fbm(p + vec2( sin(t*0.40)*0.65, -cos(t*0.47)*0.65) + vec2(4.20, 1.70))
  );

  // ── warp level 2 — slower orbits, larger radius ───────────────
  vec2 r = vec2(
    fbm(p + 3.2*q + vec2( cos(t*0.27)*1.0,  sin(t*0.23)*0.85) + vec2(1.80, 8.30)),
    fbm(p + 3.2*q + vec2(-sin(t*0.31)*0.90,  cos(t*0.25)*1.0) + vec2(6.70, 1.50))
  );

  float f = fbm(p + 2.8*r);

  // ── smoke density ─────────────────────────────────────────────
  // Wide smoothstep → soft, diffuse edges; squared ramp → dense cores bright
  float density = smoothstep(0.28, 0.60, f);
  density = density * density;

  // Fade slightly near very top so smoke wisps away
  density *= smoothstep(1.0, 0.72, uv.y);

  // ── colour ────────────────────────────────────────────────────
  vec3 dark  = vec3(0.035, 0.035, 0.045);   // near black
  vec3 smoke = vec3(0.72, 0.74, 0.80);      // cool grey-white
  vec3 col   = mix(dark, smoke, density);

  // Soft blue tint at wispy transition edges
  float edge = smoothstep(0.0, 0.5, density) * (1.0 - smoothstep(0.5, 1.0, density));
  col = mix(col, vec3(0.28, 0.36, 0.58), edge * 0.20);

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`);
