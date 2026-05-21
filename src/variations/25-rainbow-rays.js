// Rainbow Rays — WebGL / GLSL.
//
// Ethereal crepuscular light rays (god rays) sweep slowly across a bright
// dreamlike sky, cycling through the full spectrum.
//
// Technique: rays are angular sectors in polar coordinates around a light
// source above the screen centre.  The angular density is modulated by the
// product of two sinusoids at different frequencies, creating an irregular
// bundle of beams that never look mechanical.  FBM perturbation of both
// the angle and the radius makes each ray's edges organic and softly
// feathered.
//
// Colour: each angular position maps to a hue via a slow-cycling HSV rainbow
// so adjacent rays are neighbouring hues, creating smooth spectral banding.
// A fast-cycling secondary hue layer adds iridescent shimmer.
//
// Background: bright luminous white-gold sky with a soft radial glow at the
// light source, layered cloud-haze FBM, and a faint pastel mist at the base.

import { createGLVariation } from '../engine.js';

export default createGLVariation('Rainbow Rays', `
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
  vec3 pp = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(pp - K.xxx, 0.0, 1.0), c.y);
}

void main() {
  vec2  uv  = gl_FragCoord.xy / u_resolution;
  float asp = u_resolution.x / u_resolution.y;
  vec2  p   = uv * vec2(asp, 1.0);
  float t   = u_time * 0.50;   // global time — fast enough for visible sweep

  // Light source: just above the screen, centred
  vec2  src      = vec2(0.50 * asp, 1.10);
  vec2  toSrc    = p - src;
  float rayDist  = length(toSrc);
  float rayAngle = atan(toSrc.x, -toSrc.y);

  // ── Deep dusk background — rays need darkness to be visible ───
  vec3 skyTop = vec3(0.02, 0.01, 0.08);
  vec3 skyBot = vec3(0.06, 0.03, 0.14);
  vec3 col    = mix(skyTop, skyBot, pow(1.0 - uv.y, 1.4));

  // Subtle drifting cloud texture
  float cloud = fbm(p * 1.4 + vec2(t * 0.08, 0.0));
  col += cloud * 0.04 * vec3(0.30, 0.15, 0.50);

  // ── Ray angular density ───────────────────────────────────────
  // FBM warp of the angle — drifts visibly over time
  float angleWarp   = fbm(vec2(rayAngle * 1.8 + t * 0.35,
                               rayDist  * 2.5 + t * 0.28)) * 0.22;
  float warpedAngle = rayAngle + angleWarp;

  // Product of two coprime sinusoids — phases sweep at a visible rate
  float s1 = sin(warpedAngle * 7.0  + t * 0.80) * 0.5 + 0.5;
  float s2 = sin(warpedAngle * 11.0 - t * 0.55 + 1.57) * 0.5 + 0.5;
  float rayDensity = pow(s1 * s2, 1.4);

  // ── Ray radial falloff ────────────────────────────────────────
  float radFade   = exp(-rayDist * 1.4);
  float innerFade = smoothstep(0.0, 0.15, rayDist);
  float rayMask   = rayDensity * radFade * innerFade;

  // ── Rainbow colour — HSV spectrum cycling with the sweep ──────
  float hue1   = fract(warpedAngle / 6.28318 + t * 0.12);
  float hue2   = fract(warpedAngle / 6.28318 - rayDist * 0.6 + t * 0.20);
  vec3 rayCol1 = hsv2rgb(vec3(hue1, 0.90, 1.0));
  vec3 rayCol2 = hsv2rgb(vec3(hue2, 0.70, 1.0));
  vec3 rayCol  = mix(rayCol1, rayCol2, 0.30);

  // Bleach near source — pure white corona
  float desat = exp(-rayDist * 3.5);
  rayCol = mix(rayCol, vec3(1.0), desat * 0.60);

  // ── Composite — additive over dark background ──────────────────
  col += rayCol * rayMask * 1.20;

  // Bright source corona glow
  col += vec3(0.90, 0.80, 1.00) * 0.50 * exp(-rayDist * rayDist * 4.0);

  // Soft colour mist at the base, hue cycling
  float mistY   = smoothstep(0.30, 0.0, uv.y);
  float mistHue = fract(t * 0.10);
  col = mix(col, hsv2rgb(vec3(mistHue, 0.55, 0.60)), mistY * 0.40);

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`);
