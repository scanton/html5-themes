// WebGL boilerplate factory + shared GLSL prelude.
// All six GPU variations are created via createGLVariation(name, fragBody).

const VERT_SRC = `
  attribute vec2 a_pos;
  void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

// Shared utilities injected into every fragment shader.
export const GLSL_PRELUDE = `
precision highp float;
uniform float u_time;
uniform vec2  u_resolution;

// Value-noise building blocks
float hash(vec2 p) {
  p  = fract(p * vec2(127.1, 311.7));
  p += dot(p, p + 19.19);
  return fract(p.x * p.y);
}
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i),            hash(i + vec2(1,0)), f.x),
    mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y);
}
// 6-octave FBM with rotating lattice for less axis-aligned artifacts
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  mat2 rot = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 6; i++) { v += a * vnoise(p); p = rot * p; a *= 0.5; }
  return v;
}
`;

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(s));
  }
  return s;
}

// ─── WebGL variation factory ─────────────────────────────────────────────────
// fragBody is appended after GLSL_PRELUDE.  Must define void main().
export function createGLVariation(name, fragBody) {
  const fragSrc = GLSL_PRELUDE + '\n' + fragBody;

  return {
    name,
    _canvas: null, _gl: null, _prog: null,
    _uTime: null, _uRes: null,
    _raf: null, _running: false,
    _elapsed: 0, _prevTs: null, _speed: 1.0,

    setup(container) {
      const canvas = document.createElement('canvas');
      canvas.width  = container.offsetWidth  || 800;
      canvas.height = container.offsetHeight || 500;
      Object.assign(canvas.style, {
        position: 'absolute', top: '0', left: '0',
        width: '100%', height: '100%',
      });
      container.appendChild(canvas);
      this._canvas = canvas;

      const gl = canvas.getContext('webgl', { antialias: false, alpha: false })
               || canvas.getContext('experimental-webgl');
      if (!gl) { canvas.style.background = '#111'; return; }
      this._gl = gl;

      const prog = gl.createProgram();
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER,   VERT_SRC));
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, fragSrc));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(prog));
      }
      this._prog  = prog;
      this._uTime = gl.getUniformLocation(prog, 'u_time');
      this._uRes  = gl.getUniformLocation(prog, 'u_resolution');

      // Full-screen quad
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER,
        new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
      const aPos = gl.getAttribLocation(prog, 'a_pos');
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

      this._elapsed = 0;
      this._render();
    },

    _render() {
      const { _gl: gl, _prog, _uTime, _uRes, _canvas, _elapsed } = this;
      if (!gl) return;
      gl.useProgram(_prog);
      gl.uniform1f(_uTime, _elapsed * 0.001);
      gl.uniform2f(_uRes, _canvas.width, _canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },

    setSpeed(s) { this._speed = Math.max(0.1, s); },

    start() {
      if (this._running) return;
      this._running = true;
      this._prevTs = null;
      const loop = (ts) => {
        if (!this._running) return;
        if (this._prevTs !== null) {
          const dt = Math.min(ts - this._prevTs, 50);
          this._elapsed += dt * this._speed;
        }
        this._prevTs = ts;
        this._render();
        this._raf = requestAnimationFrame(loop);
      };
      this._raf = requestAnimationFrame(loop);
    },

    stop() {
      this._running = false;
      this._prevTs = null;
      if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
    },

    reset() {
      this.stop();
      this._elapsed = 0;
      this._render();
    },

    teardown() {
      this.stop();
      this._canvas?.remove();
      this._canvas = null; this._gl = null; this._prog = null;
    },
  };
}
