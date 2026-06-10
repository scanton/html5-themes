import { createGLVariation } from '../engine.js';

// Stage Lights — concert moving-head spotlights sweeping through haze.
// Each beam has a hot white core inside a coloured cone, made volumetric
// by drifting smoke that the light catches. Fixture glow at the source,
// floor wash where beams land, and a dark hazy stage behind.

export default createGLVariation('Stage Lights', `
// signed perpendicular distance & along-distance of p from ray (o, dir)
vec2 rayCoords(vec2 p, vec2 o, vec2 dir) {
  vec2 rel = p - o;
  float along = dot(rel, dir);
  float perp  = rel.x * dir.y - rel.y * dir.x;
  return vec2(along, perp);
}

vec3 beam(vec2 p, vec2 o, float ang, vec3 colr, float t, float haze) {
  vec2 dir = vec2(sin(ang), -cos(ang));   // pointing downward-ish
  vec2 rc = rayCoords(p, o, dir);
  if (rc.x < 0.0) return vec3(0.0);
  // cone half-width grows along the beam
  float halfW = 0.012 + rc.x * 0.14;
  float core  = exp(-pow(rc.y / (halfW * 0.35), 2.0));
  float cone  = exp(-pow(rc.y / halfW, 2.0));
  // attenuate along the throw, brighten with smoke density
  float att = exp(-rc.x * 1.1) * (0.45 + haze * 0.9);
  return (colr * cone + vec3(1.0) * core * 0.5) * att;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float asp = u_resolution.x / u_resolution.y;
  vec2 p = vec2(uv.x * asp, uv.y);
  float t = u_time;

  // ── dark stage backdrop with drifting smoke ──
  vec3 col = vec3(0.015, 0.012, 0.025);
  float haze = fbm(p * 2.2 + vec2(t * 0.06, t * 0.02));
  haze = haze * 0.7 + fbm(p * 5.0 - vec2(t * 0.04, 0.0)) * 0.3;
  col += vec3(0.020, 0.018, 0.030) * haze;

  // ── four moving heads on an overhead truss ──
  vec3 colors[4];
  colors[0] = vec3(1.0, 0.10, 0.12);   // red
  colors[1] = vec3(0.12, 0.45, 1.0);   // blue
  colors[2] = vec3(1.0, 0.75, 0.10);   // amber
  colors[3] = vec3(0.55, 0.12, 1.0);   // violet

  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    vec2 o = vec2((0.17 + fi * 0.22) * asp, 1.02);
    // sweep: each head swings at its own rate with pauses
    float sw = sin(t * (0.45 + fi * 0.11) + fi * 1.9);
    float ang = sw * 0.62;
    col += beam(p, o, ang, colors[i], t, haze);
    // fixture glow at the source
    float fx = exp(-length(p - o) * 14.0);
    col += (colors[i] * 0.8 + 0.4) * fx;
  }

  // ── occasional white strobe glints from the back truss ──
  for (int s = 0; s < 3; s++) {
    float fs = float(s);
    float strobe = pow(max(0.0, sin(t * (1.3 + fs * 0.7) + fs * 2.6)), 24.0);
    vec2 sp = vec2((0.28 + fs * 0.24) * asp, 0.93);
    col += vec3(0.9, 0.92, 1.0) * exp(-length(p - sp) * 9.0) * strobe * 0.7;
  }

  // ── floor: beams land in pools of light with reflection ──
  if (uv.y < 0.16) {
    float fl = (0.16 - uv.y) / 0.16;
    // mirror an approximate copy of the air just above the floor line
    col += col * fl * 0.55;
    col *= 1.0 - fl * 0.25;            // darken the very front edge
  }

  // gentle vignette
  float vig = smoothstep(1.5, 0.4, length(p - vec2(asp * 0.5, 0.45)));
  col *= 0.7 + 0.3 * vig;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`);
