import { createGLVariation } from '../engine.js';

// Bokeh — warm champagne-and-gold lens bokeh. Three depth layers of
// out-of-focus light discs with the bright rim characteristic of real
// lens bokeh, over a dusky amber gradient. Discs drift slowly upward
// and breathe in brightness.

export default createGLVariation('Bokeh', `
// One bokeh disc with a brighter rim (real lens bokeh is edge-bright).
float bokehDisc(vec2 uv, vec2 c, float r, float blur) {
  float d = length(uv - c);
  float disc = smoothstep(r, r - blur, d);
  // edge brightening: ramp up toward the rim, then cut off
  float rim  = smoothstep(r * 0.45, r * 0.92, d);
  return disc * (0.55 + 0.65 * rim);
}

vec3 bokehLayer(vec2 uv, float asp, float t, float seedBase,
                float rMin, float rMax, float blurMul, float alphaMul) {
  vec3 acc = vec3(0.0);
  for (int i = 0; i < 10; i++) {
    float fi   = float(i) + seedBase;
    vec2 seed  = vec2(fi * 1.618, fi * 2.398);
    float h1 = hash(seed);
    float h2 = hash(seed + 11.3);
    float h3 = hash(seed + 23.7);
    float h4 = hash(seed + 37.1);
    float h5 = hash(seed + 51.9);

    float r = mix(rMin, rMax, h3);
    // slow upward drift with sideways sway, wrapping vertically
    float yy = fract(h2 + t * (0.008 + h4 * 0.012)) * 1.3 - 0.15;
    float xx = h1 * asp + sin(t * (0.05 + h4 * 0.07) + h5 * 6.28) * 0.05 * asp;
    vec2 c = vec2(xx, yy);

    float disc = bokehDisc(uv, c, r, r * blurMul);
    // gentle breathing twinkle
    float tw = 0.72 + 0.28 * sin(t * (0.3 + h5 * 0.5) + h1 * 6.28);

    // champagne / gold / rose-gold / warm white palette
    vec3 col;
    float hue = h4;
    if      (hue < 0.35) col = vec3(1.00, 0.83, 0.55);  // gold
    else if (hue < 0.60) col = vec3(1.00, 0.92, 0.74);  // champagne
    else if (hue < 0.82) col = vec3(1.00, 0.74, 0.66);  // rose gold
    else                 col = vec3(1.00, 0.97, 0.88);  // warm white

    acc += col * disc * tw * alphaMul * (0.5 + 0.5 * h2);
  }
  return acc;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float asp = u_resolution.x / u_resolution.y;
  vec2 p = vec2(uv.x * asp, uv.y);
  float t = u_time;

  // Dusky amber backdrop: deep warm brown edges -> glowing honey centre
  float cd = length(p - vec2(asp * 0.5, 0.55));
  vec3 dark   = vec3(0.14, 0.075, 0.05);
  vec3 honey  = vec3(0.42, 0.26, 0.13);
  vec3 col = mix(honey, dark, smoothstep(0.0, 0.95, cd));

  // soft ambient warmth wash, very slow
  col += vec3(0.10, 0.05, 0.02) * (fbm(p * 1.8 + t * 0.02) - 0.4);

  // Three depth layers: big & blurry behind, small & crisp in front
  col += bokehLayer(p, asp, t, 0.0,  0.16, 0.26, 0.95, 0.16);  // far, soft
  col += bokehLayer(p, asp, t, 30.0, 0.07, 0.13, 0.45, 0.30);  // mid
  col += bokehLayer(p, asp, t, 60.0, 0.018, 0.05, 0.22, 0.55); // near, crisp

  // faint golden sparkle dust
  float spark = pow(vnoise(p * 26.0 + t * 0.35), 12.0) * 0.5;
  col += vec3(1.0, 0.9, 0.7) * spark;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`);
