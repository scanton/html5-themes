// Lava Lamp — WebGL / GLSL.
// 6 metaballs merged with smooth-min (smin) for organic blending.
// Heat map coloring: dark red edges → bright amber core.
// Buoyancy motion encoded as independent sin/cos orbits per blob.

import { createGLVariation } from '../engine.js';

export default createGLVariation('Lava Lamp', `
float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5*(b-a)/k, 0.0, 1.0);
  return mix(b, a, h) - k*h*(1.0-h);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float t = u_time * 0.22;

  // 6 blob positions — independent sinusoidal orbits create the
  // buoyant rising-and-sinking lava lamp motion.
  vec2 b0 = vec2(0.50 + 0.28*sin(t*0.71),        0.50 + 0.30*cos(t*0.53));
  vec2 b1 = vec2(0.30 + 0.22*sin(t*0.43 + 1.00), 0.38 + 0.28*cos(t*0.67 + 0.50));
  vec2 b2 = vec2(0.65 + 0.20*sin(t*0.59 + 2.10), 0.62 + 0.26*cos(t*0.41 + 1.80));
  vec2 b3 = vec2(0.40 + 0.24*sin(t*0.35 + 3.20), 0.72 + 0.18*cos(t*0.82 + 2.40));
  vec2 b4 = vec2(0.55 + 0.15*sin(t*0.91 + 4.10), 0.25 + 0.22*cos(t*0.61 + 3.70));
  vec2 b5 = vec2(0.22 + 0.18*sin(t*0.47 + 5.30), 0.55 + 0.25*cos(t*0.73 + 4.90));

  float r0 = 0.16 + 0.030*sin(t*1.10);
  float r1 = 0.14 + 0.020*sin(t*0.80 + 1.0);
  float r2 = 0.12 + 0.025*sin(t*1.30 + 2.0);
  float r3 = 0.11 + 0.020*sin(t*0.90 + 3.0);
  float r4 = 0.13 + 0.015*sin(t*1.20 + 4.0);
  float r5 = 0.10 + 0.018*sin(t*1.05 + 5.0);

  float d = length(uv - b0) - r0;
  d = smin(d, length(uv - b1) - r1, 0.09);
  d = smin(d, length(uv - b2) - r2, 0.09);
  d = smin(d, length(uv - b3) - r3, 0.09);
  d = smin(d, length(uv - b4) - r4, 0.09);
  d = smin(d, length(uv - b5) - r5, 0.09);

  // Dark background with subtle warmth at the bottom (heat source)
  vec3 bg = vec3(0.04, 0.01, 0.01) + vec3(0.03, 0.005, 0.0) * (1.0 - uv.y);

  // Soft glow halo surrounding each blob
  float glow = exp(-max(d, 0.0) * 13.0);

  // Interior: heat ramp from dark-red edge → amber mid → pale-gold core
  float interior = clamp(-d *  8.0, 0.0, 1.0);
  float core     = clamp(-d * 22.0, 0.0, 1.0);
  vec3 lavaEdge  = vec3(0.72, 0.08, 0.01);
  vec3 lavaMid   = vec3(1.00, 0.44, 0.02);
  vec3 lavaCore  = vec3(1.00, 0.88, 0.38);
  vec3 lavaCol   = mix(lavaEdge, lavaMid, interior);
  lavaCol        = mix(lavaCol,  lavaCore, core * core);

  // Vertical heat gradient: slightly cooler (darker) at the top
  lavaCol *= 0.65 + 0.35 * (1.0 - uv.y * 0.5);

  vec3 col = bg;
  col += glow * vec3(0.55, 0.07, 0.0) * 0.45;
  col  = mix(col, lavaCol, smoothstep(0.018, -0.008, d));

  // Subtle barrel vignette
  float vig = length((uv - 0.5) * vec2(1.15, 1.0));
  col *= 1.0 - smoothstep(0.40, 0.72, vig) * 0.65;

  gl_FragColor = vec4(col, 1.0);
}
`);
