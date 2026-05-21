// Autumn Leaves — WebGL / GLSL.
//
// Maple and oak leaves tumble through a warm autumn sunset.
//
// Leaf SDF: a five-lobe maple leaf built from overlapping ellipses — one
// central lobe pointing up, two diagonal side lobes, two lower corner lobes,
// and a slender stem capsule.  The shape is approximate but immediately
// recognisable at the sizes used.
//
// Each leaf spins (Z-axis) and rocks (X-axis squish, same technique as
// Snowfall's coin-flip) as it falls.  Three depth layers with different
// sizes, speeds, and colour tints from the autumn palette: crimson, burnt
// orange, amber gold, sienna brown, yellow.
//
// Background: warm sunset — deep burgundy at the bottom, through amber and
// burnt orange, to a dusty rose-gold sky.  Slow FBM cloud haze.

import { createGLVariation } from '../engine.js';

export default createGLVariation('Autumn Leaves', `
float sdCap(vec2 p, vec2 a, vec2 b, float r) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h) - r;
}

// Maple leaf SDF — five lobes + stem, normalised to ≈ ±1.
// The leaf tip points UP (positive y).
float leafSDF(vec2 p) {
  // Stem (thin capsule pointing down)
  float d = sdCap(p, vec2(0.0, -0.90), vec2(0.0, -0.38), 0.055);

  // Central top lobe (pointing up)
  d = min(d, length(vec2(p.x / 0.32, (p.y - 0.52) / 0.52)) - 1.0);

  // Upper-left and upper-right lobes (diagonal)
  d = min(d, length(vec2((p.x - 0.58) / 0.36, (p.y - 0.18) / 0.40)) - 1.0);
  d = min(d, length(vec2((p.x + 0.58) / 0.36, (p.y - 0.18) / 0.40)) - 1.0);

  // Lower-left and lower-right corner lobes
  d = min(d, length(vec2((p.x - 0.82) / 0.28, (p.y + 0.12) / 0.30)) - 1.0);
  d = min(d, length(vec2((p.x + 0.82) / 0.28, (p.y + 0.12) / 0.30)) - 1.0);

  // Lower body that connects all lobes: wide short ellipse
  d = min(d, length(vec2(p.x / 0.70, (p.y + 0.08) / 0.38)) - 1.0);

  return d;
}

float leafLayer(vec2 uv, float t, float asp,
                float numS, float spd, float wnd, float leafR,
                float seed, float rockAmt, out vec3 layerCol) {
  float bright = 0.0;
  layerCol     = vec3(0.0);
  float cell_x = floor(uv.x * numS);

  for (int i = -2; i <= 2; i++) {
    float nc = cell_x + float(i);
    for (int k = 0; k < 2; k++) {
      float sk = float(k) * 33.0 + seed;

      float rx  = hash(vec2(nc +  6.3, sk));
      float ry  = hash(vec2(nc,         sk));
      float rs  = hash(vec2(nc +  5.1,  sk));
      float rw  = hash(vec2(nc + 12.7,  sk));
      float rp  = hash(vec2(nc + 20.3,  sk));
      float rsp = hash(vec2(nc + 27.9,  sk));   // spin phase
      float rss = hash(vec2(nc + 35.5,  sk));   // spin speed
      float rrk = hash(vec2(nc + 43.1,  sk));   // rock phase
      float rks = hash(vec2(nc + 50.7,  sk));   // rock speed
      float rcol= hash(vec2(nc + 58.3,  sk));   // colour

      float py_raw = fract(ry + t * spd * (0.78 + rs * 0.44));
      float py = 1.10 - py_raw * 1.20;

      float gust    = sin(t * 0.16 + seed * 2.05) * wnd;
      float windOff = gust + sin(t * (0.20 + rw * 0.32) + rp * 6.28) * wnd * 0.55;
      float px = (nc + rx) / numS + windOff;

      vec2 diff = vec2((uv.x - px) * asp, uv.y - py);

      if (length(diff) < leafR * 2.2) {
        // Z-axis spin
        float spinSpd = 0.60 + rss * 0.80;
        float ang = t * spinSpd + rsp * 6.28318;
        float cr = cos(ang), sr = sin(ang);
        vec2 lp = diff / leafR;
        lp = vec2(cr * lp.x + sr * lp.y, -sr * lp.x + cr * lp.y);

        // X-axis rock (squish Y — leaf catches air as it falls)
        float rockSpd = 0.28 + rks * 0.35;
        float squish  = max(abs(cos(t * rockSpd + rrk * 6.28318)), 0.10);
        squish = mix(1.0, squish, rockAmt);
        lp.y /= (squish + 0.001);

        float sdf = leafSDF(lp);
        float aa  = 0.08;
        float alpha = smoothstep(aa, -aa, sdf);

        if (alpha > 0.001) {
          // Autumn colour palette
          vec3 pCol;
          if      (rcol < 0.20) pCol = vec3(0.82, 0.10, 0.10);   // crimson
          else if (rcol < 0.40) pCol = vec3(0.90, 0.34, 0.05);   // burnt orange
          else if (rcol < 0.58) pCol = vec3(0.95, 0.64, 0.04);   // amber gold
          else if (rcol < 0.74) pCol = vec3(0.72, 0.32, 0.08);   // sienna
          else if (rcol < 0.88) pCol = vec3(0.94, 0.84, 0.12);   // yellow
          else                  pCol = vec3(0.56, 0.14, 0.05);   // deep red-brown

          // Vein highlight toward centre
          float vein = smoothstep(0.12, 0.0, abs(lp.x)) * smoothstep(0.0, -0.6, lp.y) * 0.3;
          pCol = mix(pCol, pCol * 1.5, vein);

          bright   += alpha;
          layerCol += pCol * alpha;
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
  float t   = u_time * 0.18;

  // ── Sunset sky ────────────────────────────────────────────────
  vec3 skyBot = vec3(0.42, 0.10, 0.04);   // deep burgundy at ground
  vec3 skyMid = vec3(0.88, 0.40, 0.08);   // burnt orange horizon
  vec3 skyTop = vec3(0.72, 0.55, 0.68);   // dusty rose-purple zenith

  vec3 col = mix(skyBot, skyMid, smoothstep(0.0, 0.40, uv.y));
  col      = mix(col,   skyTop, smoothstep(0.35, 1.0,  uv.y));

  // FBM cloud haze
  float cloud = fbm(p * 1.5 + vec2(t * 0.05, 0.0));
  col += cloud * 0.08 * vec3(0.90, 0.50, 0.20);

  // Sun disc near horizon
  vec2 sunC  = vec2(0.62 * asp, 0.22);
  float sunD = length(p - sunC);
  col += vec3(1.00, 0.80, 0.20) * 0.55 * exp(-sunD * sunD * 14.0);   // glow
  float sunMask = smoothstep(0.048, 0.040, sunD);
  col = mix(col, vec3(1.00, 0.94, 0.60), sunMask);

  // ── Leaf layers ───────────────────────────────────────────────
  vec3 farCol, midCol, nearCol;

  float far  = leafLayer(uv, t, asp, 40.0, 0.054, 0.016, 0.0130, 1.00, 0.30, farCol);
  float mid  = leafLayer(uv, t, asp, 18.0, 0.126, 0.036, 0.0310, 6.37, 0.70, midCol);
  float near = leafLayer(uv, t, asp,  7.0, 0.255, 0.065, 0.0700, 11.9, 1.00, nearCol);

  col = mix(col, farCol,  far  * 0.68);
  col = mix(col, midCol,  mid  * 0.86);
  col = mix(col, nearCol, near);

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`);
