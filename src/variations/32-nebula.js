import { createGLVariation } from '../engine.js';

// Nebula — flying fast and straight INTO deep space. A volumetric
// raymarch through a 3D density field streams the gas past and around
// you, while warp-streak stars radiate outward from the central
// vanishing point (log-polar starfield). A faint destination glow sits
// dead ahead; the nebula's transmittance dims the stars it covers.

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

  // camera: fast, straight forward — wide FOV amplifies the speed
  vec3 ro = vec3(sin(t * 0.07) * 0.25, cos(t * 0.05) * 0.18, t * 1.15);
  vec3 rd = normalize(vec3(q, 0.85));

  // ── volumetric march: gas streams past and around the camera ──
  vec3 col = vec3(0.0);
  float trans = 1.0;
  float td = 0.35;
  for (int i = 0; i < 24; i++) {
    vec3 p = ro + rd * td;
    float den = fbm3(p * 0.48) + n3(p * 2.1) * 0.10 - 0.47;
    if (den > 0.0) {
      den = min(den, 0.42);
      float hueMix = 0.5 + 0.5 * sin(p.z * 0.30 + p.x * 0.22);
      vec3 emit = mix(vec3(0.45, 0.12, 0.80),        // violet
                      vec3(0.08, 0.40, 0.85),        // teal-blue
                      hueMix);
      emit = mix(emit, vec3(1.0, 0.42, 0.60), den * 2.0);  // pink cores
      col += emit * den * trans * 0.62;
      trans *= 1.0 - den * 0.62;
    }
    td += 0.48;
  }

  // ── warp stars: streaks radiating out from the vanishing point ──
  // log-polar space: motion in -v is exponential outward expansion,
  // exactly what forward flight looks like.
  float ang = atan(q.y, q.x);
  float rad = length(q);
  vec3 starCol = vec3(0.0);
  for (int s = 0; s < 3; s++) {
    float fs = float(s);
    float nAng = 16.0 + fs * 9.0;                 // angular lanes
    float spd  = 1.3 + fs * 0.8;                  // nearer layer = faster
    vec2 sp = vec2(ang * nAng / 6.28318,
                   log(rad + 0.04) * 3.2 - t * spd + fs * 23.0);
    vec2 id = floor(sp);
    vec2 f = fract(sp) - 0.5;
    float h1 = hash(id + fs * 37.0);
    if (h1 > 0.74) {
      vec2 c = (vec2(hash(id + 3.7), hash(id + 9.1)) - 0.5) * 0.5;
      vec2 d = f - c;
      // tight across the lane, stretched along the direction of travel
      float m = exp(-abs(d.x) * 24.0 - abs(d.y) * 6.0);
      m *= smoothstep(0.02, 0.30, rad);           // born near the centre
      m *= 0.55 + 0.45 * h1;
      starCol += mix(vec3(1.0, 0.95, 0.88), vec3(0.72, 0.84, 1.0),
                     step(0.90, h1)) * m;
    }
  }
  col += starCol * 1.15 * (0.30 + 0.70 * trans);  // gas occludes stars

  // ── destination: a soft glow dead ahead at the vanishing point ──
  col += vec3(0.55, 0.62, 0.95) * exp(-rad * 5.5) * 0.50 * trans;
  col += vec3(0.30, 0.22, 0.50) * exp(-rad * 2.0) * 0.18 * trans;

  // deep-space base
  col += vec3(0.010, 0.008, 0.030) * trans;

  // tone shaping
  col = col / (1.0 + col);
  col = pow(col, vec3(0.90));

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`);
