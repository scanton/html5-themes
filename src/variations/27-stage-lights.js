import { createGLVariation } from '../engine.js';

export default createGLVariation('Stage Lights', `
float spotlight(vec2 uv, vec2 origin, vec2 dir, float coneAngle, float falloff) {
  vec2 toP = normalize(uv - origin);
  float d = length(uv - origin);
  float ang = acos(clamp(dot(toP, normalize(dir)), -1.0, 1.0));
  float cone = smoothstep(coneAngle, coneAngle * 0.3, ang);
  return cone / (1.0 + d * d * falloff);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float asp = u_resolution.x / u_resolution.y;
  uv.x *= asp;
  float t = u_time * 0.55;

  // Near-black stage background with slight haze
  vec3 col = vec3(0.03, 0.02, 0.04);
  float haze = fbm(uv * 2.5 + t * 0.08) * 0.06;
  col += haze;

  // Sweeping spotlights from top — 4 lights
  vec3 lightColors[4];
  lightColors[0] = vec3(1.0, 0.15, 0.1);   // red
  lightColors[1] = vec3(0.1, 0.5, 1.0);    // blue
  lightColors[2] = vec3(1.0, 0.85, 0.1);   // yellow
  lightColors[3] = vec3(0.2, 1.0, 0.4);    // green

  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    float phase = fi * 1.57 + t * (0.5 + fi * 0.13);
    float xPos = (0.2 + fi * 0.22) * asp;
    vec2 origin = vec2(xPos, 1.08);
    // Sweep direction — bottom of screen, oscillating
    float sweepX = sin(phase) * 0.35 * asp;
    vec2 dir = normalize(vec2(sweepX, -1.0));
    float beam = spotlight(uv, origin, dir, 0.22, 3.0);
    col += lightColors[i] * beam * 0.7;
  }

  // Floor glow reflection near bottom
  float floor_y = uv.y;
  if (floor_y < 0.12) {
    float refl = (0.12 - floor_y) / 0.12;
    col += col * refl * 0.4;
  }

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`);
