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
  float t   = u_time * 0.14;

  // Light source: just above the screen, centred
  vec2  src     = vec2(0.50 * asp, 1.15);
  vec2  toSrc   = p - src;
  float rayDist = length(toSrc);
  float rayAngle= atan(toSrc.x, -toSrc.y);   // 0 = straight down from source

  // ── Bright sky background ─────────────────────────────────────
  vec3 skyTop = vec3(0.98, 0.97, 0.95);   // warm near-white
  vec3 skyBot = vec3(0.88, 0.92, 1.00);   // cool blue tint at bottom
  vec3 col    = mix(skyTop, skyBot, uv.y * 0.7);

  // Source radial glow
  col += vec3(1.00, 0.96, 0.82) * 0.55 * exp(-rayDist * rayDist * 3.5);

  // Soft cloud haze
  float haze = fbm(p * 1.8 + vec2(t * 0.06, 0.0));
  col += haze * 0.06 * vec3(1.0, 0.95, 0.90);

  // ── Ray angular density ───────────────────────────────────────
  // Product of two sinusoids at coprime frequencies → irregular beams
  float freq1 = 7.0;
  float freq2 = 11.0;

  // FBM warp of the angle so edges are organic, not ruler-straight
  float angleWarp = fbm(vec2(rayAngle * 1.6 + t * 0.22,
                              rayDist  * 2.2 + t * 0.18)) * 0.18;
  float warpedAngle = rayAngle + angleWarp;

  // Phase-shifted oscillations that drift over time
  float phase1 = t * 0.28;
  float phase2 = t * 0.19 + 1.57;

  float s1 = sin(warpedAngle * freq1 + phase1) * 0.5 + 0.5;
  float s2 = sin(warpedAngle * freq2 - phase2) * 0.5 + 0.5;
  float rayDensity = pow(s1 * s2, 1.6);   // combined beam mask, sharpened

  // ── Ray radial falloff ────────────────────────────────────────
  // Rays are bright near the source, fade with distance
  float radFade = exp(-rayDist * 1.8);
  // Also fade the very centre (source corona) to avoid a hard bright dot
  float innerFade = smoothstep(0.0, 0.18, rayDist);

  float rayMask = rayDensity * radFade * innerFade;

  // ── Rainbow colour along each ray ────────────────────────────
  // Primary hue: angle-based spectrum that rotates slowly
  float hue1 = fract(warpedAngle / 6.28318 + t * 0.08);
  // Secondary hue: faster radial shimmer layer
  float hue2 = fract(warpedAngle / 6.28318 - rayDist * 0.8 + t * 0.22);

  vec3 rayCol1 = hsv2rgb(vec3(hue1, 0.72, 1.0));
  vec3 rayCol2 = hsv2rgb(vec3(hue2, 0.55, 1.0));
  vec3 rayCol  = mix(rayCol1, rayCol2, 0.35);

  // Desaturate rays closer to the source (bleached by brightness)
  float desat = exp(-rayDist * 4.5);
  rayCol = mix(rayCol, vec3(1.0), desat * 0.55);

  // ── Composite ─────────────────────────────────────────────────
  // Add rays over bright background (additive blend)
  col += rayCol * rayMask * 0.72;

  // Mist at the base — pastel ground haze
  float mistY = smoothstep(0.25, 0.0, uv.y);
  float mistHue = fract(t * 0.06);
  vec3  mistCol = hsv2rgb(vec3(mistHue, 0.28, 1.0));
  col = mix(col, mistCol, mistY * 0.35);

  // Soft sparkle on the rays
  float sparkle = fbm(p * 10.0 + vec2(t * 0.35, -t * 0.28));
  sparkle = pow(max(sparkle - 0.65, 0.0) * 4.5, 3.0);
  col += sparkle * rayMask * 0.55;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`);
