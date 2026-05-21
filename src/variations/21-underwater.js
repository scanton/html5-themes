// Underwater — WebGL / GLSL.
//
// Deep ocean viewed from below — light filters down from the shimmering
// surface above.  Three layered techniques combine:
//
// 1. Caustic light rays: FBM-warped height field with a finite-difference
//    gradient gives bright caustic lines, identical in spirit to Pool Water
//    but seen from below so the bright patterns fall downward.
//
// 2. God rays / crepuscular shafts: sinusoidal angular bands of light
//    radiating from a point above the screen centre, softened by FBM.
//    They sweep slowly left and right, simulating surface wave refraction.
//
// 3. Rising bubbles: same column-strip system as Beer, with larger, more
//    varied bubble sizes.  Hollow ring particles with a soft inner void.
//
// Palette: deep midnight-blue at the bottom → aquamarine at the surface,
// with bright turquoise caustic near-whites.

import { createGLVariation } from '../engine.js';

export default createGLVariation('Underwater', `
float bubbleLayer(vec2 uv, float t, float asp,
                  float numCols, float spd, float bblR, float seed) {
  float sx     = uv.x * numCols;
  float cell_x = floor(sx);
  float bright = 0.0;

  for (int i = -2; i <= 2; i++) {
    float nc = cell_x + float(i);
    for (int k = 0; k < 2; k++) {
      float sk = float(k) * 29.37 + seed;
      float rx = hash(vec2(nc + 13.10, sk));
      float ry = hash(vec2(nc,          sk));
      float rs = hash(vec2(nc +  2.31,  sk));
      float rp = hash(vec2(nc +  4.73,  sk));
      float rr = hash(vec2(nc +  7.91,  sk));   // radius variation

      float py_raw = fract(ry + t * spd * (0.72 + rs * 0.56));
      float py = -0.12 + py_raw * 1.24;

      float px = (nc + rx) / numCols
               + sin(t * 0.55 + rp * 6.28) * 0.012;

      vec2  diff = vec2((uv.x - px) * asp, uv.y - py);
      float d    = length(diff);
      float r    = bblR * (0.55 + rr * 0.90);

      float voidM  = 1.0 - smoothstep(0.0,        r * 0.38, d);
      float outerM = 1.0 - smoothstep(r * 0.62,   r,        d);
      bright += outerM * (1.0 - voidM);
    }
  }
  return clamp(bright, 0.0, 1.0);
}

void main() {
  vec2  uv  = gl_FragCoord.xy / u_resolution;
  float asp = u_resolution.x / u_resolution.y;
  vec2  p   = uv * vec2(asp, 1.0);
  float t   = u_time * 0.22;

  // ── Water colour gradient: midnight-blue → aquamarine ─────────
  vec3 deep   = vec3(0.01, 0.05, 0.18);   // deep ocean floor
  vec3 mid    = vec3(0.02, 0.22, 0.52);   // mid water column
  vec3 surface= vec3(0.05, 0.62, 0.72);   // near surface aqua
  vec3 col = mix(deep, mid,    smoothstep(0.0,  0.55, uv.y));
  col      = mix(col,  surface,smoothstep(0.50, 1.0,  uv.y));

  // ── Caustic light pattern (from shimmering surface above) ─────
  // Two-level domain warp on the top-down height field
  vec2 q = vec2(
    fbm(p * 1.4 + vec2( cos(t*0.52)*0.60,  sin(t*0.46)*0.55)),
    fbm(p * 1.4 + vec2( sin(t*0.48)*0.58, -cos(t*0.54)*0.62) + vec2(4.1, 2.3))
  );
  vec2 r2 = vec2(
    fbm(p * 2.2 + 2.4*q + vec2(cos(t*0.24)*0.90, sin(t*0.21)*0.80) + vec2(1.7, 5.9)),
    fbm(p * 2.2 + 2.4*q + vec2(-sin(t*0.27)*0.85, cos(t*0.23)*0.95) + vec2(6.1, 1.4))
  );
  float h = fbm(p + 1.8*r2);

  float eps = 0.005;
  float hR  = fbm((p + vec2(eps, 0.0)) + 1.8*r2);
  float hU  = fbm((p + vec2(0.0, eps)) + 1.8*r2);
  float slope = length(vec2(hR - h, hU - h)) / eps;
  float caustic = pow(clamp(slope * 0.55, 0.0, 1.0), 3.0) * 2.2;

  // Caustic colour — bright turquoise/cyan
  vec3 causticCol = vec3(0.70, 0.98, 1.00);
  col = mix(col, causticCol, clamp(caustic, 0.0, 1.0) * 0.75);

  // ── God rays: light shafts from surface ───────────────────────
  // Source point above screen centre (uv.y = 1.2 ≈ beyond top edge)
  vec2 src = vec2(0.5 * asp, 1.22);
  vec2 toSrc = normalize(src - p);
  float rayAngle = atan(p.x - src.x, p.y - src.y);

  // Multiple sinusoidal shafts that sweep slowly
  float shafts = sin(rayAngle * 6.0 + t * 0.35) * 0.5 + 0.5;
  shafts *= sin(rayAngle * 11.0 - t * 0.22) * 0.5 + 0.5;
  shafts  = pow(shafts, 2.2);

  // Rays attenuate with distance from source
  float rayDist = length(p - src);
  float rayFade = exp(-rayDist * 1.2);

  // FBM breaks up the shaft edges organically
  float rayWarp = fbm(p * 3.5 + vec2(t * 0.15, 0.0));
  shafts *= 0.70 + 0.30 * rayWarp;

  col += shafts * rayFade * vec3(0.30, 0.72, 0.85) * 0.55;

  // ── Dark depth shadowing ──────────────────────────────────────
  float trough = fbm(p * 1.1 + 1.5*q + vec2(cos(t*0.18)*0.5, -sin(t*0.16)*0.5));
  col *= 0.65 + 0.35 * smoothstep(0.25, 0.60, trough);

  // ── Bubbles: fine + medium ────────────────────────────────────
  float bbl1 = bubbleLayer(uv, t, asp, 18.0, 0.08,  0.0045, 3.11);
  float bbl2 = bubbleLayer(uv, t, asp,  9.0, 0.055, 0.0090, 7.83);
  float bbl3 = bubbleLayer(uv, t, asp,  4.0, 0.035, 0.0180, 12.5);

  float bblAll = clamp(bbl1 + bbl2 + bbl3, 0.0, 1.0);
  vec3  bblCol = vec3(0.72, 0.94, 1.00);
  col = mix(col, bblCol, bblAll * 0.72);

  // ── Surface shimmer at top edge ───────────────────────────────
  float shimmer = smoothstep(0.88, 1.0, uv.y);
  float shimNoise = fbm(vec2(p.x * 3.5 + t * 0.25, t * 0.40));
  col = mix(col, vec3(0.55, 0.90, 0.96), shimmer * shimNoise * 0.75);

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`);
