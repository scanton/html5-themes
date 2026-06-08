import { CompositingLayer } from './compositing.js';
import { SpriteLayer }      from './sprite-engine.js';

// ── Background variations ─────────────────────────────────────────────────────
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

// ── Sprite modules ────────────────────────────────────────────────────────────
import bubblesSprite      from './sprites/01-bubbles.js';
import heartsSprite       from './sprites/02-hearts.js';
import snowflakesSprite   from './sprites/03-snowflakes.js';
import starsSprite        from './sprites/04-stars.js';
import balloonsSprite     from './sprites/05-balloons.js';
import confettiSprite     from './sprites/06-confetti.js';
import ribbonsSprite      from './sprites/07-ribbons.js';
import magicDustSprite    from './sprites/08-magic-dust.js';
import firefliesSprite    from './sprites/09-fireflies.js';
import butterfliesSprite  from './sprites/10-butterflies.js';
import blossomsSprite     from './sprites/11-cherry-blossoms.js';
import dandelionSprite    from './sprites/12-dandelion-seeds.js';
import shardsSprite       from './sprites/13-crystal-shards.js';
import runesSprite        from './sprites/14-spell-runes.js';
import jackSparksSprite   from './sprites/15-jack-sparks.js';
import cometsSprite       from './sprites/16-comets.js';
import geometricSprite    from './sprites/17-geometric.js';
import musicNotesSprite   from './sprites/18-music-notes.js';
import paperPlanesSprite  from './sprites/19-paper-planes.js';
import autumnLeavesSprite from './sprites/21-autumn-leaves.js';

const variations = [
  dreamyBlobs, lavaLamp, aurora, liquidMetal, sunsetDrift,
  oceanDepths, neonCity, smoke, candy, northernFire,
  poolWater, snowfall, beer, tieDye, hearts,
  christmas, fireworks, confetti,
  autumnLeaves, starfield, candlelight, rainbowRays,
];

// null = "None" (no overlay)
const sprites = [
  null,
  bubblesSprite, heartsSprite, snowflakesSprite, starsSprite,
  balloonsSprite, confettiSprite, ribbonsSprite, magicDustSprite,
  firefliesSprite, butterfliesSprite, blossomsSprite, dandelionSprite,
  shardsSprite, runesSprite, jackSparksSprite, cometsSprite,
  geometricSprite, musicNotesSprite, paperPlanesSprite, autumnLeavesSprite,
];

const spriteLabels = [
  'None',
  'Bubbles', 'Hearts', 'Snowflakes', 'Stars & Sparkles',
  'Balloons', 'Confetti', 'Gift Ribbons', 'Magic Dust',
  'Fireflies', 'Butterflies', 'Cherry Blossoms', 'Dandelion Seeds',
  'Crystal Shards', 'Spell Runes', 'Jack-o-Lantern Sparks', 'Comets',
  'Geometric Shapes', 'Music Notes', 'Paper Planes', 'Autumn Leaves',
];

// ─── state ────────────────────────────────────────────────────────────────────

const preview = document.getElementById('preview');
let current     = null;
let currentIdx  = -1;
let compositing = null;
let spriteLayer = null;
let spriteIdx   = 0;
let isRunning   = false;

// ─── switch background ────────────────────────────────────────────────────────

function switchTo(index) {
  if (currentIdx === index) return;

  if (current)     { current.stop?.();     current.teardown?.(); }
  if (compositing) { compositing.teardown(); compositing = null; }
  if (spriteLayer) { spriteLayer.teardown(); spriteLayer = null; }

  preview.innerHTML        = '';
  preview.style.background = '';

  currentIdx = index;
  current    = variations[index];
  current.setup(preview);

  compositing = new CompositingLayer(preview);
  spriteLayer = new SpriteLayer(preview);
  if (sprites[spriteIdx]) spriteLayer.setSprite(sprites[spriteIdx]);

  if (isRunning) {
    current.start();
    if (sprites[spriteIdx]) spriteLayer.start();
  }

  document.querySelectorAll('.bg-tab').forEach((t, i) =>
    t.classList.toggle('active', i === index)
  );
}

// ─── switch sprite ────────────────────────────────────────────────────────────

function switchSprite(index) {
  spriteIdx = index;
  spriteLayer?.setSprite(sprites[index] || null);
  if (isRunning && sprites[index]) spriteLayer?.start();

  document.querySelectorAll('.sprite-tab').forEach((t, i) =>
    t.classList.toggle('active', i === index)
  );
}

// ─── controls ─────────────────────────────────────────────────────────────────

document.getElementById('btn-start').addEventListener('click', () => {
  isRunning = true;
  current?.start();
  compositing?.start();
  if (sprites[spriteIdx]) spriteLayer?.start();
});

document.getElementById('btn-stop').addEventListener('click', () => {
  isRunning = false;
  current?.stop();
  compositing?.stop();
  spriteLayer?.stop();
});

document.getElementById('btn-reset').addEventListener('click', () => {
  isRunning = false;
  current?.reset();
  compositing?.stop();
  compositing?._drawGrain?.();
  spriteLayer?.reset();
});

// ─── build tab panels ─────────────────────────────────────────────────────────

const bgPanel = document.getElementById('bg-panel');
variations.forEach((v, i) => {
  const btn = document.createElement('button');
  btn.className   = 'tab bg-tab';
  btn.textContent = v.name;
  btn.addEventListener('click', () => switchTo(i));
  bgPanel.appendChild(btn);
});

const spritePanel = document.getElementById('sprite-panel');
spriteLabels.forEach((label, i) => {
  const btn = document.createElement('button');
  btn.className   = 'tab sprite-tab';
  btn.textContent = label;
  btn.addEventListener('click', () => switchSprite(i));
  spritePanel.appendChild(btn);
});

// ─── initial load ─────────────────────────────────────────────────────────────

switchTo(0);
switchSprite(0);
