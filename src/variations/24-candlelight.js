// Candlelight — WebGL / GLSL.
//
// Two candelabras — one on the left, one on the right — leaving the centre
// open for a greeting card overlay.  Each group has three candles: a tall
// centre flanked by two shorter ones.  Every flame flickers independently
// with multi-frequency sinusoidal drift + FBM outline perturbation.
// Warm amber candlelight pools on both sides; the middle stays dark.

import { createGLVariation } from '../engine.js';

export default createGLVariation('Candlelight', `
// Draw one candle (wax column + flickering flame + bloom) into col.
// cx/waxTop are in UV space (0–1); internally converted to aspect space.
void drawCandle(inout vec3 col, vec2 p, float asp,
                float t, float cx, float waxTop, float cw, float seed) {
  float waxX   = cx * asp;
  float waxHW  = cw * asp;
  vec2  fcen   = vec2(waxX, waxTop);

  // ── Flame — tight horizontal sway + vertical height pulse ──────
  vec2 fp = p - fcen;

  // Very small horizontal sway — just enough to feel alive, not jump off wick
  float flickX = sin(t * 2.80 + seed * 1.0) * 0.003
               + sin(t * 7.50 + seed * 2.4) * 0.0015;
  fp.x -= flickX;

  // Height pulse — flame breathes taller/shorter rather than drifting
  float hFactor = 0.92 + 0.18 * sin(t * 1.70 + seed)
                       + 0.07 * sin(t * 3.80 + seed * 2.3);

  float fa      = atan(fp.x, fp.y);
  float tearR   = 0.020 + 0.016 * cos(fa) - 0.005 * cos(2.0 * fa);
  // Dividing fp.y by hFactor stretches/squishes flame height
  float stretch = length(vec2(fp.x / 0.65, fp.y / hFactor));
  float fbmF    = fbm(fp * 14.0 + vec2(seed + t * 3.2, t * 2.6));
  float flameSDF= stretch - tearR - fbmF * 0.022 + 0.005;
  flameSDF      = max(flameSDF, fp.y - 0.075);

  float fCore  = smoothstep(-0.005, 0.0, flameSDF);
  float fInner = smoothstep(-0.012, 0.0, flameSDF);
  float fOuter = smoothstep(-0.030, 0.0, flameSDF);
  float fr     = length(fp);

  vec3 flameCol = mix(vec3(1.00, 0.98, 0.86), vec3(1.00, 0.88, 0.30), fCore);
  flameCol      = mix(flameCol, vec3(0.96, 0.40, 0.02), fInner);
  float blueB   = smoothstep(0.010, 0.0, abs(fp.y) + fr * 0.3) * (1.0 - fOuter);
  flameCol      = mix(flameCol, vec3(0.60, 0.70, 1.00), blueB * 0.35);
  float flameMask = 1.0 - smoothstep(-0.002, 0.014, flameSDF);

  // ── Wax column ─────────────────────────────────────────────────
  float waxSDF = abs(p.x - waxX) - waxHW;
  waxSDF = max(waxSDF, -p.y);           // clip below screen
  waxSDF = max(waxSDF, p.y - waxTop);  // clip above flame base
  float waxMask = 1.0 - smoothstep(-0.002, 0.004, waxSDF);
  float litSide = smoothstep(-waxHW, waxHW, p.x - waxX) * 0.4;
  vec3  waxCol  = mix(vec3(0.92, 0.88, 0.80), vec3(1.00, 0.94, 0.84), litSide);

  // ── Bloom at flame position — brightness pulses with the flicker ─
  float dist      = length(p - fcen);
  float bloomPulse= 0.88 + 0.12 * sin(t * 1.55 + seed * 2.1)
                         + 0.06 * sin(t * 3.20 + seed * 3.7);
  col += vec3(1.00, 0.76, 0.22) * exp(-dist * dist * 420.0) * 0.75 * bloomPulse;

  // Composite: wax first, then flame on top
  col = mix(col, waxCol, waxMask);
  col = mix(col, flameCol, flameMask);
}

void main() {
  vec2  uv  = gl_FragCoord.xy / u_resolution;
  float asp = u_resolution.x / u_resolution.y;
  vec2  p   = uv * vec2(asp, 1.0);
  float t   = u_time * 0.60;

  // ── Background — warm glow pooling on both sides ───────────────
  // Sum inverse-square contributions from all six flame positions
  vec2 fc; float glow = 0.0;
  fc = vec2(0.09 * asp, 0.40); glow += 0.18 / (1.0 + dot(p-fc,p-fc) * 22.0);
  fc = vec2(0.16 * asp, 0.52); glow += 0.28 / (1.0 + dot(p-fc,p-fc) * 18.0);
  fc = vec2(0.23 * asp, 0.42); glow += 0.18 / (1.0 + dot(p-fc,p-fc) * 22.0);
  fc = vec2(0.77 * asp, 0.42); glow += 0.18 / (1.0 + dot(p-fc,p-fc) * 22.0);
  fc = vec2(0.84 * asp, 0.52); glow += 0.28 / (1.0 + dot(p-fc,p-fc) * 18.0);
  fc = vec2(0.91 * asp, 0.40); glow += 0.18 / (1.0 + dot(p-fc,p-fc) * 22.0);

  // Add wide ambient fill
  vec2 leftCen  = vec2(0.16 * asp, 0.52);
  vec2 rightCen = vec2(0.84 * asp, 0.52);
  glow += 0.10 / (1.0 + length(p - leftCen)  * 4.0);
  glow += 0.10 / (1.0 + length(p - rightCen) * 4.0);

  // FBM surface texture breaks up the flat light field
  float surf = fbm(p * 3.0 + vec2(t * 0.06, 0.0));
  glow *= (0.75 + 0.25 * surf);

  // Slow global glow pulse — the whole room breathes with the candles
  float glowPulse = 0.93 + 0.07 * sin(u_time * 0.75)
                         + 0.04 * sin(u_time * 1.90 + 1.3);
  glow *= glowPulse;

  vec3 lightNear = vec3(0.88, 0.56, 0.12);
  vec3 lightFar  = vec3(0.14, 0.05, 0.01);
  vec3 col = mix(lightFar, lightNear, clamp(glow * 3.2, 0.0, 1.0));
  col = mix(col, lightNear * 1.4, clamp(glow * 1.1, 0.0, 1.0));

  // Edge vignette
  float vig = length((uv - 0.5) * vec2(asp, 1.0));
  col *= pow(1.0 - smoothstep(0.3, 1.2, vig), 1.4);

  // ── Left candle group ─────────────────────────────────────────
  drawCandle(col, p, asp, t, 0.09, 0.40, 0.010, 1.30);
  drawCandle(col, p, asp, t, 0.16, 0.52, 0.012, 2.75);
  drawCandle(col, p, asp, t, 0.23, 0.42, 0.010, 4.20);

  // ── Right candle group ────────────────────────────────────────
  drawCandle(col, p, asp, t, 0.77, 0.42, 0.010, 5.65);
  drawCandle(col, p, asp, t, 0.84, 0.52, 0.012, 7.10);
  drawCandle(col, p, asp, t, 0.91, 0.40, 0.010, 8.55);

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`);
