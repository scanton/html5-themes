// Candy — CSS technique.
// 16 hyper-saturated blobs at high speed with chaotic, multi-stage keyframes.
// Container filter: blur + contrast(2.5) + saturate(2) creates vivid paint-like
// merging where colours overlap, with sharp edges at blob boundaries.

export default {
  name: 'Candy',
  _container: null, _wrap: null, _styleEl: null, _speed: 1.0,

  setup(container) {
    this._container = container;
    container.style.background = '#ffffff';

    const style = document.createElement('style');
    style.textContent = `
      @keyframes cy-a{0%,100%{transform:translate(0,0) scale(1) rotate(0deg)}20%{transform:translate(110px,-95px) scale(1.55) rotate(90deg)}55%{transform:translate(-85px,65px) scale(0.62) rotate(220deg)}80%{transform:translate(55px,80px) scale(1.20) rotate(310deg)}}
      @keyframes cy-b{0%,100%{transform:translate(0,0) scale(1)}15%{transform:translate(-130px,100px) scale(1.60)}45%{transform:translate(95px,-70px) scale(0.70)}75%{transform:translate(-40px,110px) scale(1.35)}90%{transform:translate(80px,-30px) scale(0.88)}}
      @keyframes cy-c{0%,100%{transform:translate(0,0) scale(1) rotate(0deg)}50%{transform:translate(75px,-120px) scale(1.40) rotate(180deg)}}
      @keyframes cy-d{0%,100%{transform:translate(0,0) scale(1)}30%{transform:translate(-85px,-80px) scale(1.25)}65%{transform:translate(120px,55px) scale(0.80)}}
      @keyframes cy-e{0%,100%{transform:translate(0,0) scale(1) rotate(0deg)}25%{transform:translate(60px,90px) scale(1.45) rotate(-120deg)}70%{transform:translate(-70px,-50px) scale(0.72) rotate(240deg)}}
      @keyframes cy-f{0%,100%{transform:translate(0,0) scale(1)}40%{transform:translate(-100px,70px) scale(1.30)}80%{transform:translate(90px,-60px) scale(0.75)}}
      @keyframes cy-g{0%,100%{transform:translate(0,0) scale(1) rotate(0deg)}35%{transform:translate(80px,-85px) scale(1.20) rotate(90deg)}60%{transform:translate(-55px,65px) scale(0.85) rotate(200deg)}}
      @keyframes cy-h{0%,100%{transform:translate(0,0) scale(1)}20%{transform:translate(-75px,-65px) scale(1.38)}55%{transform:translate(100px,45px) scale(0.68)}}
      .cy-blob {
        position: absolute; border-radius: 50%;
        animation-timing-function: ease-in-out;
        animation-iteration-count: infinite;
        animation-play-state: paused;
      }
    `;
    document.head.appendChild(style);
    this._styleEl = style;

    const wrap = document.createElement('div');
    Object.assign(wrap.style, {
      position: 'absolute', inset: '0', overflow: 'hidden',
      filter: 'blur(28px) contrast(2.5) saturate(2.0)',
    });

    const blobs = [
      // Hot pink — 2 blobs
      { w:280, h:265, c:'rgba(255,5,140,0.92)',   top:'0%',  left:'8%',  anim:'cy-a 30.4s' },
      { w:160, h:170, c:'rgba(255,30,160,0.88)',  top:'50%', left:'55%', anim:'cy-e 23.2s 0.5s' },
      // Electric yellow
      { w:260, h:245, c:'rgba(255,230,0,0.92)',   top:'28%', left:'52%', anim:'cy-b 25.6s' },
      { w:145, h:155, c:'rgba(255,240,30,0.88)',  top:'70%', left:'20%', anim:'cy-f 20.8s 1s' },
      // Sky blue
      { w:245, h:260, c:'rgba(0,100,255,0.90)',   top:'48%', left:'18%', anim:'cy-c 36.0s' },
      { w:155, h:145, c:'rgba(30,130,255,0.85)',  top:'5%',  left:'65%', anim:'cy-g 27.2s 0.8s' },
      // Orange-red
      { w:235, h:250, c:'rgba(255,75,0,0.90)',    top:'8%',  left:'38%', anim:'cy-d 32.0s' },
      { w:140, h:150, c:'rgba(255,100,20,0.85)',  top:'68%', left:'68%', anim:'cy-h 22.4s 1.5s' },
      // Neon green
      { w:225, h:235, c:'rgba(0,230,80,0.88)',    top:'60%', left:'-2%', anim:'cy-e 28.8s 0.3s' },
      { w:130, h:140, c:'rgba(20,240,100,0.84)',  top:'18%', left:'82%', anim:'cy-a 21.6s 2s' },
      // Magenta/fuchsia
      { w:215, h:225, c:'rgba(220,0,255,0.88)',   top:'35%', left:'72%', anim:'cy-f 31.2s 0.6s' },
      { w:125, h:130, c:'rgba(240,20,255,0.84)',  top:'80%', left:'45%', anim:'cy-b 20.0s 1.2s' },
      // Cyan accent
      { w:205, h:215, c:'rgba(0,220,240,0.86)',   top:'75%', left:'80%', anim:'cy-c 26.4s 1.8s' },
      { w:120, h:125, c:'rgba(20,235,250,0.82)',  top:'38%', left:'5%',  anim:'cy-d 19.2s 0.9s' },
      // Vermillion
      { w:195, h:200, c:'rgba(255,40,40,0.88)',   top:'15%', left:'20%', anim:'cy-g 29.6s 2.2s' },
      // Chartreuse
      { w:185, h:195, c:'rgba(180,255,0,0.86)',   top:'88%', left:'10%', anim:'cy-h 24.8s 1.7s' },
    ];

    blobs.forEach(({ w, h, c, top, left, anim }) => {
      const el = document.createElement('div');
      el.className = 'cy-blob';
      el.dataset.blob = '';
      const baseDur = parseFloat(anim.match(/\s(\d+\.?\d*)s/)?.[1] ?? 1);
      el.dataset.baseDur = baseDur;
      Object.assign(el.style, {
        width: w+'px', height: h+'px',
        background: c, top, left, animation: anim,
        animationIterationCount: 'infinite',
        animationPlayState: 'paused',
      });
      wrap.appendChild(el);
    });

    container.appendChild(wrap);
    this._wrap = wrap;
  },

  start()  { this._wrap?.querySelectorAll('.cy-blob').forEach(b => b.style.animationPlayState = 'running'); },
  stop()   { this._wrap?.querySelectorAll('.cy-blob').forEach(b => b.style.animationPlayState = 'paused'); },
  setSpeed(s) {
    this._speed = Math.max(0.1, s);
    this._wrap?.querySelectorAll('.cy-blob').forEach(b => {
      b.style.animationDuration = (parseFloat(b.dataset.baseDur) / this._speed) + 's';
    });
  },
  reset()  { this.stop(); const p = this._container; this._wrap?.remove(); this._wrap = null; this.setup(p); this.setSpeed(this._speed); },
  teardown() {
    this._wrap?.remove(); this._wrap = null;
    this._styleEl?.remove(); this._styleEl = null;
    if (this._container) this._container.style.background = '';
  },
};
