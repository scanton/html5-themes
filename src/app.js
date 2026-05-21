import { CompositingLayer } from './compositing.js';

import dreamyBlobs    from './variations/01-dreamy-blobs.js';
import lavaLamp       from './variations/02-lava-lamp.js';
import aurora         from './variations/03-aurora.js';
import liquidMetal    from './variations/04-liquid-metal.js';
import sunsetDrift    from './variations/05-sunset-drift.js';
import oceanDepths    from './variations/06-ocean-depths.js';
import neonCity       from './variations/07-neon-city.js';
import smoke          from './variations/08-smoke.js';
import candy          from './variations/09-candy.js';
import northernFire   from './variations/10-northern-fire.js';
import poolWater      from './variations/11-pool-water.js';
import snowfall       from './variations/12-snowfall.js';
import beer           from './variations/13-beer.js';
import tieDye         from './variations/14-tie-dye.js';
import hearts         from './variations/15-hearts.js';
import christmas      from './variations/17-christmas.js';
import fireworks      from './variations/18-fireworks.js';
import confetti       from './variations/20-confetti.js';
import autumnLeaves   from './variations/22-autumn-leaves.js';
import starfield      from './variations/23-starfield.js';
import candlelight    from './variations/24-candlelight.js';
import rainbowRays    from './variations/25-rainbow-rays.js';

const variations = [
  dreamyBlobs, lavaLamp, aurora, liquidMetal, sunsetDrift,
  oceanDepths, neonCity, smoke, candy, northernFire,
  poolWater, snowfall, beer, tieDye, hearts,
  christmas, fireworks, confetti,
  autumnLeaves, starfield, candlelight, rainbowRays,
];

// ─── state ───────────────────────────────────────────────────────────────────

const preview = document.getElementById('preview');
let current      = null;
let currentIdx   = -1;
let compositing  = null;

// ─── switch variation ─────────────────────────────────────────────────────────

function switchTo(index) {
  if (currentIdx === index) return;

  // Tear down previous
  if (current) {
    current.stop?.();
    current.teardown?.();
  }
  if (compositing) {
    compositing.teardown();
    compositing = null;
  }
  preview.innerHTML    = '';
  preview.style.background = '';

  currentIdx  = index;
  current     = variations[index];
  current.setup(preview);

  // Compositing layer sits above the variation content
  compositing = new CompositingLayer(preview);

  document.querySelectorAll('.tab').forEach((t, i) =>
    t.classList.toggle('active', i === index)
  );
}

// ─── controls ────────────────────────────────────────────────────────────────

document.getElementById('btn-start').addEventListener('click', () => {
  current?.start();
  compositing?.start();
});

document.getElementById('btn-stop').addEventListener('click', () => {
  current?.stop();
  compositing?.stop();
});

document.getElementById('btn-reset').addEventListener('click', () => {
  current?.reset();
  compositing?.stop();
  // Redraw grain once so the static state still looks finished
  compositing?._drawGrain?.();
});

// ─── build tab bar ────────────────────────────────────────────────────────────

const tabsEl = document.getElementById('tabs');
variations.forEach((v, i) => {
  const btn = document.createElement('button');
  btn.className   = 'tab';
  btn.textContent = v.name;
  btn.addEventListener('click', () => switchTo(i));
  tabsEl.appendChild(btn);
});

// Load first variation — stopped by default
switchTo(0);
