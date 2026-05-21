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

// One shooting star — tail anchored at origin, head moves away (trail grows).
vec3 shootingStar(vec2 p, float t, float seed) {
  float period = 5.0 + hash(vec2(seed, 1.0)) * 7.0;
  float phase  = fract(t / period + hash(vec2(seed, 2.0)));
  if (phase > 0.28) return vec3(0.0);

  float prog   = phase / 0.28;
  float startX = hash(vec2(seed, 3.0));
  float startY = 0.30 + hash(vec2(seed, 4.0)) * 0.60;
  float angle  = -0.35 - hash(vec2(seed, 5.0)) * 0.45;

  vec2 dir    = vec2(cos(angle), sin(angle));
  vec2 origin = vec2(startX, startY);
  vec2 head   = origin + dir * prog * 0.55;   // head moves; trail grows behind it

  // Segment from fixed origin to moving head
  vec2  seg    = head - origin;
  float segLen = max(length(seg), 0.0001);
  vec2  pa     = p - origin;
  float hh     = clamp(dot(pa, seg) / dot(seg, seg), 0.0, 1.0);
  float dStreak= length(p - origin - seg * hh);

  // along: 0 at origin (tail), 1 at head — drives brightness
  float along = clamp(dot(pa, dir) / segLen, 0.0, 1.0);

  // Envelope: quick ramp-in, hold, gradual fade
  float env = smoothstep(0.0, 0.12, prog) * (1.0 - smoothstep(0.65, 1.0, prog));

  // Half the previous radius → 4× gaussian coefficient
  float streak   = exp(-dStreak * dStreak * 12800.0) * pow(along, 1.5) * env * 4.0;
  float headGlow = exp(-dot(p - head, p - head) * 36000.0) * env * 3.0;

  return vec3(0.93, 0.96, 1.00) * (streak + headGlow);
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

  // ── Far star layer — point-within-cell gaussian dots ─────────
  // Each grid cell may contain one star at a random position inside it.
  // Distance from fragment to that position drives a tight gaussian →
  // soft point, never a solid square.
  vec2 fG = vec2(220.0, 128.0);
  for (int fi = -1; fi <= 1; fi++) {
    for (int fj = -1; fj <= 1; fj++) {
      vec2  fc  = floor(uv * fG) + vec2(float(fi), float(fj));
      float fh  = hash(fc);
      float fv  = max(fh - 0.968, 0.0) / 0.032;
      vec2  fp  = (fc + vec2(hash(fc + 7.3), hash(fc + 3.9))) / fG;
      float fd  = length(uv - fp);
      col += fv * 0.55 * exp(-fd * fd * 260000.0) * vec3(0.72, 0.76, 0.90);
    }
  }

  // ── Mid star layer — larger, twinkling ───────────────────────
  vec2 mG = vec2(75.0, 43.0);
  for (int mi = -1; mi <= 1; mi++) {
    for (int mj = -1; mj <= 1; mj++) {
      vec2  mc  = floor(uv * mG) + vec2(float(mi), float(mj));
      float mh  = hash(mc);
      float mv  = max(mh - 0.920, 0.0) / 0.080;
      vec2  mp  = (mc + vec2(hash(mc + 9.1), hash(mc + 4.7))) / mG;
      float md  = length(uv - mp);
      float tw  = 0.55 + 0.45 * sin(u_time * (1.2 + hash(mc + 2.1) * 3.5) + hash(mc + 5.7) * 6.28);
      col += mv * 0.90 * tw * exp(-md * md * 55000.0) * vec3(0.84, 0.90, 1.00);
    }
  }

  // ── Near star layer — bright with diffraction cross ───────────
  vec2 nG = vec2(28.0, 16.0);
  for (int ni = -1; ni <= 1; ni++) {
    for (int nj = -1; nj <= 1; nj++) {
      vec2  nc   = floor(uv * nG) + vec2(float(ni), float(nj));
      float nh   = hash(nc);
      float nv   = max(nh - 0.860, 0.0) / 0.140;
      vec2  np   = (nc + vec2(hash(nc + 11.3), hash(nc + 6.7))) / nG;
      vec2  ndiff= (uv - np) * vec2(asp, 1.0);
      float tw   = 0.65 + 0.35 * sin(u_time * (0.8 + hash(nc + 3.5) * 2.2) + hash(nc + 8.1) * 6.28);
      float starR= 0.003 + nv * 0.004;
      float disc = exp(-dot(ndiff, ndiff) * 20000.0);
      float crs  = starCross(ndiff, starR);
      col += nv * 1.8 * tw * (disc + crs * 0.80) * vec3(0.90, 0.93, 1.00);
    }
  }

  // ── Shooting stars ────────────────────────────────────────────
  for (int i = 0; i < 4; i++) {
    col += shootingStar(uv, u_time, float(i) * 11.37 + 3.14);
  }

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`);
