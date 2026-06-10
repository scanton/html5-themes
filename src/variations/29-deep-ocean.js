import { createGLVariation } from '../engine.js';

// Deep Ocean — the abyssal twilight zone. Volumetric god rays fade from a
// distant surface, marine snow sinks slowly through layered murk, and
// faint bioluminescent plankton pulse in the dark. Heavy depth gradient
// and vignette sell the crushing deep.

export default createGLVariation('Deep Ocean', `
// soft round particle
float particle(vec2 p, vec2 c, float r) {
  return smoothstep(r, 0.0, length(p - c));
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float asp = u_resolution.x / u_resolution.y;
  vec2 p = vec2(uv.x * asp, uv.y);
  float t = u_time;

  // ── Depth gradient: faint blue glow above, near-black below ──
  vec3 surfaceGlow = vec3(0.04, 0.18, 0.30);
  vec3 midWater    = vec3(0.005, 0.045, 0.10);
  vec3 abyss       = vec3(0.0, 0.004, 0.015);
  vec3 col = mix(abyss, midWater, smoothstep(0.0, 0.6, uv.y));
  col = mix(col, surfaceGlow, smoothstep(0.55, 1.15, uv.y) * 0.9);

  // ── Layered murk — slow drifting volume ─────────────────────
  float murk1 = fbm(p * 1.6 + vec2(t * 0.015, t * 0.008));
  float murk2 = fbm(p * 3.2 - vec2(t * 0.010, t * 0.014) + 7.0);
  col += vec3(0.01, 0.05, 0.09) * murk1 * smoothstep(0.1, 0.9, uv.y);
  col -= vec3(0.012, 0.02, 0.025) * murk2 * (1.0 - uv.y);

  // ── God rays — angular shafts from a sun spot above ─────────
  vec2 sunPos = vec2(asp * 0.62, 1.35);
  vec2 toSun = p - sunPos;
  float sunDist = length(toSun);
  float ang = atan(toSun.x, toSun.y);
  // several overlapping ray frequencies, slowly swinging
  float rays = 0.0;
  rays += pow(abs(sin(ang * 9.0  + t * 0.10)), 18.0) * 0.7;
  rays += pow(abs(sin(ang * 5.0  - t * 0.07 + 1.3)), 24.0) * 0.5;
  rays += pow(abs(sin(ang * 13.0 + t * 0.05 + 2.6)), 30.0) * 0.4;
  // rays attenuate with depth & distance, and shimmer through the murk
  float rayFade = smoothstep(2.0, 0.35, sunDist) * smoothstep(0.05, 0.85, uv.y);
  rays *= rayFade * (0.55 + 0.45 * murk1);
  col += vec3(0.10, 0.30, 0.42) * rays;

  // bright haze right around the distant surface
  col += vec3(0.06, 0.22, 0.34) * exp(-sunDist * 1.8) * 0.8;

  // ── Marine snow — slowly sinking specks, 3 parallax layers ──
  for (int layer = 0; layer < 3; layer++) {
    float fl = float(layer);
    float scale = 14.0 + fl * 12.0;          // finer = farther
    float speed = 0.014 + fl * 0.008;
    vec2 g = vec2(p.x * scale, (p.y + t * speed) * scale);
    vec2 cell = floor(g);
    vec2 fr = fract(g);
    float h = hash(cell + fl * 53.0);
    // one speck per ~3 cells
    if (h > 0.66) {
      vec2 c = vec2(fract(h * 13.7), fract(h * 7.3));
      c.x += sin(t * 0.4 + h * 6.28) * 0.15;   // tiny drift wiggle
      float sp = particle(fr, c, 0.055 + h * 0.05);
      float bright = (0.10 + 0.12 * fract(h * 31.0)) / (1.0 + fl);
      col += vec3(0.55, 0.70, 0.78) * sp * bright;
    }
  }

  // ── Bioluminescent plankton — rare cyan pulses in the dark ──
  for (int i = 0; i < 7; i++) {
    float fi = float(i);
    vec2 seed = vec2(fi * 3.13, fi * 1.71);
    float h1 = hash(seed), h2 = hash(seed + 9.1), h3 = hash(seed + 17.3);
    vec2 c = vec2(h1 * asp, fract(h2 + t * 0.006));
    float pulse = pow(max(0.0, sin(t * (0.25 + h3 * 0.3) + h1 * 6.28)), 6.0);
    float glow = exp(-length(p - c) * (30.0 + h3 * 40.0));
    vec3 bioc = h3 < 0.5 ? vec3(0.1, 0.9, 0.8) : vec3(0.25, 0.45, 1.0);
    col += bioc * glow * pulse * 0.5 * (1.0 - uv.y * 0.6);
  }

  // ── Vignette — the dark presses in ──────────────────────────
  float vig = smoothstep(1.45, 0.3, length(p - vec2(asp * 0.5, 0.55)));
  col *= 0.55 + 0.45 * vig;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`);
