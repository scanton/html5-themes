import { createGLVariation } from '../engine.js';

export default createGLVariation('Koi Pond', `
void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float asp = u_resolution.x / u_resolution.y;
  float t = u_time * 0.4;

  vec2 p = uv * vec2(asp, 1.0);

  // Rippled water surface — layered waves
  float wave = 0.0;
  wave += sin(p.x * 8.0 - t * 1.8 + p.y * 3.0) * 0.012;
  wave += sin(p.x * 5.5 + t * 1.2 - p.y * 4.5) * 0.009;
  wave += sin(p.y * 9.0 + t * 2.1 + p.x * 2.0) * 0.008;
  wave += vnoise(p * 4.0 + t * 0.3) * 0.018;

  vec2 distorted = uv + wave;

  // Caustics — light patterns on pond floor
  float caustic = 0.0;
  caustic += fbm(distorted * 6.0 + t * 0.22) * 0.5;
  caustic += fbm(distorted * 11.0 - t * 0.15) * 0.25;
  caustic  = pow(clamp(caustic, 0.0, 1.0), 1.8);

  // Water colour gradient: deep jade → aqua
  vec3 deepWater = vec3(0.06, 0.20, 0.18);
  vec3 shallowWater = vec3(0.18, 0.52, 0.44);
  float depth = fbm(distorted * 3.0 + t * 0.07) * 0.5 + 0.5;
  vec3 waterCol = mix(deepWater, shallowWater, depth);

  // Add caustic light: warm golden shimmer
  vec3 causticLight = vec3(0.85, 0.95, 0.65);
  waterCol += causticLight * caustic * 0.28;

  // Surface specular highlight band
  float spec = pow(max(0.0, sin(uv.y * 12.0 + wave * 40.0 + t * 2.5)), 14.0) * 0.12;
  waterCol += spec;

  // Lily pad patches — static dark-green ellipses
  float pads = 0.0;
  vec2 padCenters[3];
  padCenters[0] = vec2(0.18, 0.72);
  padCenters[1] = vec2(0.82 * asp, 0.28);
  padCenters[2] = vec2(0.55 * asp, 0.88);
  for (int i = 0; i < 3; i++) {
    vec2 d = (p - padCenters[i]) * vec2(1.0, 1.5);
    float r = length(d);
    pads += smoothstep(0.08, 0.06, r);
  }
  vec3 padCol = vec3(0.10, 0.30, 0.12);
  waterCol = mix(waterCol, padCol, clamp(pads, 0.0, 1.0));

  gl_FragColor = vec4(clamp(waterCol, 0.0, 1.0), 1.0);
}
`);
