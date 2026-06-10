import { createGLVariation } from '../engine.js';

// Bokeh — elegant wedding bokeh: a candlelit champagne gradient with
// three depth layers of perfectly round, edge-bright lens discs drifting
// upward like rising candle glow. Every element is radially smooth —
// no grid noise — so the result stays soft and romantic.

export default createGLVariation('Bokeh', `
// Round lens disc with the subtle bright rim of real out-of-focus light.
float bokehDisc(vec2 uv, vec2 c, float r, float blur) {
  float d = length(uv - c);
  float disc = smoothstep(r, r - blur, d);
  float rim  = smoothstep(r * 0.40, r * 0.94, d);
  return disc * (0.50 + 0.62 * rim);
}

vec3 bokehLayer(vec2 uv, float asp, float t, float seedBase,
                float rMin, float rMax, float blurMul, float alphaMul) {
  vec3 acc = vec3(0.0);
  for (int i = 0; i < 9; i++) {
    float fi   = float(i) + seedBase;
    vec2 seed  = vec2(fi * 1.618, fi * 2.398);
    float h1 = hash(seed);
    float h2 = hash(seed + 11.3);
    float h3 = hash(seed + 23.7);
    float h4 = hash(seed + 37.1);
    float h5 = hash(seed + 51.9);

    float r = mix(rMin, rMax, h3);
    // slow rise with gentle sideways sway, wrapping vertically
    float yy = fract(h2 + t * (0.006 + h4 * 0.010)) * 1.4 - 0.2;
    float xx = h1 * asp + sin(t * (0.04 + h4 * 0.05) + h5 * 6.28) * 0.06 * asp;
    vec2 c = vec2(xx, yy);

    float disc = bokehDisc(uv, c, r, r * blurMul);
    // slow breathing, never fully dark
    float tw = 0.78 + 0.22 * sin(t * (0.25 + h5 * 0.4) + h1 * 6.28);

    // champagne / soft gold / blush / candle white
    vec3 col;
    if      (h4 < 0.34) col = vec3(1.00, 0.86, 0.62);  // soft gold
    else if (h4 < 0.62) col = vec3(1.00, 0.94, 0.80);  // champagne
    else if (h4 < 0.82) col = vec3(1.00, 0.82, 0.78);  // blush
    else                col = vec3(1.00, 0.98, 0.92);  // candle white

    acc += col * disc * tw * alphaMul * (0.45 + 0.55 * h2);
  }
  return acc;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float asp = u_resolution.x / u_resolution.y;
  vec2 p = vec2(uv.x * asp, uv.y);
  float t = u_time;

  // ── Candlelit champagne backdrop — all smooth radial gradients ──
  // deep warm mocha at the edges -> glowing honey-gold heart
  float cd = length(p - vec2(asp * 0.5, 0.46));
  vec3 edge  = vec3(0.16, 0.10, 0.075);
  vec3 heart = vec3(0.52, 0.36, 0.20);
  vec3 col = mix(heart, edge, smoothstep(0.05, 1.05, cd));

  // two big ultra-soft drifting glow pools (like distant candle tables)
  vec2 g1 = vec2(asp * (0.30 + 0.05 * sin(t * 0.05)), 0.32 + 0.04 * sin(t * 0.07));
  vec2 g2 = vec2(asp * (0.72 + 0.05 * sin(t * 0.06 + 2.0)), 0.62 + 0.04 * sin(t * 0.045 + 1.0));
  col += vec3(0.30, 0.20, 0.10) * exp(-length(p - g1) * 2.6);
  col += vec3(0.26, 0.16, 0.10) * exp(-length(p - g2) * 2.8);

  // gentle golden top-light, as if from chandeliers above
  col += vec3(0.10, 0.07, 0.03) * smoothstep(0.45, 1.0, uv.y);

  // ── Bokeh: far (large, dim, soft) -> near (small, bright, crisp) ──
  col += bokehLayer(p, asp, t, 0.0,  0.15, 0.24, 0.85, 0.14);
  col += bokehLayer(p, asp, t, 30.0, 0.06, 0.12, 0.42, 0.26);
  col += bokehLayer(p, asp, t, 60.0, 0.016, 0.045, 0.22, 0.50);

  // ── A few floating champagne sparkles — round points, slow twinkle ──
  for (int i = 0; i < 8; i++) {
    float fi = float(i);
    vec2 seed = vec2(fi * 3.71, fi * 1.93);
    float h1 = hash(seed), h2 = hash(seed + 7.7), h3 = hash(seed + 13.1);
    vec2 c = vec2(h1 * asp, fract(h2 + t * (0.008 + h3 * 0.010)));
    float tw = pow(max(0.0, sin(t * (0.5 + h3 * 0.8) + h1 * 6.28)), 6.0);
    col += vec3(1.0, 0.95, 0.82) * exp(-length(p - c) * 240.0) * tw * 1.6;
  }

  // soft vignette to frame the scene
  float vig = smoothstep(1.35, 0.30, cd);
  col *= 0.78 + 0.22 * vig;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`);
