import { createGLVariation } from '../engine.js';

export default createGLVariation('Unicorn Sky', `
void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float asp = u_resolution.x / u_resolution.y;
  float t = u_time * 0.22;

  // Softly shifting pastel rainbow gradient
  // Base: diagonal gradient lavender → pink → peach
  float diag = (uv.x + (1.0 - uv.y)) * 0.5;
  vec3 lavender = vec3(0.84, 0.72, 0.98);
  vec3 pink     = vec3(1.00, 0.72, 0.86);
  vec3 peach    = vec3(1.00, 0.87, 0.72);
  vec3 mint     = vec3(0.72, 0.96, 0.88);
  vec3 skyBlue  = vec3(0.72, 0.88, 1.00);

  // Animated slow swirl
  vec2 p = uv * vec2(asp, 1.0);
  float swirl = fbm(p * 1.4 + t * 0.12) * 0.5 + 0.5;
  float swirl2 = fbm(p * 2.2 - t * 0.09 + 1.7) * 0.5 + 0.5;

  // Blend between 5 pastels using swirlnoise
  vec3 col;
  float phase = swirl * 2.5 + diag * 1.5;
  if (phase < 1.0)
    col = mix(lavender, pink, phase);
  else if (phase < 1.5)
    col = mix(pink, peach, (phase - 1.0) * 2.0);
  else if (phase < 2.0)
    col = mix(peach, mint, (phase - 1.5) * 2.0);
  else
    col = mix(mint, skyBlue, clamp((phase - 2.0), 0.0, 1.0));

  // Subtle shimmer / sparkle via fast noise
  float shimmer = pow(vnoise(p * 14.0 + t * 1.8), 4.0) * 0.18;
  col += shimmer;

  // Soft cloud puffs
  float cloud = 0.0;
  cloud += smoothstep(0.42, 0.55, fbm(p * 3.5 + t * 0.06));
  cloud += smoothstep(0.44, 0.56, fbm(p * 3.5 + vec2(1.3, 0.7) - t * 0.05));
  cloud  = clamp(cloud, 0.0, 1.0);
  col    = mix(col, vec3(1.0, 0.97, 0.99), cloud * 0.5);

  // Keep it bright and airy
  col = mix(col, vec3(1.0), 0.15);

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`);
