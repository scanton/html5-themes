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
// Carbonation: hash-grid rising bubbles in two sizes.  Each bubble is a
// bright ring (hollow circle) that drifts upward with slight lateral wobble.
// Bubbles fade out as they enter the foam layer.
//
// Glass walls: subtle edge vignette suggests the curved glass sides.

import { createGLVariation } from '../engine.js';

export default createGLVariation('Beer', `
// Rising carbonation bubble layer — hollow ring particles
float bubbleLayer(vec2 uv, float t, float asp,
                  float cellsX, float spd, float bblR, float seed) {
  float cellsY = cellsX / asp;
  vec2  sc     = vec2(uv.x * cellsX, uv.y * cellsY);
  vec2  cell   = floor(sc);
  vec2  loc    = fract(sc);
  float bright = 0.0;
  for (int j = -1; j <= 1; j++) {
  for (int i = -1; i <= 1; i++) {
    vec2 nc  = cell + vec2(float(i), float(j));
    float rx = hash(nc + vec2(seed * 3.17, seed * 1.07));
    float ry = hash(nc + vec2(seed * 0.91, seed * 2.63));
    float rs = hash(nc + vec2(seed * 2.03, seed * 4.11));   // speed variation
    float rp = hash(nc + vec2(seed * 6.31, seed * 0.73));   // wobble phase

    // Rise upward: py increases with time, wraps 0 → 1 → 0
    float py = fract(ry + t * spd * (0.72 + rs * 0.56));

    // Very slight lateral wobble
    float px = fract(rx + sin(t * 0.7 + rp * 6.28) * 0.012);

    vec2  diff = loc - vec2(px, py) + vec2(float(i), float(j));
    vec2  sd   = vec2(diff.x / cellsX, diff.y * asp / cellsX);
    float d    = length(sd);

    // Hollow ring: void at center, bright annulus, soft outer edge
    float voidMask = 1.0 - smoothstep(0.0, bblR * 0.35, d);  // 1 at center → 0 at 0.35R
    float outerMask = 1.0 - smoothstep(bblR * 0.65, bblR, d); // 1 inside, 0 outside bblR
    bright += outerMask * (1.0 - voidMask);
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
  vec3 beerBright = vec3(1.00, 0.84, 0.28);   // backlit highlight (center column)

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
  // Fine bubbles (many, small)
  float bbl1 = bubbleLayer(uv, t, asp, 24.0, 0.095, 0.0028, 2.11);
  // Medium bubbles (fewer, larger)
  float bbl2 = bubbleLayer(uv, t, asp, 11.0, 0.065, 0.0058, 6.47);

  // Bubbles only in liquid region, fading as they approach foam
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
