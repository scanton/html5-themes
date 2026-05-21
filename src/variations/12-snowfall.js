// Snowfall — WebGL / GLSL.
//
// Snowflake shape: SDF with D6 (dihedral-6) symmetry.  The angle is folded
// into a 30° sector so one arm + two branch pairs define all six arms and their
// twelve branches automatically.  Each particle gets a hash-based rotation so
// every flake has a unique orientation.
//
// Particle system: 1-D column strips.  Each particle's y spans the full screen
// height with a 12% off-screen margin so the fract() wrap always happens
// outside the visible frame — flakes enter from above and exit below, never
// popping in mid-air.  Two staggered particles per strip, ±2 column neighbours.
//
// Three depth layers (far/mid/near) vary density, speed, size, and brightness.
// Air currents: slow global gust + per-flake sinusoidal weave.

import { createGLVariation } from '../engine.js';

export default createGLVariation('Snowfall', `
// ── Signed distance to a capsule (thick line segment) ────────────
float sdCap(vec2 p, vec2 a, vec2 b, float r) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h) - r;
}

// ── Snowflake SDF — arm length normalised to 1.0 ─────────────────
// D6 symmetry: folds any 2-D point into a 30° sector.
// One main arm + 3 branch pairs + centre disc define the full shape.
float snowflakeSDF(vec2 p) {
  // Fold to 30-degree sector so arm lies along +x, branches above (+y)
  float ang = atan(p.y, p.x);
  ang = mod(ang + 6.28318, 6.28318);        // [0, 2π)
  ang = mod(ang, 1.04720);                   // [0, π/3)
  ang = min(ang, 1.04720 - ang);             // [0, π/6] — mirror
  float r = length(p);
  vec2 q = r * vec2(cos(ang), sin(ang));     // q.x = along arm, q.y ≥ 0

  // Thickness constants (fraction of arm length R = 1)
  float at = 0.068;   // main arm half-thickness
  float bt = 0.040;   // outer/mid branch half-thickness
  float it = 0.028;   // inner branch half-thickness

  // Main arm: centre → tip
  float d = sdCap(q, vec2(0.00, 0.0), vec2(1.00, 0.0), at);

  // Branch direction: 60° from the arm
  vec2 bDir = vec2(0.500, 0.866);   // (cos 60°, sin 60°)

  // Outer branch pair — at 71% of arm, length 30%
  vec2 ob = vec2(0.71, 0.0);
  d = min(d, sdCap(q, ob, ob + bDir * 0.30, bt));
  // Small terminal blob at outer branch tip
  d = min(d, length(q - (ob + bDir * 0.30)) - bt * 1.20);

  // Middle branch pair — at 47% of arm, length 22%
  vec2 mb = vec2(0.47, 0.0);
  d = min(d, sdCap(q, mb, mb + bDir * 0.22, bt));
  // Terminal blob
  d = min(d, length(q - (mb + bDir * 0.22)) - bt * 1.10);

  // Inner branch pair — at 26% of arm, length 14%
  vec2 ib = vec2(0.26, 0.0);
  d = min(d, sdCap(q, ib, ib + bDir * 0.14, it));

  // Centre hexagon: a circle in the folded sector = hex in full space
  d = min(d, length(q) - 0.11);

  // Arm-tip blob
  d = min(d, length(q - vec2(1.0, 0.0)) - at * 1.10);

  return d;
}

// ── One depth layer — strip-based, full-screen-height travel ─────
// numS = horizontal strips.  spd = fall speed (screen-heights/sec).
// wnd = lateral wind amplitude (screen fraction).
// flkR = flake radius in screen fraction.  seed = layer seed.
float snowLayer(vec2 uv, float t, float asp,
                float numS, float spd, float wnd, float flkR, float seed) {
  float sx     = uv.x * numS;
  float cell_x = floor(sx);
  float gust   = sin(t * 0.20 + seed * 2.31) * wnd;
  float bright = 0.0;

  for (int i = -2; i <= 2; i++) {
    float nc = cell_x + float(i);
    for (int k = 0; k < 2; k++) {
      float sk = float(k) * 31.71 + seed;

      float rx = hash(vec2(nc + 17.30, sk));   // x offset within strip
      float ry = hash(vec2(nc,          sk));   // initial y phase
      float rs = hash(vec2(nc +  5.91,  sk));   // speed variation
      float rw = hash(vec2(nc + 11.37,  sk));   // wind variation
      float rp = hash(vec2(nc + 23.13,  sk));   // wind phase
      float rr = hash(vec2(nc + 37.41,  sk));   // rotation

      // Fall: py goes from 1.12 (above screen) down to -0.12 (below screen).
      // fract() wrap jumps from -0.12 → 1.12, both off-screen → no pop-in.
      float py_raw = fract(ry + t * spd * (0.80 + rs * 0.40));
      float py = 1.12 - py_raw * 1.24;

      float windOff = gust + sin(t * (0.26 + rw * 0.42) + rp * 6.28) * wnd * 0.55;
      float px = (nc + rx) / numS + windOff;

      // Screen-space offset from fragment to flake centre
      vec2 diff = vec2((uv.x - px) * asp, uv.y - py);

      // Early cull: flake can't reach further than ~1.4 × its radius
      if (length(diff) < flkR * 1.5) {
        // Map to local space (arm length = 1.0)
        vec2 lp = diff / flkR;

        // Random rotation — each flake has a unique orientation
        float rot = rr * 1.04720;  // [0, π/3] (D6 period)
        float cr = cos(rot), sr = sin(rot);
        lp = vec2(cr * lp.x + sr * lp.y, -sr * lp.x + cr * lp.y);

        float sdf = snowflakeSDF(lp);
        float aa  = 0.08;   // edge smoothness in local units
        bright += smoothstep(aa, -aa, sdf);
      }
    }
  }
  return clamp(bright, 0.0, 1.0);
}

void main() {
  vec2  uv  = gl_FragCoord.xy / u_resolution;
  float asp = u_resolution.x / u_resolution.y;
  float t   = u_time;

  // ── Sky: cold dark-blue winter night ─────────────────────────
  vec3 skyTop = vec3(0.04, 0.07, 0.15);
  vec3 skyBot = vec3(0.12, 0.17, 0.26);
  vec3 col = mix(skyTop, skyBot, uv.y);

  // Faint cloud texture
  vec2 cp = uv * vec2(asp, 1.0);
  float cloud = fbm(cp * 2.2 + vec2(t * 0.035, 0.0));
  col += cloud * vec3(0.03, 0.04, 0.06);

  // Ground glow at bottom
  col = mix(col, vec3(0.66, 0.72, 0.80), smoothstep(0.10, 0.0, uv.y) * 0.50);

  // ── Three depth layers: distant → near ────────────────────────
  // Far:  60 strips × 2 = 120 particles, tiny slow flakes (~2.4 px)
  float far  = snowLayer(uv, t, asp, 60.0, 0.024, 0.015, 0.0030, 1.00);
  // Mid:  24 strips × 2 = 48 particles, medium flakes (~5 px)
  float mid  = snowLayer(uv, t, asp, 24.0, 0.052, 0.035, 0.0065, 4.73);
  // Near: 10 strips × 2 = 20 particles, large fast flakes (~14 px)
  float near = snowLayer(uv, t, asp, 10.0, 0.105, 0.060, 0.0175, 8.31);

  vec3 snowCol = vec3(1.0);
  col = mix(col, snowCol, far  * 0.42);
  col = mix(col, snowCol, mid  * 0.72);
  col = mix(col, snowCol, near);

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`);
