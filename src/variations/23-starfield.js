// Starfield — WebGL / GLSL.
//
// Deep space: a rich nebula backdrop with three parallax star layers and
// occasional shooting stars.
//
// Nebula: three overlapping FBM cloud masses in complementary colours
// (cobalt blue, deep violet, rose-magenta) are domain-warped with slow
// orbital offsets so the gas clouds drift and billow very gradually.
// A brighter emission core sits at the nebula centre.
//
// Stars: three depth layers sampled from a hash grid — far (tiny, dim,
// dense), mid (medium, twinkling), near (large, bright, sparse with a
// diffraction cross glyph).  Twinkle is per-star sinusoidal brightness
// modulation at a unique frequency.
//
// Shooting stars: four independent streaks cycle through their orbit.
// Each travels a straight line across the screen, leaving a tapered
// bright-white trail that decays quickly.

import { createGLVariation } from '../engine.js';

export default createGLVariation('Starfield', `
// Diffraction cross glyph for bright foreground stars
float starCross(vec2 p, float r) {
  float arm = smoothstep(r * 4.0, 0.0, abs(p.y)) * smoothstep(r * 0.6, 0.0, abs(p.x));
  arm = max(arm, smoothstep(r * 4.0, 0.0, abs(p.x)) * smoothstep(r * 0.6, 0.0, abs(p.y)));
  return arm * exp(-length(p) / (r * 2.5));
}

// One shooting star — returns glow at p for this seed.
vec3 shootingStar(vec2 p, float t, float seed) {
  // Random direction, position, timing
  float period = 5.0 + hash(vec2(seed, 1.0)) * 7.0;
  float phase  = fract(t / period + hash(vec2(seed, 2.0)));

  // Only visible during the first 25% of its cycle
  if (phase > 0.25) return vec3(0.0);

  float prog   = phase / 0.25;   // 0→1 while visible
  float startX = hash(vec2(seed, 3.0));
  float startY = 0.35 + hash(vec2(seed, 4.0)) * 0.55;
  float angle  = -0.38 - hash(vec2(seed, 5.0)) * 0.40;   // slightly downward

  float tailLen = 0.28 + hash(vec2(seed, 6.0)) * 0.20;
  float headX   = startX + prog * cos(angle) * 0.45;
  float headY   = startY + prog * sin(angle) * 0.45;

  // Distance from fragment to the streak line segment
  vec2 a = vec2(startX, startY);
  vec2 b = vec2(headX, headY);
  vec2 pa = p - a, ba = b - a;
  float hh = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  vec2  closest = a + ba * hh;
  float dStreak = length(p - closest);

  // Width falloff + fade along tail (bright at head, dim at tail)
  float along = dot(pa, normalize(ba)) / length(ba);
  float fade  = clamp(1.0 - along, 0.0, 1.0);   // brighter toward head
  fade *= (1.0 - prog * prog);                   // overall fade as star passes
  float glow  = exp(-dStreak * dStreak * 2200.0) * fade * 2.8;

  return vec3(0.92, 0.96, 1.0) * glow;
}

void main() {
  vec2  uv  = gl_FragCoord.xy / u_resolution;
  float asp = u_resolution.x / u_resolution.y;
  vec2  p   = uv * vec2(asp, 1.0);
  float t   = u_time * 0.12;

  // ── Deep space background ─────────────────────────────────────
  vec3 col = vec3(0.01, 0.01, 0.04);   // near-black void

  // ── Nebula: three FBM cloud masses, domain-warped ─────────────
  // Warp offsets slowly orbit so the nebula breathes
  vec2 warpA = vec2(cos(t * 0.31) * 0.55, sin(t * 0.28) * 0.50);
  vec2 warpB = vec2(sin(t * 0.24) * 0.60, cos(t * 0.33) * 0.48);

  // Cloud 1: cobalt-blue, centred upper-left
  vec2  c1cen = vec2(0.30 * asp, 0.65);
  float n1    = fbm((p - c1cen) * 1.2 + warpA);
  float n1w   = fbm((p - c1cen) * 2.0 + warpB * 1.5);
  float nb1   = smoothstep(0.20, 0.68, n1 * 0.7 + n1w * 0.3);
  col += vec3(0.04, 0.10, 0.55) * nb1 * 0.80;

  // Cloud 2: deep violet, centred right
  vec2  c2cen = vec2(0.72 * asp, 0.40);
  float n2    = fbm((p - c2cen) * 1.0 + warpB);
  float nb2   = smoothstep(0.18, 0.65, n2);
  col += vec3(0.22, 0.04, 0.52) * nb2 * 0.75;

  // Cloud 3: rose-magenta, centred lower-mid
  vec2  c3cen = vec2(0.50 * asp, 0.25);
  float n3    = fbm((p - c3cen) * 1.4 - warpA * 0.8);
  float nb3   = smoothstep(0.22, 0.70, n3);
  col += vec3(0.50, 0.06, 0.30) * nb3 * 0.60;

  // Bright emission core — hot white-cyan centre of the nebula
  vec2  coreCen = vec2(0.46 * asp, 0.48);
  float coreDist= length(p - coreCen);
  col += vec3(0.40, 0.70, 1.00) * exp(-coreDist * coreDist * 5.5) * 0.55;

  // ── Far star layer — dense tiny dots ─────────────────────────
  vec2  fc   = floor(uv * vec2(300.0, 175.0));
  float fStar= hash(fc);
  fStar = pow(max(fStar - 0.960, 0.0) * 25.0, 1.8);
  col += fStar * vec3(0.70, 0.74, 0.85);

  // ── Mid star layer — twinkling ────────────────────────────────
  vec2  mc    = floor(uv * vec2(140.0, 82.0));
  float mStar = hash(mc);
  mStar = pow(max(mStar - 0.940, 0.0) * 17.0, 2.0);
  mStar *= 0.55 + 0.45 * sin(u_time * (1.2 + hash(mc + 0.5) * 3.5) + hash(mc + 1.0) * 6.28);
  col += mStar * vec3(0.80, 0.85, 1.00);

  // ── Near star layer — bright with diffraction cross ───────────
  vec2  nc2  = floor(uv * vec2(55.0, 32.0));
  float nStar= hash(nc2);
  if (nStar > 0.92) {
    float nBright = pow((nStar - 0.92) * 12.5, 1.8);
    nBright *= 0.65 + 0.35 * sin(u_time * (0.8 + hash(nc2 + 0.7) * 2.2) + hash(nc2 + 1.5) * 6.28);
    // Centre of this star in screen space
    vec2 sCen = (nc2 + 0.5) / vec2(55.0, 32.0);
    vec2 sDiff = (uv - sCen) * vec2(asp, 1.0);
    float starR = 0.0025 + (nStar - 0.92) * 0.018;
    float disc  = 1.0 - smoothstep(starR * 0.5, starR, length(sDiff));
    float cross = starCross(sDiff, starR);
    col += nBright * (disc + cross * 0.65) * vec3(0.90, 0.92, 1.00) * 2.0;
  }

  // ── Shooting stars ────────────────────────────────────────────
  for (int i = 0; i < 4; i++) {
    col += shootingStar(uv, u_time, float(i) * 11.37 + 3.14);
  }

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`);
