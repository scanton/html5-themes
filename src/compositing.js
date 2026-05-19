// Global compositing layer applied on top of every variation.
// Edge vignette + top-centre bloom highlight only — no grain.

export class CompositingLayer {
  constructor(container) {
    this._container = container;

    // ── vignette ────────────────────────────────────────────────
    const vig = document.createElement('div');
    Object.assign(vig.style, {
      position: 'absolute',
      inset:    '0',
      background: [
        'radial-gradient(ellipse 90% 80% at 50% 55%,',
        '  transparent 40%, rgba(0,0,0,0.50) 100%)',
      ].join(''),
      pointerEvents: 'none',
      zIndex: '10',
    });
    this._vig = vig;

    // ── soft top-centre light bloom ──────────────────────────────
    const bloom = document.createElement('div');
    Object.assign(bloom.style, {
      position: 'absolute',
      inset:    '0',
      background: [
        'radial-gradient(ellipse 65% 35% at 50% 0%,',
        '  rgba(255,255,255,0.05) 0%, transparent 70%)',
      ].join(''),
      pointerEvents: 'none',
      zIndex: '11',
    });
    this._bloom = bloom;

    container.appendChild(vig);
    container.appendChild(bloom);
  }

  // No-ops kept so app.js call sites don't need changes.
  start()  {}
  stop()   {}

  teardown() {
    this._vig?.remove();
    this._bloom?.remove();
  }
}
