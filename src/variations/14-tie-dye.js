// Tie Dye — WebGL / GLSL.
//
// Technique: three ring systems (one fixed at centre, two orbiting slowly)
// generate expanding concentric wave fronts.  Their weighted interference
// drives the HSV hue — so the hue shifts in bands that expand outward and
// slowly cycle through the full rainbow.
//
// Two levels of FBM domain warp make the rings organic and tie-dye-like
// rather than perfectly circular.  A polar-angle spiral component adds the
// characteristic swirling rotation seen in real tie-dye.
//
// Colour: very high saturation (0.88-0.96), full-spectrum hue cycling,
// value modulated by the ring pattern so bands have crisp bright centres
// and softer transitions.

import { createGLVariation } from '../engine.js';

export default createGLVariation('Tie Dye', `
// Standard HSV → RGB
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
  vec2 uv  = gl_FragCoord.xy / u_resolution;
  float asp = u_resolution.x / u_resolution.y;
  float t   = u_time * 0.18;

  // Centred, aspect-corrected
  vec2 p = (uv - 0.5) * vec2(asp, 1.0);

  // ── Two-level FBM warp — makes rings wavy and organic ────────
  vec2 q = vec2(
    fbm(p * 1.5 + vec2(t * 0.38, 0.0)),
    fbm(p * 1.5 + vec2(0.0, t * 0.30) + vec2(5.2, 3.7))
  );
  vec2 r = vec2(
    fbm(p * 2.4 + 2.8*q + vec2(t * 0.22, t * 0.16)),
    fbm(p * 2.4 + 2.8*q + vec2(-t * 0.18, t * 0.25) + vec2(2.8, 7.1))
  );
  vec2 wp = p + r * 0.32;

  // ── Three ring centres ────────────────────────────────────────
  // Primary: fixed at origin — drives the "expand from centre" feel
  float d1 = length(wp);
  // Secondary: two centres orbit slowly, different radii & speeds
  vec2 c2 = vec2(cos(t * 1.28) * 0.30, sin(t * 0.98) * 0.26);
  vec2 c3 = vec2(sin(t * 0.88 + 2.0) * 0.28, cos(t * 1.18 + 1.6) * 0.24);
  float d2 = length(wp - c2);
  float d3 = length(wp - c3);

  // ── Expanding ring interference ───────────────────────────────
  float freq = 8.5;    // rings per unit (controls band density)
  float spd  = 4.2;    // outward expansion speed

  float ring1 = sin(d1 * freq        - t * spd)        * 0.5 + 0.5;
  float ring2 = sin(d2 * freq * 0.91 - t * spd * 0.87 + 1.57) * 0.5 + 0.5;
  float ring3 = sin(d3 * freq * 0.86 - t * spd * 0.94 + 3.14) * 0.5 + 0.5;

  // Weighted blend — primary ring dominates, others add complexity
  float bands = ring1 * 0.55 + ring2 * 0.28 + ring3 * 0.17;

  // ── Polar spiral: the classic tie-dye swirl ───────────────────
  float angle  = atan(wp.y, wp.x);
  float spiral = sin(angle * 4.0 + length(wp) * 5.5 - t * 2.8) * 0.5 + 0.5;

  // ── HSV colour assembly ───────────────────────────────────────
  // Hue: rings sweep through the full rainbow + slow global cycle
  float hue = fract(bands * 0.84 + spiral * 0.09 + t * 0.07);

  // Saturation: vivid, lifted slightly by the spiral component
  float sat = 0.88 + spiral * 0.08;

  // Value: bright at ring peaks, slightly darker in troughs
  float val = 0.76 + bands * 0.22;

  vec3 col = hsv2rgb(vec3(hue, sat, val));

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`);
