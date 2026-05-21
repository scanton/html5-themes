// Halloween — WebGL / GLSL.
//
// A spooky October night sky: deep indigo-purple darkness, drifting cloud
// wisps, a full moon with FBM crater texture and greenish halo, twinkling
// stars, low purple fog rolling across the ground, and an eerie orange
// jack-o'-lantern glow from below.
//
// Bats: front-view silhouette SDF built from capsule segments — body, head,
// ears, inner wing panel, outer wing panel, and curved trailing membrane.
// Two depth layers (near and far) with independently hashed positions,
// speeds, sizes, and wing-flap phases.  Flap animation: the wing-tip y
// coordinate oscillates with sin(), pulling the membrane up and down.

import { createGLVariation } from '../engine.js';

export default createGLVariation('Halloween', `
float sdCap(vec2 p, vec2 a, vec2 b, float r) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h) - r;
}

// Bat SDF — bilateral symmetry, wingspan ≈ ±1 along x.
// flap in [-1, +1]: +1 = wings swept up, -1 = wings swept down.
float batSDF(vec2 p, float flap) {
  float px    = abs(p.x);
  float tipY  = flap * 0.28;
  float elbY  = flap * 0.11;
  float trailY = tipY * 0.38 + 0.30;

  float d = length(vec2(px * 2.9, p.y)) - 0.13;                         // body
  d = min(d, length(vec2(p.x * 2.0, p.y - 0.22)) - 0.10);               // head
  d = min(d, length(vec2(px - 0.08, p.y - 0.35)) - 0.046);              // ear nubs
  d = min(d, sdCap(vec2(px, p.y), vec2(0.13, 0.0),   vec2(0.40, elbY),  0.068)); // inner wing
  d = min(d, sdCap(vec2(px, p.y), vec2(0.40, elbY),  vec2(0.90, tipY),  0.050)); // outer wing
  d = min(d, sdCap(vec2(px, p.y), vec2(0.90, tipY),  vec2(0.56, trailY),0.038)); // trailing 1
  d = min(d, sdCap(vec2(px, p.y), vec2(0.56, trailY),vec2(0.13, 0.17),  0.038)); // trailing 2
  return d;
}

// Horizontal bat particle layer.
// Bats fly left or right, wrap at screen edges, flap their wings.
float batLayer(vec2 uv, float t, float asp,
               float spd, float batR, float seed) {
  float bright = 0.0;
  for (int i = 0; i < 7; i++) {
    float fi  = float(i);
    float rx  = hash(vec2(fi + 0.5, seed));
    float ry  = hash(vec2(fi + 1.5, seed));
    float rs  = hash(vec2(fi + 2.5, seed));   // speed var
    float rfp = hash(vec2(fi + 3.5, seed));   // flap phase
    float rfs = hash(vec2(fi + 4.5, seed));   // flap speed
    float rsz = hash(vec2(fi + 5.5, seed));   // size
    float rdir= hash(vec2(fi + 6.5, seed));   // direction

    float dir   = rdir > 0.5 ? 1.0 : -1.0;
    float phase = fract(rx + t * spd * (0.72 + rs * 0.56));
    float px    = phase * (asp + 0.18) - 0.09;
    if (dir < 0.0) px = asp + 0.09 - phase * (asp + 0.18);

    float py = 0.36 + ry * 0.47;
    py += sin(t * (0.58 + rs * 0.52) + rfp * 6.28) * 0.030;

    vec2  diff = vec2(uv.x * asp - px, uv.y - py);
    float sz   = batR * (0.55 + rsz * 0.90);

    if (length(diff) < sz * 4.5) {
      float flapSpd = 2.8 + rfs * 2.6;
      float flap    = sin(t * flapSpd + rfp * 6.28318);

      vec2 lp = diff / sz;
      lp.x *= dir;   // face the direction of travel

      float sdf = batSDF(lp, flap);
      bright += smoothstep(0.05, -0.05, sdf);
    }
  }
  return clamp(bright, 0.0, 1.0);
}

void main() {
  vec2  uv  = gl_FragCoord.xy / u_resolution;
  float asp = u_resolution.x / u_resolution.y;
  vec2  p   = uv * vec2(asp, 1.0);
  float t   = u_time * 0.28;

  // ── Night sky: deep indigo-purple ────────────────────────────
  vec3 col = mix(vec3(0.04, 0.02, 0.10), vec3(0.01, 0.01, 0.05), uv.y);

  // Drifting cloud wisps
  float cloud = fbm(p * 1.25 + vec2(t * 0.042, 0.0));
  col += cloud * 0.055 * vec3(0.46, 0.14, 0.82);

  // Stars (twinkle)
  vec2  starCell = floor(uv * vec2(180.0, 102.0));
  float star     = hash(starCell);
  star = pow(max(star - 0.966, 0.0) * 29.0, 2.2);
  star *= 0.50 + 0.50 * sin(u_time * (1.8 + hash(starCell + 0.5) * 4.0));
  col += star * vec3(0.78, 0.84, 0.68);

  // ── Full moon ─────────────────────────────────────────────────
  vec2  moonC = vec2(0.73 * asp, 0.74);
  float moonR = 0.093;
  float moonD = length(p - moonC);

  // Greenish eerie halo
  col += vec3(0.48, 0.62, 0.32) * 0.22 * exp(-moonD * moonD * 15.0);
  // Moon disc with FBM crater texture
  float moonMask = smoothstep(moonR + 0.004, moonR - 0.004, moonD);
  vec2  mUV      = (p - moonC) / moonR;
  float moonTex  = fbm(mUV * 3.2 + vec2(0.9, 1.4));
  vec3  moonCol  = mix(vec3(0.88, 0.90, 0.76), vec3(0.64, 0.66, 0.50), moonTex * 0.55);
  col = mix(col, moonCol, moonMask);

  // ── Jack-o'-lantern warm glow from below ─────────────────────
  float gx = exp(-pow((uv.x - 0.50) * 2.5, 2.0));
  float gy = smoothstep(0.30, 0.0, uv.y);
  col += gx * gy * vec3(0.84, 0.30, 0.01) * 0.68;

  // ── Ground fog ────────────────────────────────────────────────
  float fog = mix(
    fbm(vec2(p.x * 0.82 + t * 0.068, 0.0)),
    fbm(vec2(p.x * 1.48 - t * 0.050, 0.5)),
    0.50
  );
  float fogMask = smoothstep(0.22, 0.0, uv.y) * fog;
  col = mix(col, vec3(0.24, 0.14, 0.40), fogMask * 0.75);

  // ── Bats ──────────────────────────────────────────────────────
  // Near: 7 larger bats,  Far: 7 smaller distant bats
  float bNear = batLayer(uv, t, asp, 0.112, 0.068, 1.00);
  float bFar  = batLayer(uv, t, asp, 0.058, 0.028, 8.37);

  col = mix(col, vec3(0.003, 0.001, 0.012), bNear);
  col = mix(col, vec3(0.018, 0.010, 0.042), bFar * 0.80);

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`);
