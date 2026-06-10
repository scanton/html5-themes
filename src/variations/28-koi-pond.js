import { createGLVariation } from '../engine.js';

// Koi Pond — realistic sunlit water caustics over a pebbled pond floor.
// The caustic network uses an iterative phase-distortion technique that
// produces the sharp filament web real refracted sunlight makes, layered
// at two scales, with surface ripple distortion and a soft sun glint.

export default createGLVariation('Koi Pond', `
// Iterative caustic — sharp light filament network (phase distortion).
float caustic(vec2 uv, float t) {
  vec2 p = mod(uv * 6.28318, 6.28318) - 250.0;
  vec2 i = p;
  float c = 1.0;
  float inten = 0.005;
  for (int n = 0; n < 5; n++) {
    float tt = t * (1.0 - (3.5 / float(n + 1)));
    i = p + vec2(cos(tt - i.x) + sin(tt + i.y),
                 sin(tt - i.y) + cos(tt + i.x));
    c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / inten),
                           p.y / (cos(i.y + tt) / inten)));
  }
  c /= 5.0;
  c = 1.17 - pow(c, 1.4);
  return pow(abs(c), 8.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float asp = u_resolution.x / u_resolution.y;
  vec2 p = vec2(uv.x * asp, uv.y);
  float t = u_time;

  // Surface ripples gently refract everything below
  vec2 ripple;
  ripple.x = sin(p.y * 9.0 + t * 0.9) * 0.006 + fbm(p * 3.0 + t * 0.15) * 0.02;
  ripple.y = cos(p.x * 8.0 - t * 0.7) * 0.006 + fbm(p * 3.0 - t * 0.12 + 5.0) * 0.02;
  vec2 q = p + ripple;

  // ── Pond floor ──────────────────────────────────────────────
  // Pebbled bottom: layered noise read through the rippled coords
  float stones  = fbm(q * 7.0);
  float stones2 = fbm(q * 16.0 + 3.7);
  vec3 floorCol = mix(vec3(0.13, 0.17, 0.15),   // dark silt
                      vec3(0.30, 0.33, 0.27),   // sandy stone
                      stones);
  floorCol = mix(floorCol, vec3(0.36, 0.36, 0.30), stones2 * stones * 0.6);

  // Depth tint: water absorbs red — deeper = bluer-green.
  float depth = 0.55 + fbm(q * 1.6) * 0.45;     // varying pond depth
  vec3 shallow = vec3(0.16, 0.42, 0.38);
  vec3 deep    = vec3(0.02, 0.16, 0.18);
  vec3 waterTint = mix(shallow, deep, depth);
  vec3 col = mix(floorCol * waterTint * 2.2, waterTint, 0.55 + depth * 0.25);

  // ── Caustics — two scales, brighter in the shallows ─────────
  float c1 = caustic(q * 0.9 + vec2(t * 0.02, 0.0), t * 0.55);
  float c2 = caustic(q * 1.9 + vec2(7.3, 2.1),      t * 0.40) * 0.5;
  float caus = (c1 + c2) * mix(1.25, 0.45, depth);
  col += vec3(0.95, 1.0, 0.85) * caus * 0.85;

  // ── Surface effects ─────────────────────────────────────────
  // Soft sun glint patch upper-right
  float glint = exp(-length(p - vec2(asp * 0.78, 0.80)) * 2.4);
  col += vec3(1.0, 0.98, 0.85) * glint * 0.22;

  // Sliding specular micro-highlights from the ripples
  float spec = pow(max(0.0, vnoise(p * 14.0 + vec2(t * 0.5, -t * 0.3)) - 0.62), 2.0) * 2.2;
  col += vec3(0.9, 1.0, 0.95) * spec * 0.35;

  // Gentle dark vignette pulls the eye to centre
  float vig = smoothstep(1.25, 0.35, length(p - vec2(asp * 0.5, 0.5)));
  col *= 0.72 + 0.28 * vig;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`);
