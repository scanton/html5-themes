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
import bokeh          from './variations/26-bokeh.js';
import stageLights    from './variations/27-stage-lights.js';
import koiPond        from './variations/28-koi-pond.js';
import deepOcean      from './variations/29-deep-ocean.js';
import unicornSky     from './variations/30-unicorn-sky.js';
import rainOnGlass    from './variations/31-rain-on-glass.js';
import nebula         from './variations/32-nebula.js';

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
import rosePetalsSprite   from './sprites/22-rose-petals.js';
import skullsSprite       from './sprites/23-skulls.js';
import hempLeavesSprite   from './sprites/24-hemp-leaves.js';
import koiFishSprite      from './sprites/25-koi-fish.js';
import jellyfishSprite    from './sprites/26-jellyfish.js';
import rocketsSprite      from './sprites/27-rockets.js';
import fairiesSprite      from './sprites/28-fairies.js';
import umbrellasSprite    from './sprites/29-umbrellas.js';
import astronautsSprite   from './sprites/30-astronauts.js';

// Index 0 = no background (solid white canvas)
const noneBackground = {
  name:      'None',
  setup(el)  { el.style.background = '#ffffff'; },
  start()    {},
  stop()     {},
  reset()    {},
  teardown() {},
};

const variations = [
  noneBackground,
  dreamyBlobs, lavaLamp, aurora, liquidMetal, sunsetDrift,
  oceanDepths, neonCity, smoke, candy, northernFire,
  poolWater, snowfall, beer, tieDye, hearts,
  christmas, fireworks, confetti,
  autumnLeaves, starfield, candlelight, rainbowRays,
  bokeh, stageLights, koiPond, deepOcean, unicornSky,
  rainOnGlass, nebula,
];

// null = "None" (no overlay)
const sprites = [
  null,
  bubblesSprite, heartsSprite, snowflakesSprite, starsSprite,
  balloonsSprite, confettiSprite, ribbonsSprite, magicDustSprite,
  firefliesSprite, butterfliesSprite, blossomsSprite, dandelionSprite,
  shardsSprite, runesSprite, jackSparksSprite, cometsSprite,
  geometricSprite, musicNotesSprite, paperPlanesSprite, autumnLeavesSprite,
  rosePetalsSprite, skullsSprite, hempLeavesSprite, koiFishSprite,
  jellyfishSprite, rocketsSprite, fairiesSprite,
  umbrellasSprite, astronautsSprite,
];

const spriteLabels = [
  'None',
  'Bubbles', 'Hearts', 'Snowflakes', 'Stars & Sparkles',
  'Balloons', 'Confetti', 'Gift Ribbons', 'Magic Dust',
  'Fireflies', 'Butterflies', 'Cherry Blossoms', 'Dandelion Seeds',
  'Crystal Shards', 'Spell Runes', 'Jack-o-Lantern Sparks', 'Comets',
  'Geometric Shapes', 'Music Notes', 'Paper Planes', 'Autumn Leaves',
  'Rose Petals', 'Skulls', 'Hemp Leaves', 'Koi Fish',
  'Jellyfish', 'Rockets', 'Fairies',
  'Umbrellas', 'Astronauts',
];

// ── Presets ───────────────────────────────────────────────────────────────────
// Each entry selects a background index (into variations[]) and a sprite index
// (into sprites[], where 0 = None).

const PRESETS = [
  { name: 'Woodstock',       bg: 14, sprite: 10 },  // Tie Dye + Butterflies
  { name: 'Love Rain',       bg: 15, sprite:  2 },  // Hearts + Hearts
  { name: 'Music Festival',  bg: 17, sprite: 18 },  // Fireworks + Music Notes
  { name: 'Winter',          bg: 12, sprite:  3 },  // Snowfall + Snowflakes
  { name: 'Suds',            bg: 13, sprite:  1 },  // Beer + Bubbles
  { name: 'Holiday',         bg: 16, sprite:  4 },  // Christmas + Stars & Sparkles
  { name: 'Party Time',      bg: 18, sprite:  5 },  // Confetti + Balloons
  { name: 'Autumn Leaves',   bg: 19, sprite: 20 },  // Autumn Leaves + Autumn Leaves
  { name: 'Blossom Pool',    bg: 11, sprite: 11 },  // Pool Water + Cherry Blossoms
  { name: 'Magic Spell',     bg: 10, sprite: 14 },  // Northern Fire + Spell Runes
  { name: 'Stardust',        bg: 20, sprite:  8 },  // Starfield + Magic Dust
  { name: 'Cosmic Ether',    bg: 22, sprite: 15 },  // Rainbow Rays + Jack-o-Lantern Sparks
  { name: 'Candy Rain',      bg:  9, sprite:  6 },  // Candy + Confetti
  { name: 'Will-o-Wisp',     bg:  8, sprite:  9 },  // Smoke + Fireflies
  { name: 'Neon Stars',      bg:  7, sprite: 16 },  // Neon City + Comets
  { name: 'Geometry Pool',   bg:  6, sprite: 17 },  // Ocean Depths + Geometric Shapes
  { name: 'Sunset Sparkle',  bg:  5, sprite:  8 },  // Sunset Drift + Magic Dust
  { name: 'Liquid Stars',    bg:  4, sprite:  4 },  // Liquid Metal + Stars & Sparkles
  { name: 'Northern Lights', bg:  3, sprite: 18 },  // Aurora Borealis + Music Notes
  { name: 'Molten Lava',     bg:  2, sprite:  9 },  // Lava Lamp + Fireflies
  { name: 'Dream Seeds',     bg:  1, sprite: 12 },  // Dreamy Blobs + Dandelion Seeds
  { name: 'Broken World',    bg:  8, sprite: 13 },  // Smoke + Crystal Shards
  { name: 'Christmas Snow',  bg: 16, sprite:  3 },  // Christmas + Snowflakes
  { name: 'First Dance',    bg: 23, sprite: 21 },  // Bokeh + Rose Petals
  { name: 'Headbanger',     bg: 24, sprite: 22 },  // Stage Lights + Skulls
  { name: 'Session',        bg: 14, sprite: 23 },  // Tie Dye + Hemp Leaves
  { name: 'Zen Garden',     bg: 25, sprite: 24 },  // Koi Pond + Koi Fish
  { name: 'Deep Sea',       bg: 26, sprite: 25 },  // Deep Ocean + Jellyfish
  { name: 'Blast Off',      bg: 20, sprite: 26 },  // Starfield + Rockets
  { name: 'Fairy Garden',   bg: 27, sprite: 27 },  // Unicorn Sky + Fairies
  { name: 'Stormy Night',   bg: 28, sprite: 28 },  // Rain on Glass + Umbrellas
  { name: 'Spacewalk',      bg: 29, sprite: 29 },  // Nebula + Astronauts
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

// ─── switch preset ────────────────────────────────────────────────────────────

function switchPreset(index) {
  const p = PRESETS[index];
  const wasRunning = isRunning;
  const prevBgIdx  = currentIdx;

  isRunning = true;          // ensure animation runs when preset is applied
  switchTo(p.bg);
  switchSprite(p.sprite);

  // switchTo creates a fresh CompositingLayer but only starts it when isRunning
  // was already true before the call — start it if the bg changed or was stopped.
  if (prevBgIdx !== p.bg || !wasRunning) {
    compositing?.start();
  }

  document.querySelectorAll('.preset-btn').forEach((b, i) =>
    b.classList.toggle('active', i === index)
  );
}

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

const presetBar = document.getElementById('preset-bar');
PRESETS.forEach((p, i) => {
  const btn = document.createElement('button');
  btn.className   = 'preset-btn';
  btn.textContent = p.name;
  btn.title       = `${variations[p.bg].name}  +  ${spriteLabels[p.sprite]}`;
  btn.addEventListener('click', () => switchPreset(i));
  presetBar.appendChild(btn);
});

// ─── initial load ─────────────────────────────────────────────────────────────

switchTo(0);
switchSprite(0);
