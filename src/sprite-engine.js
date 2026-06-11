// Sprite overlay layer — Canvas 2D rendered above the background.
//
// Sprite modules export: { name, init(w,h)→state, update(state,dt,elapsed), draw(ctx,state) }
// The layer sits at z-index 15, above the compositing vignette (10/11) so
// sprites are always fully visible.

export class SpriteLayer {
  constructor(container) {
    this._container = container;

    const canvas = document.createElement('canvas');
    canvas.width  = container.offsetWidth  || 800;
    canvas.height = container.offsetHeight || 500;
    Object.assign(canvas.style, {
      position:      'absolute',
      top:           '0',
      left:          '0',
      width:         '100%',
      height:        '100%',
      pointerEvents: 'none',
      zIndex:        '15',
    });
    container.appendChild(canvas);
    this._canvas  = canvas;
    this._ctx     = canvas.getContext('2d');
    this._sprite  = null;
    this._state   = null;
    this._running = false;
    this._raf     = null;
    this._elapsed = 0;
    this._lastTs  = null;
    this._speed   = 1.0;
    this._density = 1.0;
  }

  setSpeed(s)   { this._speed = Math.max(0.1, s); }

  setDensity(d) {
    this._density = Math.max(0, d);
    if (this._sprite) {
      this._state = this._sprite.init(this._canvas.width, this._canvas.height, this._density);
      if (this._density === 0) {
        this._ctx?.clearRect(0, 0, this._canvas.width, this._canvas.height);
      }
    }
  }

  // Pass null to clear sprites without replacing
  setSprite(spriteModule) {
    const wasRunning = this._running;
    this.stop();
    this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
    this._sprite  = spriteModule || null;
    this._elapsed = 0;
    this._lastTs  = null;
    this._state   = spriteModule
      ? spriteModule.init(this._canvas.width, this._canvas.height, this._density)
      : null;
    if (wasRunning && spriteModule) this.start();
  }

  start() {
    if (this._running || !this._sprite) return;
    this._running = true;
    const loop = (ts) => {
      if (!this._running) return;
      const dt = this._lastTs === null ? 16 : Math.min(ts - this._lastTs, 50);
      this._lastTs   = ts;
      this._elapsed += dt;
      const { _canvas: cv, _ctx: ctx, _sprite: sp, _state: st } = this;
      ctx.clearRect(0, 0, cv.width, cv.height);
      sp.update(st, dt * 0.001 * this._speed, this._elapsed * 0.001, this._density);
      sp.draw(ctx, st);
      this._raf = requestAnimationFrame(loop);
    };
    this._raf = requestAnimationFrame(loop);
  }

  stop() {
    this._running = false;
    this._lastTs  = null;
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
  }

  reset() {
    this.stop();
    this._elapsed = 0;
    this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
    if (this._sprite) {
      this._state = this._sprite.init(this._canvas.width, this._canvas.height, this._density);
    }
  }

  teardown() {
    this.stop();
    this._canvas?.remove();
    this._canvas = null;
    this._ctx    = null;
    this._state  = null;
    this._sprite = null;
  }
}
