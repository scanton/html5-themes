import { createGLVariation } from '../engine.js';

export default createGLVariation('Bokeh', `
float bokehDot(vec2 uv, vec2 center, float radius, float softness) {
  float d = length(uv - center);
  return smoothstep(radius, radius - softness, d);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float asp = u_resolution.x / u_resolution.y;
  uv.x *= asp;
  float t = u_time * 0.18;

  // Warm ivory base
  vec3 col = vec3(0.98, 0.96, 0.91);

  // Bokeh layer — multiple soft circles drifting slowly
  float b = 0.0;
  for (int i = 0; i < 14; i++) {
    float fi = float(i);
    vec2 seed = vec2(fi * 1.37 + 0.5, fi * 0.91 + 0.3);
    float rx = fract(hash(seed) * 7.3);
    float ry = fract(hash(seed + 0.7) * 5.1);
    float rr = 0.04 + fract(hash(seed + 1.3) * 3.7) * 0.09;
    float speed = 0.04 + fract(hash(seed + 2.1) * 2.9) * 0.06;
    float phase = hash(seed + 3.7) * 6.28;

    vec2 center = vec2(rx * asp, ry);
    center.x += sin(t * speed * 1.1 + phase) * 0.04 * asp;
    center.y += sin(t * speed + phase * 1.3) * 0.03;
    center.y = fract(center.y + 0.5 + t * speed * 0.3) - 0.05;

    float alpha = 0.18 + fract(hash(seed + 4.1) * 2.3) * 0.22;
    b += bokehDot(uv, center, rr, rr * 0.55) * alpha;
  }

  // Gold-rose tint for the bokeh blobs
  vec3 bokehCol = mix(vec3(1.0, 0.88, 0.72), vec3(1.0, 0.76, 0.82), fract(b * 0.7));
  col = mix(col, bokehCol, clamp(b, 0.0, 0.85));

  // Subtle warm vignette
  float vig = 1.0 - length(uv - vec2(asp * 0.5, 0.5)) * 0.38;
  col *= clamp(vig, 0.7, 1.0);

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`);
