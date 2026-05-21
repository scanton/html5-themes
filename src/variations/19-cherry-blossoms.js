// Cherry Blossoms — WebGL / GLSL.
//
// Soft pink petals drift and tumble through a hazy spring sky.
//
// Petal SDF: an ellipse tilted at 20° with a slight pinch at the base to
// give the classic rounded-teardrop petal shape.  Each petal spins slowly
// as it falls (Z-axis rotation) and rocks gently around the X-axis
// (perspective squish on Y) to catch the breeze.
//
// Same 1-D column strip particle system as Snowfall.  Three depth layers:
// far (small, slow, pale), mid (medium), near (large, vivid, faster).
//
// Background: a luminous sky wash from warm blush-white at the horizon to
// soft powder-blue at the zenith, with layered FBM cloud haze, a subtle
// hint of distant branches at the edges, and a fine pollen-sparkle layer.

import { createGLVariation } from '../engine.js';

export default createGLVariation('Cherry Blossoms', `
// Petal SDF: rounded teardrop / ellipse with pinched base.
// p should be normalised so the petal fits roughly in [-0.6, 0.6] x [-1, 1].
float petalSDF(vec2 p) {
  // Pinch the base by squishing x near the bottom
  float pinch = 1.0 + smoothstep(0.0, -0.8, p.y) * 1.4;
  vec2  q     = vec2(p.x * pinch, p.y);

  // Rounded ellipse: wider than tall
  float a = 0.55, b = 0.90;
  return length(vec2(q.x / a, (q.y + 0.08) / b)) - 1.0;
}

float petalLayer(vec2 uv, float t, float asp,
                 float numS, float spd, float wnd, float petR,
                 float seed, float rockAmt) {
  float bright = 0.0;
  float sx     = uv.x * numS;
  float cell_x = floor(sx);

  for (int i = -2; i <= 2; i++) {
    float nc = cell_x + float(i);
    for (int k = 0; k < 2; k++) {
      float sk = float(k) * 29.11 + seed;

      float rx  = hash(vec2(nc + 7.30, sk));   // x offset within strip
      float ry  = hash(vec2(nc,         sk));   // initial y phase
      float rs  = hash(vec2(nc +  4.91, sk));   // speed var
      float rw  = hash(vec2(nc + 11.37, sk));   // wind var
      float rp  = hash(vec2(nc + 19.43, sk));   // wind phase
      float rr  = hash(vec2(nc + 33.71, sk));   // Z-rotation start
      float rf  = hash(vec2(nc + 41.73, sk));   // rock phase
      float rs2 = hash(vec2(nc + 57.19, sk));   // rock speed

      float py_raw = fract(ry + t * spd * (0.80 + rs * 0.40));
      float py     = 1.10 - py_raw * 1.20;

      float gust   = sin(t * 0.18 + seed * 1.91) * wnd;
      float windOff= gust + sin(t * (0.22 + rw * 0.36) + rp * 6.28) * wnd * 0.50;
      float px     = (nc + rx) / numS + windOff;

      vec2 diff = vec2((uv.x - px) * asp, uv.y - py);

      if (length(diff) < petR * 2.0) {
        // Z-axis spin (tumbling fall)
        float spinSpd = 0.55 + rs2 * 0.60;
        float spinAng = t * spinSpd + rr * 6.28318;
        float cr = cos(spinAng), sr = sin(spinAng);

        // X-axis rock (perspective squish on Y): petal tilts toward viewer
        float rockSpd  = 0.30 + rs2 * 0.26;
        float squish   = abs(cos(t * rockSpd + rf * 6.28318));
        squish = mix(1.0, max(squish, 0.12), rockAmt);

        vec2 lp = diff / petR;
        lp = vec2(cr * lp.x + sr * lp.y, -sr * lp.x + cr * lp.y);  // spin
        lp.y /= (squish + 0.001);                                      // rock

        float sdf = petalSDF(lp);
        float aa  = 0.10;
        bright += smoothstep(aa, -aa, sdf);
      }
    }
  }
  return clamp(bright, 0.0, 1.0);
}

void main() {
  vec2  uv  = gl_FragCoord.xy / u_resolution;
  float asp = u_resolution.x / u_resolution.y;
  vec2  p   = uv * vec2(asp, 1.0);
  float t   = u_time * 0.22;

  // ── Spring sky: warm horizon → cool zenith ────────────────────
  vec3 skyBot = vec3(0.98, 0.88, 0.88);   // warm blush-white at horizon
  vec3 skyMid = vec3(0.85, 0.88, 0.96);   // soft lavender-blue
  vec3 skyTop = vec3(0.65, 0.78, 0.96);   // clear spring blue

  float sv = uv.y;
  vec3 col = mix(skyBot, skyMid, smoothstep(0.0, 0.45, sv));
  col      = mix(col,   skyTop, smoothstep(0.40, 1.0,  sv));

  // Hazy cloud layer: soft FBM washes
  float cloud1 = fbm(p * 1.6 + vec2(t * 0.05, 0.0));
  float cloud2 = fbm(p * 3.0 - vec2(t * 0.04, 0.0) + vec2(3.2, 1.8));
  col += (cloud1 * 0.10 + cloud2 * 0.05) * vec3(1.0, 0.94, 0.96);

  // Pollen sparkle: tiny golden glints
  float pollen = fbm(p * 11.0 + vec2(t * 0.28, t * 0.22));
  pollen = pow(max(pollen - 0.67, 0.0) * 4.5, 3.5);
  col += pollen * vec3(1.0, 0.88, 0.62) * 0.40;

  // Subtle branch silhouettes bleeding in from left/right edges
  float edgeL = smoothstep(0.18 * asp, 0.0, p.x);
  float edgeR = smoothstep((1.0 - 0.18) * asp, asp, p.x);
  float branchNoise = fbm(p * 4.5 + vec2(0.0, t * 0.02));
  col = mix(col, vec3(0.38, 0.22, 0.28),
            (edgeL + edgeR) * branchNoise * 0.45);

  // ── Petal layers ──────────────────────────────────────────────
  // Far: 55 strips × 2 = 110 tiny petals, no rock
  float far  = petalLayer(uv, t, asp, 55.0, 0.020, 0.012, 0.0042, 1.00, 0.0);
  // Mid: 22 strips × 2 = 44 petals, subtle rock
  float mid  = petalLayer(uv, t, asp, 22.0, 0.045, 0.028, 0.0100, 5.37, 0.45);
  // Near: 9 strips × 2 = 18 large petals, full rock
  float near = petalLayer(uv, t, asp,  9.0, 0.088, 0.055, 0.0240, 9.81, 1.0);

  // Petal tints: far = very pale, mid = soft pink, near = vivid blush
  vec3 petFar  = vec3(0.98, 0.88, 0.92);
  vec3 petMid  = vec3(0.97, 0.72, 0.80);
  vec3 petNear = vec3(0.95, 0.58, 0.70);

  col = mix(col, petFar,  far  * 0.55);
  col = mix(col, petMid,  mid  * 0.80);
  col = mix(col, petNear, near);

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`);
