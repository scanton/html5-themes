// Northern Fire — WebGL / GLSL.
//
// Technique: two-level domain warp on a vertically-stretched FBM field.
// The field drifts upward fast (t * 2.0) so flames visibly rise.
// No sine column modifier — domain warp alone creates organic flame tongues.
// No ember hash grid — was producing the random pixel noise.
// Color ramp: near-black → deep violet → crimson → orange → hot gold.
// A second fine-detail FBM pass adds flicker within the main flame body.

import { createGLVariation } from '../engine.js';

export default createGLVariation('Northern Fire', `
vec3 fireRamp(float h) {
  h = clamp(h, 0.0, 1.0);
  vec3 c0 = vec3(0.010, 0.012, 0.040);  // near-black
  vec3 c1 = vec3(0.380, 0.010, 0.460);  // deep violet
  vec3 c2 = vec3(0.920, 0.055, 0.012);  // vivid crimson
  vec3 c3 = vec3(1.000, 0.520, 0.010);  // orange
  vec3 c4 = vec3(1.000, 0.940, 0.520);  // hot gold
  if (h < 0.25) return mix(c0, c1, h * 4.0);
  if (h < 0.50) return mix(c1, c2, (h - 0.25) * 4.0);
  if (h < 0.75) return mix(c2, c3, (h - 0.50) * 4.0);
  return mix(c3, c4, (h - 0.75) * 4.0);
}

void main() {
  vec2 uv  = gl_FragCoord.xy / u_resolution;
  float asp = u_resolution.x / u_resolution.y;
  float t   = u_time * 0.55;

  // Fire coords: tall vertical stretch so FBM makes column-like features.
  // Subtract time from y → pattern drifts upward.
  vec2 p = vec2(uv.x * asp * 2.2, uv.y * 4.5 - t * 2.0);

  // ── domain warp level 1 — strong horizontal licking ──────────
  // Large x-magnitude warp creates the side-to-side flame motion
  vec2 q = vec2(
    fbm(p * 0.75 + vec2(sin(t*0.28)*1.2, t*0.10)) * 1.5,
    fbm(p * 0.60 + vec2(3.50, 0.0) + vec2(cos(t*0.22)*1.0, t*0.08)) * 1.2
  );

  // ── domain warp level 2 — finer ripping ───────────────────────
  vec2 r = vec2(
    fbm(p * 1.10 + 1.8*q + vec2(1.70, 5.20) + vec2(sin(t*0.18)*0.6, 0.0)),
    fbm(p * 0.90 + 1.8*q + vec2(7.30, 2.40) + vec2(cos(t*0.15)*0.5, 0.0))
  );

  // Main flame field
  float f1 = fbm(p + 1.6*r);

  // Fine flicker layer at higher frequency
  float f2 = fbm(vec2(p.x * 1.6 + q.x * 0.4, p.y * 1.3));

  float f = f1 * 0.70 + f2 * 0.30;

  // ── height falloff: softer exponent so fire fills ~2/3 screen ─
  float yFade = pow(clamp(1.0 - uv.y, 0.0, 1.0), 0.55);
  float heat  = smoothstep(0.14, 0.70, f * yFade);

  // ── sky backdrop ──────────────────────────────────────────────
  vec3 sky = mix(vec3(0.008, 0.015, 0.060), vec3(0.020, 0.035, 0.120), uv.y);

  // ── composite ─────────────────────────────────────────────────
  vec3 col = mix(sky, fireRamp(heat), heat);

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`);
