import { createGLVariation } from '../engine.js';

// Nebula — a real volumetric raymarch through a 3D noise density field.
// The camera flies forward THROUGH the gas: clouds part around you with
// genuine parallax, dense cores glow hot pink against violet and teal
// wisps, and three star layers drift behind — dimmed where the nebula
// passes in front of them (true volumetric occlusion via transmittance).

export default createGLVariation('Nebula', `
float h3(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
}

// trilinear 3D value noise
float n3(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = h3(i);
  float b = h3(i + vec3(1.0, 0.0, 0.0));
  float c = h3(i + vec3(0.0, 1.0, 0.0));
  float d = h3(i + vec3(1.0, 1.0, 0.0));
  float e = h3(i + vec3(0.0, 0.0, 1.0));
  float g = h3(i + vec3(1.0, 0.0, 1.0));
  float h = h3(i + vec3(0.0, 1.0, 1.0));
  float j = h3(i + vec3(1.0, 1.0, 1.0));
  return mix(mix(mix(a, b, f.x), mix(c, d, f.x), f.y),
             mix(mix(e, g, f.x), mix(h, j, f.x), f.y), f.z);
}

float fbm3(vec3 p) {
  float v = 0.0, a = 0.52;
  for (int i = 0; i < 3; i++) {
    v += a * n3(p);
    p = p * 2.13 + vec3(1.7, 9.2, 4.1);
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 q = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;
  float t = u_time;

  // camera: flying forward, gently swaying
  vec3 ro = vec3(sin(t * 0.04) * 0.6, cos(t * 0.033) * 0.4, t * 0.22);
  vec3 rd = normalize(vec3(q + vec2(sin(t * 0.021) * 0.06, cos(t * 0.017) * 0.05), 1.15));

  // ── volumetric march ──────────────────────────────────────────
  vec3 col = vec3(0.0);
  float trans = 1.0;                       // transmittance
  float td = 0.6;
  for (int i = 0; i < 24; i++) {
    vec3 p = ro + rd * td;
    float den = fbm3(p * 0.55) + n3(p * 2.3) * 0.10 - 0.46;
    if (den > 0.0) {
      den = min(den, 0.42);
      // hue drifts along the flight path; hot cores blush pink
      float hueMix = 0.5 + 0.5 * sin(p.z * 0.35 + p.x * 0.2);
      vec3 emit = mix(vec3(0.45, 0.12, 0.80),        // violet
                      vec3(0.08, 0.40, 0.85),        // teal-blue
                      hueMix);
      emit = mix(emit, vec3(1.0, 0.42, 0.60), den * 2.0);  // pink cores
      col += emit * den * trans * 0.62;
      trans *= 1.0 - den * 0.62;
    }
    td += 0.40;
  }

  // ── stars: 3 parallax layers, occluded by the gas in front ────
  vec3 starCol = vec3(0.0);
  for (int s = 0; s < 3; s++) {
    float fs = float(s);
    float scale = 22.0 + fs * 26.0;
    // nearer layers (smaller scale index) slide past faster
    vec2 sp = q * scale + vec2(0.0, -t * (0.5 - fs * 0.15)) + fs * 17.0;
    vec2 id = floor(sp);
    vec2 f = fract(sp) - 0.5;
    float h1 = hash(id + fs * 31.0);
    if (h1 > 0.92) {
      vec2 c = (vec2(hash(id + 3.7), hash(id + 9.1)) - 0.5) * 0.7;
      float tw = 0.65 + 0.35 * sin(t * (1.0 + h1 * 3.0) + h1 * 40.0);
      float m = exp(-length(f - c) * (14.0 + fs * 6.0)) * tw;
      vec3 sc = h1 > 0.975 ? vec3(0.75, 0.85, 1.0) : vec3(1.0, 0.95, 0.88);
      starCol += sc * m * (1.1 - fs * 0.3);
    }
  }
  col += starCol * (0.25 + 0.75 * trans);   // gas dims the stars behind it

  // ── deep-space base + a distant galactic glow ─────────────────
  col += vec3(0.012, 0.010, 0.035) * trans;
  float gd = length(q - vec2(0.25, 0.12));
  col += vec3(0.30, 0.15, 0.45) * exp(-gd * 2.6) * 0.30 * trans;

  // gentle tone shaping
  col = col / (1.0 + col);            // soft tonemap
  col = pow(col, vec3(0.92));

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`);
