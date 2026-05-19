// Sunset Drift — CSS + JS technique.
// Three gradient layers; each blob's center is updated every frame via rAF
// so the gradient focal points actually move rather than just panning the image.
// Blobs follow independent sinusoidal orbits with different frequencies/phases.
// mix-blend-mode: screen on layers 2 & 3 produces emergent intermediate tones.

export default {
  name: 'Sunset Drift',
  _container: null, _wrap: null, _layers: null,
  _raf: null, _t: 0, _last: null,

  setup(container) {
    this._container = container;
    container.style.background = '#09000f';

    const wrap = document.createElement('div');
    Object.assign(wrap.style, { position: 'absolute', inset: '0', overflow: 'hidden' });

    const l1 = document.createElement('div'); // warm coral / orange base
    const l2 = document.createElement('div'); // violet / crimson (screen)
    const l3 = document.createElement('div'); // gold accent (screen)

    [l1, l2, l3].forEach(el => {
      Object.assign(el.style, { position: 'absolute', inset: '0', pointerEvents: 'none' });
    });
    l2.style.mixBlendMode = 'screen';
    l3.style.mixBlendMode = 'screen';

    wrap.appendChild(l1);
    wrap.appendChild(l2);
    wrap.appendChild(l3);
    container.appendChild(wrap);
    this._wrap  = wrap;
    this._layers = [l1, l2, l3];
    this._t = 0;
    this._last = null;
    this._draw(0);  // paint initial frame so it looks right at rest
  },

  _draw(t) {
    const [l1, l2, l3] = this._layers;

    // Layer 1 — three warm blobs on independent orbits
    const x1a = 50 + 42 * Math.sin(t * 0.38);
    const y1a = 50 + 36 * Math.cos(t * 0.31);
    const x1b = 50 + 40 * Math.cos(t * 0.27 + 1.2);
    const y1b = 50 + 34 * Math.sin(t * 0.24 + 0.8);
    const x1c = 50 + 44 * Math.sin(t * 0.43 + 2.3);
    const y1c = 50 + 38 * Math.cos(t * 0.36 + 1.6);
    l1.style.background = [
      `radial-gradient(ellipse 70% 65% at ${x1a}% ${y1a}%, #ff5533 0%, transparent 65%),`,
      `radial-gradient(ellipse 60% 55% at ${x1b}% ${y1b}%, #ff2255 0%, transparent 60%),`,
      `radial-gradient(ellipse 80% 60% at ${x1c}% ${y1c}%, #ff8800 0%, transparent 70%)`,
    ].join('');

    // Layer 2 — violet / deep crimson, slower orbits
    const x2a = 50 + 45 * Math.cos(t * 0.30 + 0.5);
    const y2a = 50 + 40 * Math.sin(t * 0.26 + 1.9);
    const x2b = 50 + 43 * Math.sin(t * 0.35 + 3.2);
    const y2b = 50 + 37 * Math.cos(t * 0.32 + 2.5);
    l2.style.background = [
      `radial-gradient(ellipse 65% 70% at ${x2a}% ${y2a}%, #8800cc 0%, transparent 60%),`,
      `radial-gradient(ellipse 60% 65% at ${x2b}% ${y2b}%, #cc0044 0%, transparent 55%)`,
    ].join('');

    // Layer 3 — gold accent, pulsing opacity
    const x3  = 50 + 44 * Math.cos(t * 0.41 + 1.4);
    const y3  = 50 + 39 * Math.sin(t * 0.34 + 0.6);
    const op3 = 0.62 + 0.28 * Math.sin(t * 0.48);
    l3.style.background = `radial-gradient(ellipse 55% 50% at ${x3}% ${y3}%, #ffcc00 0%, transparent 55%)`;
    l3.style.opacity = op3.toFixed(3);
  },

  _tick(ts) {
    if (this._last !== null) this._t += (ts - this._last) * 0.001;
    this._last = ts;
    this._draw(this._t);
    this._raf = requestAnimationFrame(ts => this._tick(ts));
  },

  start() {
    if (this._raf) return;
    this._last = null;
    this._raf = requestAnimationFrame(ts => this._tick(ts));
  },

  stop() {
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
    this._last = null;
  },

  reset() {
    this.stop();
    this._t = 0;
    const p = this._container;
    this._wrap?.remove(); this._wrap = null;
    this._layers = null;
    this.setup(p);
  },

  teardown() {
    this.stop();
    this._wrap?.remove(); this._wrap = null;
    this._layers = null;
    if (this._container) this._container.style.background = '';
  },
};
