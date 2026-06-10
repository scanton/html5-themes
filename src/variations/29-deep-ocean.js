import { createGLVariation } from '../engine.js';

export default createGLVariation('Deep Ocean', `
void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float asp = u_resolution.x / u_resolution.y;
  float t = u_time * 0.3;

  vec2 p = uv * vec2(asp, 1.0);

  // Dark abyssal water base
  float depth = 1.0 - uv.y * 0.6;
  vec3 col = mix(vec3(0.01, 0.04, 0.10), vec3(0.00, 0.01, 0.06), depth);

  // Slow drifting water currents
  float curr = fbm(p * 2.5 + t * 0.18) * 0.5 + 0.5;
  col += vec3(0.0, 0.03, 0.08) * curr * 0.4;

  // Bioluminescent particles — scattered glowing dots
  float bio = 0.0;
  vec3 bioCol = vec3(0.0);
  for (int i = 0; i < 18; i++) {
    float fi = float(i);
    vec2 seed = vec2(fi * 1.618 + 0.5, fi * 0.723 + 0.2);
    float bx = fract(hash(seed) * asp + t * (0.012 + hash(seed + 0.9) * 0.018));
    float by = fract(hash(seed + 0.4) + sin(t * 0.4 + fi) * 0.02);
    float br = 0.005 + fract(hash(seed + 1.1)) * 0.012;
    float bd = length(p - vec2(bx * asp, by));
    float blob = smoothstep(br, 0.0, bd);

    // Hue: cyan, blue-green, violet
    float hue = fract(hash(seed + 2.3));
    vec3 c = hue < 0.4
      ? vec3(0.1, 1.0, 0.85)
      : hue < 0.7
        ? vec3(0.0, 0.7, 1.0)
        : vec3(0.6, 0.3, 1.0);
    bioCol += c * blob * (0.55 + fract(hash(seed + 3.7)) * 0.45);
    bio    += blob;
  }
  col += bioCol * 0.9;

  // Larger bioluminescent jellyfish-glow blobs in background
  for (int j = 0; j < 5; j++) {
    float fj = float(j) + 20.0;
    vec2 seed2 = vec2(fj * 2.13, fj * 0.87);
    float bx = fract(hash(seed2) * asp);
    float by = fract(hash(seed2 + 0.5) + sin(t * 0.2 + fj) * 0.05);
    float bd = length(p - vec2(bx * asp, by));
    float glow = exp(-bd * 12.0) * 0.12;
    col += vec3(0.0, 0.5, 0.9) * glow;
  }

  // Subtle vertical light shafts from above
  float shaft = pow(max(0.0, sin(uv.x * 9.0 + t * 0.15)), 6.0) * (1.0 - uv.y) * 0.06;
  col += vec3(0.2, 0.6, 1.0) * shaft;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`);
