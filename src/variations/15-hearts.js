// Hearts — WebGL / GLSL.
//
// Heart shapes drift downward through a dreamy pink environment.
// No rotation — hearts fall face-on, gently swaying side to side.
//
// Heart SDF: algebraic form f(x,y) = (x²+y²-1)³ - x²y³.
// Points where f < 0 are inside the heart.  Smooth anti-aliasing via
// the gradient magnitude so the outline is crisp at any size.
//
// Particle system: same 1-D column strip design as Snowfall.  Full-screen-
// height y travel with ±12% off-screen margin so the fract() wrap is always
// invisible.  Two staggered hearts per strip, ±2 strip neighbours checked.
//
// Background: pink-rose radial gradient (warm blush at centre → deep magenta
// at edges) layered with slow drifting FBM cloud swirls and a fine glitter
// sparkle layer.
//
// Three depth layers (far/mid/near) vary density, speed, size, and tint.

import { createGLVariation } from '../engine.js';

export default createGLVariation('Hearts', `
// ── Heart SDF (algebraic) ─────────────────────────────────────────
// Returns a signed-like scalar: negative inside the heart.
// p should be normalised so the heart fits roughly in [-1,1]²;
// the heart tip is at the bottom, cleft at the top, width ≈ 2.
// We scale/flip so the natural orientation looks like a classic heart.
float heartSDF(vec2 p) {
  // Natural orientation: lobes at top (y > 0), tip at bottom (y < 0).
  // Shift up slightly so the visual centre of the heart aligns with the
  // particle position rather than the geometric centroid.
  p.y -= 0.20;

  float a = p.x * p.x + p.y * p.y - 1.0;
  return a * a * a - p.x * p.x * p.y * p.y * p.y;
}

// ── One depth layer ───────────────────────────────────────────────
// numS  = horizontal strips
// spd   = fall speed (screen-heights / sec)
// wnd   = sway amplitude
// hrtR  = heart half-size in screen fraction
// seed  = layer seed
// tint  = colour of hearts in this layer
float heartLayer(vec2 uv, float t, float asp,
                 float numS, float spd, float wnd, float hrtR,
                 float seed, out vec3 layerCol) {
  float sx     = uv.x * numS;
  float cell_x = floor(sx);
  float gust   = sin(t * 0.15 + seed * 1.73) * wnd * 0.4;
  float bright = 0.0;
  layerCol = vec3(0.0);

  for (int i = -2; i <= 2; i++) {
    float nc = cell_x + float(i);
    for (int k = 0; k < 2; k++) {
      float sk = float(k) * 27.53 + seed;

      float rx = hash(vec2(nc + 11.30, sk));   // x offset within strip
      float ry = hash(vec2(nc,          sk));   // initial y phase
      float rs = hash(vec2(nc +  4.91,  sk));   // speed variation
      float rw = hash(vec2(nc +  9.17,  sk));   // sway variation
      float rp = hash(vec2(nc + 19.43,  sk));   // sway phase
      float rc = hash(vec2(nc + 33.71,  sk));   // colour variation

      // y falls from 1.12 (above) to -0.12 (below), wrap off-screen
      float py_raw = fract(ry + t * spd * (0.80 + rs * 0.40));
      float py = 1.12 - py_raw * 1.24;

      // Gentle sway — slower and smaller than snowflakes
      float windOff = gust + sin(t * (0.18 + rw * 0.28) + rp * 6.28) * wnd * 0.50;
      float px = (nc + rx) / numS + windOff;

      vec2 diff = vec2((uv.x - px) * asp, uv.y - py);

      if (length(diff) < hrtR * 2.2) {
        // Map diff → heart local coords (heart fits in roughly ±1.2 x ±1.0)
        vec2 lp = diff / hrtR;

        float f  = heartSDF(lp);
        float aa = 0.15;   // AA width in SDF units

        // Gradient magnitude for consistent AA regardless of scale
        float eps = 0.01;
        float fx  = heartSDF(lp + vec2(eps, 0.0));
        float fy  = heartSDF(lp + vec2(0.0, eps));
        float grad = length(vec2(fx - f, fy - f)) / eps;
        grad = max(grad, 0.5);

        float edge = f / grad;   // distance-to-edge in world units
        float alpha = smoothstep(aa, -aa, edge);

        if (alpha > 0.0) {
          // Colour: mix between deep rose and soft pink based on rc
          vec3 deepRose  = vec3(0.92, 0.20, 0.42);
          vec3 softPink  = vec3(1.00, 0.65, 0.78);
          vec3 hotPink   = vec3(0.97, 0.30, 0.58);
          vec3 hCol = mix(deepRose, softPink, rc * 0.7);
          hCol = mix(hCol, hotPink, rc * rc * 0.4);

          // Subtle inner highlight near the top of the heart
          float highlight = smoothstep(0.3, -0.3, lp.y - 0.5) * 0.3;
          hCol = mix(hCol, vec3(1.0, 0.88, 0.93), highlight);

          bright   += alpha;
          layerCol += hCol * alpha;
        }
      }
    }
  }
  bright = clamp(bright, 0.0, 1.0);
  if (bright > 0.001) layerCol /= bright;
  return bright;
}

void main() {
  vec2  uv  = gl_FragCoord.xy / u_resolution;
  float asp = u_resolution.x / u_resolution.y;
  vec2  p   = uv * vec2(asp, 1.0);
  float t   = u_time * 0.25;

  // ── Dreamy pink background ────────────────────────────────────
  // Radial gradient: warm blush at centre, deeper rose/magenta at edges
  vec2  cp    = uv - 0.5;
  float radial = length(cp * vec2(asp, 1.0)) * 1.30;

  vec3 bgCentre = vec3(1.00, 0.82, 0.88);   // warm blush white-pink
  vec3 bgMid    = vec3(0.96, 0.55, 0.72);   // soft rose
  vec3 bgEdge   = vec3(0.64, 0.14, 0.34);   // deep magenta rose

  vec3 col = mix(bgCentre, bgMid,  smoothstep(0.0, 0.55, radial));
  col      = mix(col,      bgEdge, smoothstep(0.45, 1.10, radial));

  // Slow drifting cloud swirls — add softness and depth
  float cloud1 = fbm(p * 1.8 + vec2( t * 0.06, t * 0.04));
  float cloud2 = fbm(p * 3.2 + vec2(-t * 0.05, t * 0.07) + vec2(4.3, 2.1));
  col += (cloud1 * 0.12 + cloud2 * 0.06) * vec3(1.0, 0.8, 0.88);

  // Fine glitter sparkles
  float sparkle = fbm(p * 7.5 + vec2(t * 0.32, -t * 0.28));
  sparkle = pow(max(sparkle - 0.65, 0.0) * 4.5, 3.5);
  col += sparkle * vec3(1.0, 0.90, 0.95) * 0.55;

  // ── Three depth layers ────────────────────────────────────────
  // Far:  many small, slow, barely-visible hearts
  // Mid:  medium hearts, main visual layer
  // Near: few large, fast, vivid hearts (popping in foreground)

  vec3 farCol, midCol, nearCol;

  float far  = heartLayer(uv, t, asp, 50.0, 0.022, 0.012, 0.0060, 2.10, farCol);
  float mid  = heartLayer(uv, t, asp, 22.0, 0.050, 0.028, 0.0130, 5.87, midCol);
  float near = heartLayer(uv, t, asp,  9.0, 0.095, 0.048, 0.0300, 9.41, nearCol);

  // Far hearts are muted/translucent — they recede into the background
  farCol = mix(farCol, col, 0.35);
  col = mix(col, farCol,  far  * 0.50);
  col = mix(col, midCol,  mid  * 0.82);
  col = mix(col, nearCol, near);

  // Soft vignette to keep eyes on the centre
  float vig = pow(clamp(1.0 - radial * 0.65, 0.0, 1.0), 0.5);
  col *= 0.82 + 0.18 * vig;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`);
