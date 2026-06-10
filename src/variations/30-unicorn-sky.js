import { createGLVariation } from '../engine.js';

// Unicorn Sky — silky iridescent rainbow ribbons flowing like aurora
// across a dreamy pastel sky, with a soft radiant sun-glow, drifting
// rim-lit clouds and floating star sparkles. Domain-warped fbm gives the
// ribbons a liquid-silk motion.

export default createGLVariation('Unicorn Sky', `
// pastel rainbow — full hue wheel softened toward white
vec3 pastel(float h) {
  h = fract(h);
  vec3 c = clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
  return mix(vec3(1.0), c, 0.58);          // keep colours present, not chalky
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float asp = u_resolution.x / u_resolution.y;
  vec2 p = vec2(uv.x * asp, uv.y);
  float t = u_time * 0.12;

  // ── Base sky: periwinkle top -> blush horizon ────────────────
  vec3 skyTop = vec3(0.58, 0.62, 0.94);
  vec3 skyLow = vec3(0.97, 0.74, 0.84);
  vec3 col = mix(skyLow, skyTop, smoothstep(0.05, 0.95, uv.y));

  // ── Iridescent silk ribbons (domain-warped flow) ─────────────
  // warp the space so bands bend and flow like fabric
  vec2 w;
  w.x = fbm(p * 1.3 + vec2(t * 0.7, 0.0));
  w.y = fbm(p * 1.3 + vec2(5.2, t * 0.55));
  vec2 q = p + (w - 0.5) * 0.9;

  // diagonal band coordinate, gently curving
  float band = q.y * 2.0 - q.x * 0.55 + fbm(q * 2.2 - t * 0.4) * 0.55;

  // hue cycles along the bands and slowly over time
  vec3 ribbon = pastel(band * 0.85 + t * 0.35);

  // ribbon visibility: silky strands, not a flat wash
  float strands = fbm(vec2(band * 3.0, q.x * 1.2) + t * 0.6);
  float silk = smoothstep(0.32, 0.78, strands);
  // shimmer: a moving bright filament inside the silk
  float sheen = pow(smoothstep(0.45, 0.62, strands) * smoothstep(0.80, 0.62, strands), 1.5);

  col = mix(col, ribbon, silk * 0.68);
  col += vec3(1.0, 0.97, 1.0) * sheen * 0.16;

  // ── Radiant glow — small soft magical sun, upper left ────────
  vec2 sunPos = vec2(asp * 0.24, 0.86);
  float sd = length(p - sunPos);
  col += vec3(1.00, 0.90, 0.72) * exp(-sd * 5.5) * 0.45;
  col += vec3(1.00, 0.78, 0.86) * exp(-sd * 2.2) * 0.10;

  // ── Dreamy clouds with pink rim light ────────────────────────
  vec2 cp = p * vec2(1.0, 2.2) + vec2(t * 0.5, 0.0);
  float cl  = fbm(cp * 1.6);
  float cloud = smoothstep(0.52, 0.72, cl);
  // rim: sample density slightly toward the sun — thinner side glows
  float clSun = fbm(cp * 1.6 + normalize(sunPos - p + 0.001) * 0.18);
  float rim = clamp((cl - clSun) * 6.0, 0.0, 1.0) * cloud;
  col = mix(col, vec3(0.99, 0.95, 0.99), cloud * 0.32);
  col += vec3(1.0, 0.68, 0.82) * rim * 0.40;

  // ── Floating sparkles — twinkling 4-point glints ─────────────
  for (int i = 0; i < 12; i++) {
    float fi = float(i);
    vec2 seed = vec2(fi * 2.71, fi * 1.39);
    float h1 = hash(seed), h2 = hash(seed + 7.7), h3 = hash(seed + 13.1);
    vec2 c = vec2(h1 * asp, fract(h2 + t * (0.02 + h3 * 0.03)));
    vec2 d = p - c;
    float tw = pow(max(0.0, sin(u_time * (0.8 + h3 * 1.5) + h1 * 6.28)), 4.0);
    // 4-point star: bright core + thin cross arms
    float core = exp(-length(d) * 220.0);
    float arms = exp(-abs(d.x) * 350.0) * exp(-abs(d.y) * 28.0)
               + exp(-abs(d.y) * 350.0) * exp(-abs(d.x) * 28.0);
    col += vec3(1.0, 0.98, 0.92) * (core * 2.0 + arms * 0.7) * tw;
  }

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`);
