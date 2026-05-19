// Ocean Depths — WebGL / GLSL.
// Caustic light interference pattern from overlapping radial waves.
// FBM-warped god rays from the surface.
// Deep navy-to-teal depth gradient with bioluminescent particle glows.

import { createGLVariation } from '../engine.js';

export default createGLVariation('Ocean Depths', `
// Caustic light: interference of several radial wave emitters,
// each slowly orbiting the frame.
float caustics(vec2 p, float t) {
  float c = 0.0;
  // Unrolled for WebGL 1.0 compatibility
  vec2 c0 = vec2(0.5 + 0.38*sin(t*0.41 + 0.0), 0.5 + 0.28*cos(t*0.37 + 0.0));
  vec2 c1 = vec2(0.5 + 0.38*sin(t*0.38 + 1.7), 0.5 + 0.28*cos(t*0.34 + 1.7));
  vec2 c2 = vec2(0.5 + 0.38*sin(t*0.45 + 3.4), 0.5 + 0.28*cos(t*0.40 + 3.4));
  vec2 c3 = vec2(0.5 + 0.38*sin(t*0.33 + 5.1), 0.5 + 0.28*cos(t*0.43 + 5.1));
  c += sin(length(p - c0) * 22.0 - t * 1.8) * 0.5 + 0.5;
  c += sin(length(p - c1) * 18.0 - t * 1.5) * 0.5 + 0.5;
  c += sin(length(p - c2) * 26.0 - t * 2.1) * 0.5 + 0.5;
  c += sin(length(p - c3) * 20.0 - t * 1.3) * 0.5 + 0.5;
  return pow(c * 0.25, 3.2);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float t  = u_time * 0.18;

  // ── depth gradient ─────────────────────────────────────────────
  vec3 abyss = vec3(0.000, 0.018, 0.075);
  vec3 deep  = vec3(0.000, 0.065, 0.220);
  vec3 mid   = vec3(0.005, 0.200, 0.420);
  float dt = uv.y;
  vec3 ocean = dt < 0.5
    ? mix(abyss, deep, dt * 2.0)
    : mix(deep,  mid,  (dt - 0.5) * 2.0);

  // ── FBM warp for water-surface distortion ─────────────────────
  vec2 wp = uv * 2.4 + t * vec2(0.05, 0.03);
  vec2 warp = vec2(fbm(wp), fbm(wp + vec2(3.8, 1.5)));
  vec2 distUV = uv + warp * 0.035;

  // ── caustic light ripples ──────────────────────────────────────
  float caus = caustics(distUV, t);
  float lightDepth = 1.0 - smoothstep(0.0, 1.0, uv.y * 1.1);
  ocean += caus * vec3(0.08, 0.52, 0.78) * lightDepth * 0.70;

  // ── god rays (light shafts from surface) ──────────────────────
  vec2 rp = uv * vec2(3.2, 5.5) - vec2(t * 0.07, t * 0.38);
  float rays = fbm(rp) * fbm(rp + vec2(1.9, 0.0));
  rays = pow(max(rays, 0.0), 2.8) * (1.0 - uv.y) * 1.5;
  ocean += rays * vec3(0.12, 0.55, 0.85) * 0.45;

  // ── bioluminescent glows (8 slowly drifting particles) ────────
  // Positions encoded as deterministic sin/cos offsets
  vec2 g0 = vec2(fract(0.0*0.137 + sin(t*0.22 + 0.0)*0.28), fract(0.0*0.289 + cos(t*0.17 + 0.0)*0.22));
  vec2 g1 = vec2(fract(1.0*0.137 + sin(t*0.22 + 1.0)*0.28), fract(1.0*0.289 + cos(t*0.17 + 1.5)*0.22));
  vec2 g2 = vec2(fract(2.0*0.137 + sin(t*0.22 + 2.0)*0.28), fract(2.0*0.289 + cos(t*0.17 + 3.0)*0.22));
  vec2 g3 = vec2(fract(3.0*0.137 + sin(t*0.22 + 3.0)*0.28), fract(3.0*0.289 + cos(t*0.17 + 4.5)*0.22));
  vec2 g4 = vec2(fract(4.0*0.137 + sin(t*0.22 + 4.0)*0.28), fract(4.0*0.289 + cos(t*0.17 + 6.0)*0.22));
  vec2 g5 = vec2(fract(5.0*0.137 + sin(t*0.22 + 5.0)*0.28), fract(5.0*0.289 + cos(t*0.17 + 7.5)*0.22));
  vec2 g6 = vec2(fract(6.0*0.137 + sin(t*0.22 + 6.0)*0.28), fract(6.0*0.289 + cos(t*0.17 + 9.0)*0.22));
  vec2 g7 = vec2(fract(7.0*0.137 + sin(t*0.22 + 7.0)*0.28), fract(7.0*0.289 + cos(t*0.17 +10.5)*0.22));

  float pulse0 = 0.5 + 0.5*sin(t*2.1 + 0.0*3.7);
  float pulse1 = 0.5 + 0.5*sin(t*2.1 + 1.0*3.7);
  float pulse2 = 0.5 + 0.5*sin(t*2.1 + 2.0*3.7);
  float pulse3 = 0.5 + 0.5*sin(t*2.1 + 3.0*3.7);
  float pulse4 = 0.5 + 0.5*sin(t*2.1 + 4.0*3.7);
  float pulse5 = 0.5 + 0.5*sin(t*2.1 + 5.0*3.7);
  float pulse6 = 0.5 + 0.5*sin(t*2.1 + 6.0*3.7);
  float pulse7 = 0.5 + 0.5*sin(t*2.1 + 7.0*3.7);

  vec3 bio = vec3(0.08, 1.0, 0.70);
  ocean += exp(-length(uv-g0)*48.0)*pulse0*bio*0.45;
  ocean += exp(-length(uv-g1)*48.0)*pulse1*bio*0.45;
  ocean += exp(-length(uv-g2)*48.0)*pulse2*bio*0.45;
  ocean += exp(-length(uv-g3)*48.0)*pulse3*bio*0.45;
  ocean += exp(-length(uv-g4)*48.0)*pulse4*bio*0.45;
  ocean += exp(-length(uv-g5)*48.0)*pulse5*bio*0.45;
  ocean += exp(-length(uv-g6)*48.0)*pulse6*bio*0.45;
  ocean += exp(-length(uv-g7)*48.0)*pulse7*bio*0.45;

  // ── vignette + tonemap ─────────────────────────────────────────
  float vig = 1.0 - smoothstep(0.32, 0.75, length(uv - 0.5));
  ocean *= 0.55 + 0.45 * vig;
  ocean  = ocean / (ocean + 0.28) * 1.28;

  gl_FragColor = vec4(clamp(ocean, 0.0, 1.0), 1.0);
}
`);
