// Dreamy Blobs — WebGL / GLSL.
//
// Motion technique: each domain-warp level uses cos/sin time offsets that
// trace slow circular paths through the noise field.  This makes the pattern
// churn and roll in place (like looking down into slow liquid) rather than
// translating across the screen as a linear drift would do.
//
// Each level runs at a slightly different circular frequency so the three
// layers never sync up — their interference produces the rolling-wave feel.
//
// Colour: explicit 5-stop palette clamped to periwinkle / pink / white /
// lavender / ice-blue.  No cosine cycling means no yellow/green bleed.

import { createGLVariation } from '../engine.js';

export default createGLVariation('Dreamy Blobs', `
// Explicit colour stops — 5 segments staying firmly in blue/purple territory.
// Pink and near-white appear only as brief accents between the dominant blues.
// Cycle: periwinkle → blue-violet → deep lavender → lilac-pink → ice-blue → back.
vec3 dreamPalette(float t) {
  t = fract(t);
  vec3 p0 = vec3(0.52, 0.62, 0.92);   // periwinkle blue    (dominant)
  vec3 p1 = vec3(0.38, 0.44, 0.86);   // deep blue-violet   (dominant, darker)
  vec3 p2 = vec3(0.65, 0.52, 0.90);   // rich lavender      (dominant)
  vec3 p3 = vec3(0.88, 0.72, 0.92);   // lilac-pink         (bright accent)
  vec3 p4 = vec3(0.78, 0.88, 0.98);   // bright ice-blue    (bright accent)
  float seg = t * 5.0;
  float f   = fract(seg);
  f = f * f * (3.0 - 2.0 * f);        // smoothstep within each segment
  int idx = int(seg);
  if (idx == 0) return mix(p0, p1, f);
  if (idx == 1) return mix(p1, p2, f);
  if (idx == 2) return mix(p2, p3, f);
  if (idx == 3) return mix(p3, p4, f);
  return mix(p4, p0, f);
}

void main() {
  vec2 uv  = gl_FragCoord.xy / u_resolution;
  float asp = u_resolution.x / u_resolution.y;
  // Centre-normalised, aspect-corrected coords
  vec2 p = (uv - 0.5) * vec2(asp, 1.0) * 1.6;

  // Base time — tuned so motion is clearly visible but smooth
  float t = u_time * 0.22;

  // ── warp level 1 ──────────────────────────────────────────────
  // Each lookup offset traces a slow circle in noise space.
  // Two lookups at different orbital speeds → directional complexity.
  vec2 q = vec2(
    fbm(p + vec2( cos(t*0.38)*0.85,  sin(t*0.31)*0.85)),
    fbm(p + vec2( sin(t*0.35)*0.85, -cos(t*0.44)*0.85) + vec2(4.30, 2.10))
  );

  // ── warp level 2 ──────────────────────────────────────────────
  // Slower orbital rates, larger radius — drives the large-scale "rolling"
  vec2 r = vec2(
    fbm(p + 3.1*q + vec2( cos(t*0.26)*1.15,  sin(t*0.23)*0.95) + vec2(1.70, 8.60)),
    fbm(p + 3.1*q + vec2(-sin(t*0.30)*1.05,  cos(t*0.27)*1.15) + vec2(7.20, 1.80))
  );

  // ── warp level 3 (fine ribbons) ───────────────────────────────
  // Slightly larger UV scale produces finer detail within the waves.
  vec2 s = vec2(
    fbm(p*1.35 + 2.5*r + vec2( sin(t*0.37)*0.72,  cos(t*0.41)*0.78) + vec2(2.50, 5.30)),
    fbm(p*1.35 + 2.5*r + vec2( cos(t*0.28)*0.88, -sin(t*0.34)*0.72) + vec2(6.60, 3.10))
  );

  // Final field: tiny independent drift keeps it alive even at slow speed
  float f = fbm(p + 2.1*s + vec2(t*0.07, -t*0.05));

  // Palette input: compress noise range so we don't cycle through all 5 stops
  // on a single frame — keeps the visual palette feeling narrow and consistent.
  // Slow time drift so colour also subtly evolves.
  vec3 col = dreamPalette(f * 0.75 + t * 0.020);

  // Tint toward ice-blue rather than white — preserves saturation
  col = mix(col, vec3(0.85, 0.88, 0.96), 0.06);

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`);
