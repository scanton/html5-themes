// Candlelight — WebGL / GLSL.
//
// A single candle flame glowing in intimate darkness.  Close, warm, still.
//
// Flame SDF: a teardrop-capsule shape (narrow at tip, wide at base) whose
// outline is perturbed by two-octave FBM so it flickers organically.  The
// flame colour transitions from bright near-white at the core through amber
// yellow to deep red-orange at the cooler edges.
//
// Wax column: a pair of symmetric capsule SDFs with a white-cream tint and
// a subtle warm-lit side facing the flame.  Slow drip animations use a
// sin-driven blob that slides down the side.
//
// Light: the flame casts a strong warm-amber cone of radial light that
// fills the lower two-thirds of the frame, falling off as a power of the
// inverse distance and vignetting at the screen edges.  A faint secondary
// FBM texture breaks up the light field so it looks like it's bouncing off
// a slightly textured surface.

import { createGLVariation } from '../engine.js';

export default createGLVariation('Candlelight', `
void main() {
  vec2  uv  = gl_FragCoord.xy / u_resolution;
  float asp = u_resolution.x / u_resolution.y;
  vec2  p   = uv * vec2(asp, 1.0);           // aspect-corrected position
  float t   = u_time * 0.55;

  // Flame anchor: bottom of flame is at screen-space (0.5, 0.38)
  vec2 flameCen = vec2(0.50 * asp, 0.385);

  // ── Flame flicker: FBM-displaced teardrop ─────────────────────
  // Flame-local coordinates (centred at flame base, y up)
  vec2 fp = p - flameCen;

  // Slow drift of the tip (candle flicker)
  float flickX = sin(t * 1.82 + 0.0) * 0.006 + sin(t * 3.17 + 1.0) * 0.003;
  float flickY = sin(t * 1.44 + 2.0) * 0.003;
  fp -= vec2(flickX, flickY);

  // Polar coords in flame space
  float fa  = atan(fp.x, fp.y);      // angle from y-axis (0 = straight up)
  float fr  = length(fp);

  // Teardrop shape: radius varies with angle — wider at base, narrow tip
  float tearR = 0.022 + 0.018 * cos(fa) - 0.006 * cos(2.0 * fa);
  // Stretch it taller than wide
  float stretched = length(vec2(fp.x / 0.65, fp.y / 1.0));

  // FBM perturbation of the outline (flicker)
  float flicker = fbm(fp * 14.0 + vec2(t * 2.2, t * 1.8));
  float flameSDF = stretched - tearR - flicker * 0.012 + 0.006;
  // Cap the flame height
  flameSDF = max(flameSDF, fp.y - 0.072);

  // Flame colour layers (inside SDF < 0 = inside flame)
  vec3 flameCore  = vec3(1.00, 0.98, 0.86);   // bright near-white core
  vec3 flameInner = vec3(1.00, 0.88, 0.30);   // amber yellow
  vec3 flameOuter = vec3(0.96, 0.40, 0.02);   // red-orange edge

  float fInner = smoothstep(-0.012, 0.0,  flameSDF);   // 1 near sdf=0
  float fOuter = smoothstep(-0.030, 0.0,  flameSDF);
  float fCore  = smoothstep(-0.005, 0.0,  flameSDF);

  // Build flame colour from inside out
  vec3 flameCol = mix(flameCore,  flameInner, fCore);
  flameCol      = mix(flameCol,   flameOuter, fInner);
  // Add a faint blue at the very base (combustion zone)
  float blueBase = smoothstep(0.010, 0.0, abs(fp.y) + fr * 0.3) * (1.0 - fOuter);
  flameCol = mix(flameCol, vec3(0.60, 0.70, 1.00), blueBase * 0.35);

  float flameMask = 1.0 - smoothstep(-0.002, 0.014, flameSDF);

  // ── Wax candle body ───────────────────────────────────────────
  float waxW = 0.028;   // half-width of candle column
  float waxTop = flameCen.y;
  float waxBot = 0.0;

  // Two-capsule column (slight taper)
  float waxSDF = abs(p.x - flameCen.x) - waxW;
  waxSDF = max(waxSDF, -(p.y - waxBot));     // no wax below bottom
  waxSDF = max(waxSDF, p.y - waxTop);        // no wax above flame base

  // Slow drip on left side
  float dripT  = fract(t * 0.14 + 0.3);     // 0→1 per drip cycle
  float dripY  = waxTop - dripT * (waxTop - waxBot);
  vec2  dripP  = vec2(p.x - (flameCen.x - waxW + 0.008), p.y - dripY);
  float dripR  = 0.008 * sin(dripT * 3.14159);   // blob grows then shrinks
  float dripSDF= length(dripP) - dripR;
  waxSDF = min(waxSDF, dripSDF);

  float waxMask = 1.0 - smoothstep(-0.002, 0.004, waxSDF);
  // Lit side of wax: brighter facing flame
  float litSide = smoothstep(-waxW, waxW, p.x - flameCen.x) * 0.4;
  vec3  waxCol  = mix(vec3(0.92, 0.88, 0.80), vec3(1.00, 0.94, 0.84), litSide);

  // ── Background: warm radial candlelight ───────────────────────
  float dist = length(p - flameCen);

  // Core glow: strong power falloff from flame
  float glow = 0.28 / (1.0 + dist * dist * 22.0);

  // Wide ambient fill: the room lit by candlelight
  float ambient = 0.12 / (1.0 + dist * 4.5);

  // FBM surface texture breaks up the flat light field
  float surf = fbm(p * 3.5 + vec2(t * 0.08, 0.0));
  float lightField = (glow + ambient) * (0.72 + 0.28 * surf);

  // Colour: hottest near flame, cooler amber at distance
  vec3 lightNear = vec3(0.88, 0.56, 0.12);
  vec3 lightFar  = vec3(0.22, 0.08, 0.01);
  vec3 col = mix(lightFar, lightNear, clamp(lightField * 3.5, 0.0, 1.0));
  col = mix(col, lightNear * 1.4, clamp(lightField * 1.2, 0.0, 1.0));

  // Edge vignette — candlelight doesn't reach the corners
  float vig = length((uv - 0.5) * vec2(asp, 1.0));
  col *= pow(1.0 - smoothstep(0.3, 1.2, vig), 1.4);

  // ── Composite wax then flame over background ──────────────────
  col = mix(col, waxCol, waxMask);
  col = mix(col, flameCol, flameMask);

  // Bloom: add flame glow over everything
  float bloom = exp(-dist * dist * 420.0) * 0.65;
  col += vec3(1.00, 0.78, 0.28) * bloom;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`);
