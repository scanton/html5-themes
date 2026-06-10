import { createGLVariation } from '../engine.js';

// Bokeh — "First Dance": an airy pearl-and-blush wedding backdrop.
// Luminous ivory silk gradient with slow satin sheen bands sweeping
// diagonally, champagne-gold and rose-gold bokeh rising like candle
// glints, and a fine drift of sparkle dust. Light and romantic —
// white-wedding bright, never muddy.

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
    float yy = fract(h2 + t * (0.006 + h4 * 0.010)) * 1.4 - 0.2;
    float xx = h1 * asp + sin(t * (0.04 + h4 * 0.05) + h5 * 6.28) * 0.06 * asp;
    vec2 c = vec2(xx, yy);

    float disc = bokehDisc(uv, c, r, r * blurMul);
    float tw = 0.78 + 0.22 * sin(t * (0.25 + h5 * 0.4) + h1 * 6.28);

    // champagne gold / rose gold / blush / pearl
    vec3 col;
    if      (h4 < 0.34) col = vec3(1.00, 0.84, 0.55);  // champagne gold
    else if (h4 < 0.60) col = vec3(1.00, 0.72, 0.62);  // rose gold
    else if (h4 < 0.82) col = vec3(1.00, 0.78, 0.84);  // blush
    else                col = vec3(1.00, 0.97, 0.92);  // pearl

    acc += col * disc * tw * alphaMul * (0.45 + 0.55 * h2);
  }
  return acc;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float asp = u_resolution.x / u_resolution.y;
  vec2 p = vec2(uv.x * asp, uv.y);
  float t = u_time;

  // ── Pearl silk base: ivory glow top-centre -> blush -> rose-mauve ──
  vec3 ivory = vec3(0.99, 0.96, 0.92);
  vec3 blush = vec3(0.96, 0.82, 0.82);
  vec3 mauve = vec3(0.80, 0.62, 0.66);
  float g = smoothstep(1.15, 0.0, uv.y);          // 0 top -> 1 bottom
  vec3 col = mix(ivory, blush, smoothstep(0.10, 0.62, g));
  col = mix(col, mauve, smoothstep(0.58, 1.05, g));

  // luminous heart — soft light like sheer curtains, upper centre
  float hd = length(p - vec2(asp * 0.5, 0.78));
  col += vec3(0.07, 0.05, 0.03) * exp(-hd * 1.6);

  // ── Satin sheen: two slow diagonal light bands, perfectly smooth ──
  float band1 = sin(dot(p, vec2(0.9, 1.4)) * 2.2 - t * 0.10);
  float band2 = sin(dot(p, vec2(-1.1, 1.0)) * 1.7 + t * 0.07 + 1.8);
  float sheen = smoothstep(0.55, 1.0, band1) * 0.045
              + smoothstep(0.60, 1.0, band2) * 0.035;
  col += vec3(1.0, 0.98, 0.96) * sheen;
  // and a whisper of rose shadow between the highlights
  col -= vec3(0.045, 0.030, 0.020) * smoothstep(0.5, 1.0, -band1);

  // ── Bokeh: far -> near, kept translucent over the bright base ──
  col += bokehLayer(p, asp, t, 0.0,  0.14, 0.22, 0.85, 0.085);
  col += bokehLayer(p, asp, t, 30.0, 0.055, 0.11, 0.42, 0.16);
  col += bokehLayer(p, asp, t, 60.0, 0.014, 0.04, 0.22, 0.30);

  // ── Sparkle dust: tiny rising motes with slow twinkle ──
  for (int i = 0; i < 10; i++) {
    float fi = float(i);
    vec2 seed = vec2(fi * 3.71, fi * 1.93);
    float h1 = hash(seed), h2 = hash(seed + 7.7), h3 = hash(seed + 13.1);
    vec2 c = vec2(h1 * asp + sin(t * 0.1 + h3 * 6.28) * 0.02,
                  fract(h2 + t * (0.010 + h3 * 0.012)));
    float tw = pow(max(0.0, sin(t * (0.5 + h3 * 0.9) + h1 * 6.28)), 5.0);
    col += vec3(1.0, 0.92, 0.75) * exp(-length(p - c) * 260.0) * tw * 1.3;
  }

  // delicate vignette — rose-deepened corners, keeps the centre luminous
  float vig = smoothstep(1.45, 0.35, length(p - vec2(asp * 0.5, 0.52)));
  col = mix(col * vec3(0.86, 0.78, 0.80), col, 0.55 + 0.45 * vig);

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`);
