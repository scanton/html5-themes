// Beer — WebGL / GLSL.
//
// Close-up view of a poured lager: golden amber liquid fills the lower ~65%,
// creamy foam head sits above it with an irregular wavy boundary.
//
// Liquid: backlit amber/gold gradient (bright center column where light passes
// through, darker at glass edges).  Subtle FBM texture simulates light
// scattering through the liquid.
//
// Foam: two-octave FBM produces lumpy cream-white bubbles with shadowed
// hollows.  Density increases toward the top so it looks thick and fresh.
//
// Carbonation: 1-D column strip particle system — each bubble travels in
// full screen-space y from below the visible area to above it, so the
// fract() wrap always happens off-screen (no mid-screen pop-in).
// Two staggered bubbles per column keep density convincing.
// Bubbles are hollow rings.  The foam mask fades them out as they rise
// into the head.
//
// Glass walls: subtle edge vignette suggests the curved glass sides.

import { createGLVariation } from '../engine.js';

export default createGLVariation('Beer', `
// Rising carbonation bubbles — hollow ring particles.
// Particles travel full screen height; wrap happens off-screen.
// numCols = horizontal columns.  spd = rise speed.  bblR = ring radius.
float bubbleLayer(vec2 uv, float t, float asp,
                  float numCols, float spd, float bblR, float seed) {
  float sx     = uv.x * numCols;
  float cell_x = floor(sx);
  float bright = 0.0;

  // ±2 column neighbours to catch laterally-wobbling bubbles
  for (int i = -2; i <= 2; i++) {
    float nc = cell_x + float(i);

    // Two staggered bubbles per column
    for (int k = 0; k < 2; k++) {
      float sk = float(k) * 29.37 + seed;

      float rx = hash(vec2(nc + 13.10, sk));   // x jitter within column
      float ry = hash(vec2(nc,          sk));   // initial y phase
      float rs = hash(vec2(nc +  2.31,  sk));   // speed variation
      float rp = hash(vec2(nc +  4.73,  sk));   // wobble phase

      // y rises in full screen space: from -0.12 (below screen) to 1.12 (above).
      // fract() wrap jumps from 1.12 → -0.12 — both off-screen, no pop-in.
      float py_raw = fract(ry + t * spd * (0.72 + rs * 0.56));
      float py = -0.12 + py_raw * 1.24;

      // Very slight lateral wobble
      float px = (nc + rx) / numCols + sin(t * 0.7 + rp * 6.28) * 0.010;

      vec2  diff = vec2((uv.x - px) * asp, uv.y - py);
      float d    = length(diff);

      // Hollow ring: dark void at centre, bright annulus, soft outer edge
      float voidM  = 1.0 - smoothstep(0.0,        bblR * 0.35, d);
      float outerM = 1.0 - smoothstep(bblR * 0.65, bblR,       d);
      bright += outerM * (1.0 - voidM);
    }
  }
  return clamp(bright, 0.0, 1.0);
}

void main() {
  vec2  uv  = gl_FragCoord.xy / u_resolution;
  float asp = u_resolution.x / u_resolution.y;
  vec2  p   = uv * vec2(asp, 1.0);
  float t   = u_time * 0.38;

  // ── Beer liquid colour — golden lager, backlit ─────────────────
  vec3 beerDeep   = vec3(0.58, 0.26, 0.02);   // deep amber (shadows/edges)
  vec3 beerMid    = vec3(0.90, 0.56, 0.06);   // warm golden mid-tone
  vec3 beerBright = vec3(1.00, 0.84, 0.28);   // backlit highlight (centre column)

  // Backlit: bright narrow column in the centre, dark at sides
  float cx = abs(uv.x - 0.50) * 2.0;
  float backlit = pow(clamp(1.0 - cx, 0.0, 1.0), 1.6);

  vec3 beerCol = mix(beerDeep, beerMid, backlit * 0.68);
  beerCol      = mix(beerCol, beerBright, backlit * backlit * 0.42);

  // Subtle liquid-body FBM — light scattering makes the beer translucent
  float beerFBM = fbm(p * 2.6 + vec2(t * 0.11, -t * 0.07));
  beerCol = mix(beerCol * 0.90, beerCol * 1.10, smoothstep(0.38, 0.64, beerFBM));

  // ── Foam boundary — wavy, organic ─────────────────────────────
  float foamBase = 0.66;
  float foamWave = fbm(vec2(p.x * 3.4, t * 0.18)) * 0.08;
  float foamEdge = foamBase + foamWave;

  // Smooth transition: 0 = pure beer, 1 = full foam
  float inFoam = smoothstep(foamEdge - 0.025, foamEdge + 0.045, uv.y);

  // ── Foam texture — lumpy cream-white bubbles ───────────────────
  float fn1 = fbm(p * 5.2 + vec2(t * 0.09, 0.0));       // large bubble structure
  float fn2 = fbm(p * 10.5 - vec2(0.0, t * 0.055));      // fine bubble detail

  float foamHeight  = clamp((uv.y - foamEdge) * 4.5, 0.0, 1.0);  // denser at top
  float foamDensity = smoothstep(0.28, 0.72, fn1 * 0.62 + fn2 * 0.38 + foamHeight * 0.18);

  vec3 foamLight  = vec3(0.97, 0.95, 0.90);   // creamy white peak
  vec3 foamShadow = vec3(0.72, 0.70, 0.66);   // shadow between foam bubbles
  vec3 foamCol    = mix(foamShadow, foamLight, foamDensity);

  // ── Carbonation bubbles ────────────────────────────────────────
  // Fine bubbles: 22 columns × 2 = 44 bubbles, small rings
  float bbl1 = bubbleLayer(uv, t, asp, 22.0, 0.10, 0.0035, 2.11);
  // Medium bubbles: 11 columns × 2 = 22 bubbles, larger rings
  float bbl2 = bubbleLayer(uv, t, asp, 11.0, 0.07, 0.0065, 6.47);

  // Mask: only in liquid region, fade out near foam boundary
  float bblMask = (1.0 - inFoam) * smoothstep(0.0, 0.04, uv.y);
  vec3  bblCol  = mix(beerBright * 1.25, vec3(1.0, 0.97, 0.88), 0.45);
  beerCol = mix(beerCol, bblCol, clamp(bbl1 + bbl2, 0.0, 1.0) * bblMask * 0.65);

  // ── Glass walls — subtle edge vignette ────────────────────────
  float wallFade = pow(clamp(1.0 - cx, 0.0, 1.0), 0.35);
  beerCol  *= 0.62 + 0.38 * wallFade;
  foamCol  *= 0.78 + 0.22 * wallFade;

  // ── Composite ─────────────────────────────────────────────────
  vec3 col = mix(beerCol, foamCol, inFoam);

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`);
