import { createGLVariation } from '../engine.js';

// Rain on Glass — looking through a rain-streaked window at a blurred
// night city. Drops slide down the pane wiggling and leaving beaded
// trails; each drop REFRACTS the city behind it and snaps it into
// focus (real lens behaviour — the world is sharp inside a droplet,
// blurred through the wet glass). Distant lightning flickers.

export default createGLVariation('Rain on Glass', `
float S(float a, float b, float x) { return smoothstep(a, b, x); }

// Blurred night-city bokeh behind the glass. 'sharp' = 1 inside a
// droplet (crisp discs), 0 on the wet pane (soft mush).
vec3 cityBg(vec2 p, float asp, float t, float sharp) {
  // night gradient + warm city glow rising from the bottom
  vec3 col = mix(vec3(0.012, 0.016, 0.045), vec3(0.10, 0.07, 0.10), 1.0 - p.y);
  col += vec3(0.20, 0.11, 0.05) * exp(-p.y * 2.6) * 0.9;

  for (int i = 0; i < 16; i++) {
    float fi = float(i);
    vec2 sd = vec2(fi * 1.93, fi * 3.11);
    float h1 = hash(sd), h2 = hash(sd + 5.0), h3 = hash(sd + 9.0), h4 = hash(sd + 13.0);
    vec2 c = vec2(h1 * asp, h2 * h2 * 0.75);     // lights cluster low
    float r = 0.018 + h3 * 0.05;
    float edge = mix(0.88, 0.25, sharp);          // blur amount
    float m = S(r, r * (1.0 - edge), length(p - c));
    vec3 lc = h4 < 0.55 ? vec3(1.0, 0.72, 0.35)   // sodium windows
            : h4 < 0.75 ? vec3(0.35, 0.65, 1.0)   // cool signage
            : h4 < 0.90 ? vec3(0.95, 0.30, 0.45)  // neon red
                        : vec3(0.55, 1.0, 0.75);  // green sign
    float tw = 0.85 + 0.15 * sin(t * (0.4 + h3) + h1 * 6.28);
    col += lc * m * (0.30 + 0.40 * h3) * tw;
  }

  // distant lightning: rare multi-flicker flashes lighting the sky
  float storm = sin(t * 0.41) * sin(t * 0.733 + 1.7) * sin(t * 0.281 + 4.0);
  float fl = pow(max(storm, 0.0), 8.0) * (0.70 + 0.30 * sin(t * 47.0));
  col += vec3(0.55, 0.62, 0.90) * fl * (1.4 - p.y * 0.6);

  return col;
}

// One layer of sliding drops in columns of width colW.
// Drops fall STRAIGHT, but follow a meander path with occasional kinks
// where the glass resists — not a rhythmic wiggle. Only some cycles in
// each column carry a drop, so the pane stays sparse.
// Returns (offsetX, offsetY, mask).
vec3 slideLayer(vec2 p, float t, float colW, float seed) {
  float ci = floor(p.x / colW);
  float cn = hash(vec2(ci * 7.31, seed));
  float speed = 0.05 + cn * 0.07;
  float raw = t * speed + cn * 13.7;
  float cyc = floor(raw);
  float prog = fract(raw);
  // gate: ~45% of passes actually have a drop in this column
  float gate = step(0.55, hash(vec2(ci * 3.17 + seed, cyc)));
  float yd = 1.08 - prog * 1.20;                     // slides top -> bottom

  // meander: mostly straight, with sparse kinks (sharpened noise)
  float mn = vnoise(vec2(p.y * 4.0, cn * 91.0)) - 0.5;
  float kink = mn * mn * mn * 8.0;                   // flat runs, rare bends
  float xPath = (ci + 0.5) * colW + kink * colW * 0.55;
  float mnD = vnoise(vec2(yd * 4.0, cn * 91.0)) - 0.5;
  float xDrop = (ci + 0.5) * colW + (mnD * mnD * mnD * 8.0) * colW * 0.55;

  vec2 dvec = vec2((p.x - xDrop) / colW, (p.y - yd) / (colW * 1.5));
  float dist = length(dvec);
  float drop = S(0.40, 0.22, dist) * gate;

  // beaded trail above the drop, following the same meander path
  float above = p.y - yd;
  float fade = S(0.0, 0.015, above) * exp(-above * 4.2);
  float cd = abs(p.x - xPath) / colW;
  float beads = pow(0.5 + 0.5 * sin(p.y * 230.0 + cn * 40.0), 2.0);
  float trail = S(0.14, 0.04, cd) * fade * (0.25 + 0.75 * beads) * gate;

  float mask = max(drop, trail * 0.6);
  vec2 off = dvec * drop * 1.4 + vec2((p.x - xPath) / colW, 0.35) * trail * 0.35;
  return vec3(off, mask);
}

// Static condensation micro-droplets that slowly grow and shrink.
// Only ~40% of cells hold a droplet, keeping the pane uncluttered.
vec3 microLayer(vec2 p, float t, float n, float seed) {
  vec2 g = p * n;
  vec2 id = floor(g);
  vec2 f = fract(g) - 0.5;
  float h0 = hash(id + seed + 130.0);
  if (h0 < 0.6) return vec3(0.0);
  float h1 = hash(id + seed), h2 = hash(id + seed + 50.0), h3 = hash(id + seed + 90.0);
  vec2 c = (vec2(h1, h2) - 0.5) * 0.55;
  float lc = 0.5 + 0.5 * sin(t * 0.15 + h1 * 6.28);   // slow lifecycle
  float r = (0.06 + h3 * 0.17) * (0.35 + 0.65 * lc);
  vec2 d = f - c;
  float m = S(r, r * 0.55, length(d));
  return vec3(d * m * 1.6, m);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float asp = u_resolution.x / u_resolution.y;
  vec2 p = vec2(uv.x * asp, uv.y);
  float t = u_time;

  // accumulate drops: two sparse sliding layers + two micro layers
  vec3 d1 = slideLayer(p, t, 0.16, 1.0);
  vec3 d2 = slideLayer(p + vec2(0.07, 0.0), t * 1.2, 0.105, 7.0);
  vec3 m1 = microLayer(p, t, 17.0, 3.0);
  vec3 m2 = microLayer(p, t * 0.8, 36.0, 11.0);

  vec2 off  = d1.xy + d2.xy + m1.xy * 0.6 + m2.xy * 0.35;
  float mask = max(max(d1.z, d2.z), max(m1.z * 0.85, m2.z * 0.6));

  // refract: inside drops the view shifts and inverts slightly,
  // and the city snaps into focus
  float sharp = clamp(mask * 1.6, 0.0, 1.0);
  vec3 col = cityBg(p - off * 0.38, asp, t, sharp);

  // wet-glass dimming outside the drops
  col *= mix(0.80, 1.12, sharp);

  // glints: a touch of rim light on the drops
  col += vec3(0.45, 0.50, 0.62) * pow(mask, 3.0) * 0.18;

  // window vignette
  float vig = S(1.5, 0.45, length(p - vec2(asp * 0.5, 0.5)));
  col *= 0.62 + 0.38 * vig;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`);
