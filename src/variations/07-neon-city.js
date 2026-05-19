// Neon City — CSS technique.
// 18 glowing orbs on pure black, composited with mix-blend-mode: screen
// so overlapping colours add to white rather than muddying.
// Six neon hues × three size tiers (large spread / medium / small tight).
// Each tier has its own keyframe timing to prevent synchrony.

export default {
  name: 'Neon City',
  _container: null, _wrap: null, _styleEl: null,

  setup(container) {
    this._container = container;
    container.style.background = '#000000';

    const style = document.createElement('style');
    style.textContent = `
      @keyframes nc-a{0%,100%{transform:translate(0,0) scale(1)}22%{transform:translate(80px,-65px) scale(1.30)}55%{transform:translate(-60px,45px) scale(0.78)}78%{transform:translate(40px,55px) scale(1.15)}}
      @keyframes nc-b{0%,100%{transform:translate(0,0) scale(1)}30%{transform:translate(-95px,75px) scale(1.25)}60%{transform:translate(70px,-35px) scale(0.85)}}
      @keyframes nc-c{0%,100%{transform:translate(0,0) scale(1)}40%{transform:translate(50px,80px) scale(1.40)}75%{transform:translate(-40px,-55px) scale(0.88)}}
      @keyframes nc-d{0%,100%{transform:translate(0,0) scale(1)}25%{transform:translate(-75px,-60px) scale(1.18)}65%{transform:translate(85px,40px) scale(0.82)}}
      @keyframes nc-e{0%,100%{transform:translate(0,0) scale(1)}35%{transform:translate(60px,-80px) scale(1.22)}70%{transform:translate(-50px,50px) scale(0.90)}}
      @keyframes nc-f{0%,100%{transform:translate(0,0) scale(1)}45%{transform:translate(-65px,60px) scale(1.28)}80%{transform:translate(55px,-45px) scale(0.80)}}
      .nc-orb {
        position: absolute; border-radius: 50%;
        mix-blend-mode: screen;
        animation-timing-function: ease-in-out;
        animation-iteration-count: infinite;
        animation-play-state: paused;
      }
    `;
    document.head.appendChild(style);
    this._styleEl = style;

    const wrap = document.createElement('div');
    Object.assign(wrap.style, { position: 'absolute', inset: '0', overflow: 'hidden' });

    // 18 orbs: 6 colours × 3 size tiers
    const orbs = [
      // Hot pink
      { w:480, h:420, c:'rgba(255,0,200,0.75)', blur:90,  top:'-15%', left:'-5%',  anim:'nc-a 11s' },
      { w:220, h:220, c:'rgba(255,0,200,0.80)', blur:40,  top:'35%',  left:'55%',  anim:'nc-d 7s' },
      { w: 90, h: 90, c:'rgba(255,30,220,0.90)',blur:15,  top:'10%',  left:'72%',  anim:'nc-b 5s' },
      // Cyan
      { w:440, h:480, c:'rgba(0,230,255,0.72)', blur:85,  top:'5%',   left:'48%',  anim:'nc-b 13s' },
      { w:200, h:240, c:'rgba(0,230,255,0.80)', blur:38,  top:'62%',  left:'12%',  anim:'nc-e 8s' },
      { w: 85, h: 85, c:'rgba(30,245,255,0.88)',blur:14,  top:'78%',  left:'78%',  anim:'nc-c 4.5s' },
      // Electric blue
      { w:420, h:400, c:'rgba(50,50,255,0.78)', blur:88,  top:'25%',  left:'22%',  anim:'nc-c 15s' },
      { w:210, h:200, c:'rgba(60,60,255,0.82)', blur:36,  top:'5%',   left:'28%',  anim:'nc-f 9s' },
      { w: 80, h: 95, c:'rgba(80,80,255,0.90)', blur:12,  top:'55%',  left:'40%',  anim:'nc-a 4s 1s' },
      // Violet
      { w:400, h:440, c:'rgba(180,0,255,0.72)', blur:84,  top:'40%',  left:'55%',  anim:'nc-d 14s' },
      { w:190, h:215, c:'rgba(180,0,255,0.80)', blur:35,  top:'70%',  left:'62%',  anim:'nc-a 6.5s' },
      { w: 75, h: 80, c:'rgba(200,20,255,0.88)',blur:12,  top:'22%',  left:'5%',   anim:'nc-e 4s 2s' },
      // Neon green
      { w:380, h:360, c:'rgba(0,255,110,0.70)', blur:80,  top:'60%',  left:'-5%',  anim:'nc-e 12s' },
      { w:185, h:200, c:'rgba(0,255,110,0.78)', blur:34,  top:'5%',   left:'85%',  anim:'nc-b 7.5s' },
      { w: 70, h: 85, c:'rgba(20,255,120,0.88)',blur:11,  top:'48%',  left:'88%',  anim:'nc-d 4.5s 1.5s' },
      // Amber/orange
      { w:360, h:380, c:'rgba(255,120,0,0.70)', blur:78,  top:'-5%',  left:'60%',  anim:'nc-f 10s' },
      { w:175, h:185, c:'rgba(255,120,0,0.78)', blur:32,  top:'75%',  left:'35%',  anim:'nc-c 6s' },
      { w: 68, h: 78, c:'rgba(255,140,20,0.88)',blur:11,  top:'38%',  left:'25%',  anim:'nc-f 3.8s 2.5s' },
    ];

    orbs.forEach(({ w, h, c, blur, top, left, anim }) => {
      const el = document.createElement('div');
      el.className = 'nc-orb';
      el.dataset.blob = '';
      Object.assign(el.style, {
        width: w+'px', height: h+'px',
        background: `radial-gradient(circle, ${c}, transparent 70%)`,
        filter: `blur(${blur}px)`,
        top, left, animation: anim,
        animationIterationCount: 'infinite',
        animationPlayState: 'paused',
      });
      wrap.appendChild(el);
    });

    container.appendChild(wrap);
    this._wrap = wrap;
  },

  start()  { this._wrap?.querySelectorAll('.nc-orb').forEach(b => b.style.animationPlayState = 'running'); },
  stop()   { this._wrap?.querySelectorAll('.nc-orb').forEach(b => b.style.animationPlayState = 'paused'); },
  reset()  { this.stop(); const p = this._container; this._wrap?.remove(); this._wrap = null; this.setup(p); },
  teardown() {
    this._wrap?.remove(); this._wrap = null;
    this._styleEl?.remove(); this._styleEl = null;
    if (this._container) this._container.style.background = '';
  },
};
