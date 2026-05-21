// Confetti — WebGL / GLSL.
//
// Festive birthday confetti: rectangular slips, circular discs, and five-
// pointed stars tumbling through the air in bright saturated colours.
//
// Shape selection is hash-driven: each particle is either a rectangle
// (most common), a circle, or a star.  All shapes use SDF evaluation.
//   • Rectangle SDF: box() — rounded corners via length(max(q,0)).
//   • Circle SDF: length(p) - r.
//   • Star SDF: 5-fold angle fold, two radii (inner/outer).
//
// Every piece spins on the Z-axis and rocks on the X-axis (squish Y) for
// 3-D tumbling.  Three depth layers (far/mid/near) vary size, density,
// and speed.  Background: bright warm white with a subtle radial gradient
// and a light confetti-blur glow layer so the scene feels celebratory.

import { createGLVariation } from '../engine.js';

export default createGLVariation('Confetti', `
// Rounded rectangle SDF
float boxSDF(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

// cross of 2D vectors (scalar z component) — named cross2d to avoid built-in clash
float cross2d(vec2 a, vec2 b) { return a.x * b.y - a.y * b.x; }

// Five-pointed star SDF
float starSDF(vec2 p, float r1, float r2) {
  float a  = atan(p.y, p.x);
  float n  = 5.0;
  a = mod(a, 6.28318 / n);
  a = abs(a - 3.14159 / n);
  vec2 q = length(p) * vec2(cos(a), sin(a));
  float inner = r2;
  float outer = r1;
  vec2  va = outer * vec2(cos(3.14159 / n), sin(3.14159 / n));
  vec2  vb = inner * vec2(1.0, 0.0);
  vec2  edge = vb - va;
  float t2 = clamp(dot(q - va, edge) / dot(edge, edge), 0.0, 1.0);
  return length(q - va - edge * t2) * sign(cross2d(q - va, edge));
}

// Confetti colour palette (8 bright saturated colours)
vec3 confettiColor(float idx) {
  int ci = int(mod(idx * 8.0, 8.0));
  if      (ci == 0) return vec3(0.98, 0.20, 0.22);   // red
  else if (ci == 1) return vec3(0.10, 0.54, 0.96);   // blue
  else if (ci == 2) return vec3(0.14, 0.82, 0.36);   // green
  else if (ci == 3) return vec3(0.98, 0.82, 0.06);   // yellow
  else if (ci == 4) return vec3(0.96, 0.40, 0.08);   // orange
  else if (ci == 5) return vec3(0.78, 0.14, 0.92);   // purple
  else if (ci == 6) return vec3(0.96, 0.28, 0.70);   // pink
  else              return vec3(0.06, 0.84, 0.90);    // cyan
}

float confettiLayer(vec2 uv, float t, float asp,
                    float numS, float spd, float wnd, float pieceR,
                    float seed, out vec3 layerCol) {
  float bright = 0.0;
  layerCol     = vec3(0.0);
  float sx     = uv.x * numS;
  float cell_x = floor(sx);

  for (int i = -2; i <= 2; i++) {
    float nc = cell_x + float(i);
    for (int k = 0; k < 2; k++) {
      float sk = float(k) * 31.0 + seed;

      float rx  = hash(vec2(nc +  7.1, sk));   // x offset
      float ry  = hash(vec2(nc,         sk));   // y phase
      float rs  = hash(vec2(nc +  3.7,  sk));   // speed
      float rw  = hash(vec2(nc + 10.3,  sk));   // wind
      float rp  = hash(vec2(nc + 17.9,  sk));   // wind phase
      float rsp = hash(vec2(nc + 24.1,  sk));   // spin phase
      float rss = hash(vec2(nc + 31.7,  sk));   // spin speed
      float rsh = hash(vec2(nc + 39.3,  sk));   // shape selector
      float rc  = hash(vec2(nc + 45.1,  sk));   // colour
      float rk  = hash(vec2(nc + 51.7,  sk));   // rock phase
      float rks = hash(vec2(nc + 58.3,  sk));   // rock speed
      float rar = hash(vec2(nc + 63.9,  sk));   // aspect ratio (rect only)

      float py_raw = fract(ry + t * spd * (0.78 + rs * 0.44));
      float py = 1.10 - py_raw * 1.20;

      float gust   = sin(t * 0.20 + seed * 2.13) * wnd;
      float windOff= gust + sin(t * (0.24 + rw * 0.38) + rp * 6.28) * wnd * 0.5;
      float px = (nc + rx) / numS + windOff;

      vec2 diff = vec2((uv.x - px) * asp, uv.y - py);

      if (length(diff) < pieceR * 2.5) {
        // Z-axis spin
        float spinSpd = 1.4 + rss * 2.0;
        float ang     = t * spinSpd + rsp * 6.28318;
        float cr = cos(ang), sr = sin(ang);
        vec2 lp = diff / pieceR;
        lp = vec2(cr * lp.x + sr * lp.y, -sr * lp.x + cr * lp.y);

        // X-axis rock (squish Y — piece flips forward as it falls)
        float rockSpd = 0.35 + rks * 0.40;
        float squish  = max(abs(cos(t * rockSpd + rk * 6.28318)), 0.08);
        lp.y /= (squish + 0.001);

        // Shape SDF
        float sdf;
        if (rsh < 0.55) {
          // Rectangle (most common)
          float arx = 0.45 + rar * 0.45;   // width ∈ [0.45, 0.90]
          sdf = boxSDF(lp, vec2(arx, 0.30), 0.08);
        } else if (rsh < 0.80) {
          // Circle
          sdf = length(lp) - 0.62;
        } else {
          // Star
          sdf = starSDF(lp, 0.80, 0.36);
        }

        float aa    = 0.08;
        float alpha = smoothstep(aa, -aa, sdf);

        if (alpha > 0.0) {
          vec3 pCol = confettiColor(rc);
          // Slight highlight on the face-on side
          float highlight = smoothstep(0.3, -0.3, lp.y) * 0.25;
          pCol = mix(pCol, vec3(1.0), highlight);

          bright   += alpha;
          layerCol += pCol * alpha;
        }
      }
    }
  }
  bright = clamp(bright, 0.0, 1.0);
  if (bright > 0.001) layerCol /= bright;
  return bright;
}

void main() {
  vec2  uv  = gl_FragCoord.xy / u_resolution;
  float asp = u_resolution.x / u_resolution.y;
  vec2  p   = uv * vec2(asp, 1.0);
  float t   = u_time * 0.30;

  // ── Bright celebratory background ────────────────────────────
  // Warm white with a very gentle radial warm-to-cool tint
  vec3 bgCentre = vec3(1.00, 0.98, 0.96);   // warm white centre
  vec3 bgEdge   = vec3(0.92, 0.94, 1.00);   // cool tint at edges
  float rad = length((uv - 0.5) * vec2(asp, 1.0)) * 1.1;
  vec3 col = mix(bgCentre, bgEdge, smoothstep(0.0, 1.0, rad));

  // Very faint confetti colour blush drifting across background
  float blush = fbm(p * 2.0 + vec2(t * 0.06, 0.0));
  col += blush * 0.04 * vec3(1.0, 0.70, 0.80);

  // ── Three confetti layers ─────────────────────────────────────
  vec3 farCol, midCol, nearCol;

  float far  = confettiLayer(uv, t, asp, 48.0, 0.080, 0.010, 0.0037, 1.00, farCol);
  float mid  = confettiLayer(uv, t, asp, 22.0, 0.180, 0.025, 0.0087, 6.71, midCol);
  float near = confettiLayer(uv, t, asp,  9.0, 0.360, 0.050, 0.0200, 12.3, nearCol);

  col = mix(col, farCol,  far  * 0.72);
  col = mix(col, midCol,  mid  * 0.90);
  col = mix(col, nearCol, near);

  // Sparkle glints on the brightest pieces
  float glint = fbm(p * 14.0 + vec2(t * 0.45, 0.0));
  glint = pow(max(glint - 0.68, 0.0) * 4.5, 3.0);
  col += glint * vec3(1.0, 0.98, 0.95) * 0.60;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`);
