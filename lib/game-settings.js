/* Ustawienia trudności — presety, suwaki, localStorage */
window.BBC_GameSettings = (function () {
  'use strict';

  const LS_KEY = 'bbcatch.settings.v1';

  const SLIDERS = [
    { key: 'fallSpeed', label: 'Prędkość opadania', min: 50, max: 150, step: 5, unit: '%', hint: 'Jak szybko spadają obiekty' },
    { key: 'speedGrowth', label: 'Przyspieszanie w czasie', min: 50, max: 150, step: 5, unit: '%', hint: 'Rośnie trudność w miarę gry' },
    { key: 'spawnRate', label: 'Częstość spawnów', min: 50, max: 160, step: 5, unit: '%', hint: 'Ile obiektów pojawia się na ekranie' },
    { key: 'badChance', label: 'Udział przeszkód', min: 0, max: 150, step: 5, unit: '%', hint: 'Szansa na bomby, faktury itd.' },
    { key: 'pairSpawns', label: 'Spawny podwójne', min: 0, max: 180, step: 5, unit: '%', hint: 'Dwa obiekty obok siebie' },
    { key: 'extrasRate', label: 'Bonusy / power-upy / klocki', min: 50, max: 180, step: 5, unit: '%', hint: 'Jak często spadają dodatki' },
  ];

  const PRESETS = {
    relax: {
      id: 'relax', label: 'Relaks', icon: '🌿',
      fallSpeed: 72, speedGrowth: 65, spawnRate: 68,
      badChance: 55, pairSpawns: 30, extrasRate: 75,
    },
    normal: {
      id: 'normal', label: 'Normalny', icon: '⚡',
      fallSpeed: 100, speedGrowth: 100, spawnRate: 100,
      badChance: 100, pairSpawns: 100, extrasRate: 100,
    },
    hard: {
      id: 'hard', label: 'Trudny', icon: '🔥',
      fallSpeed: 118, speedGrowth: 125, spawnRate: 130,
      badChance: 125, pairSpawns: 140, extrasRate: 115,
    },
    insane: {
      id: 'insane', label: 'Szalone', icon: '💥',
      fallSpeed: 145, speedGrowth: 150, spawnRate: 155,
      badChance: 140, pairSpawns: 175, extrasRate: 145,
    },
  };

  const PRESET_ORDER = ['relax', 'normal', 'hard', 'insane'];

  function defaultSliders() {
    return { ...PRESETS.normal, preset: 'normal' };
  }

  function load() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return defaultSliders();
      const s = JSON.parse(raw);
      const out = { ...defaultSliders(), ...s };
      for (const sl of SLIDERS) {
        out[sl.key] = clamp(out[sl.key] ?? PRESETS.normal[sl.key], sl.min, sl.max);
      }
      return out;
    } catch {
      return defaultSliders();
    }
  }

  function save(sliders) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(sliders)); } catch { /* prywatny tryb */ }
  }

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  const pct = (v, base) => base * (v / 100);
  const inv = (v, base) => base / Math.max(0.01, v / 100);

  /** Konfiguracja silnika gry z wartości suwaków (100% = domyślne balansy) */
  function toConfig(sliders) {
    const s = sliders || load();
    return {
      baseFallSpeed: pct(s.fallSpeed, 150),
      speedGrowth: pct(s.speedGrowth, 0.03),
      speedCap: 80,
      spawnStart: inv(s.spawnRate, 1.25),
      spawnMin: Math.max(0.18, inv(s.spawnRate, 0.3)),
      spawnRamp: pct(s.spawnRate, 0.021),
      badGrace: 5,
      badMax: Math.min(0.55, pct(s.badChance, 0.36)),
      badStart: pct(s.badChance, 0.08),
      badRamp: pct(s.badChance, 0.008),
      pairStart: s.pairSpawns <= 20 ? 22 : 12,
      pairMax: Math.min(0.65, pct(s.pairSpawns, 0.4)),
      pairRamp: pct(s.pairSpawns, 0.014),
      specialMin: inv(s.extrasRate, 8),
      specialMax: inv(s.extrasRate, 14),
      powerupMin: inv(s.extrasRate, 10),
      powerupMax: inv(s.extrasRate, 16),
      brandMin: inv(s.extrasRate, 9),
      brandMax: inv(s.extrasRate, 16),
      /** Mnożnik prędkości auta z ustawień (współmierny z opadaniem + spawnem) */
      carSpeedMul: Math.max(0.9, pct(s.fallSpeed, 1) * 0.65 + pct(s.spawnRate, 1) * 0.35),
      /** Ułamek narastającej prędkości gry przekazywany na auto w trakcie rozgrywki */
      carTimeSync: 0.5,
      presetId: s.preset || 'normal',
      presetLabel: PRESETS[s.preset]?.label || (s.preset === 'custom' ? 'Własne' : 'Normalny'),
    };
  }

  function makeDiff(cfg) {
    return {
      speedMul: (t) => 1 + Math.min(t, cfg.speedCap) * cfg.speedGrowth,
      spawnInt: (t) => Math.max(cfg.spawnMin, cfg.spawnStart - t * cfg.spawnRamp),
      badChance: (t) => (t < cfg.badGrace ? 0 : Math.min(cfg.badMax, cfg.badStart + (t - cfg.badGrace) * cfg.badRamp)),
      pairChance: (t) => (t < cfg.pairStart ? 0 : Math.min(cfg.pairMax, (t - cfg.pairStart) * cfg.pairRamp)),
    };
  }

  function slidersMatchPreset(sliders, presetId) {
    const p = PRESETS[presetId];
    if (!p) return false;
    return SLIDERS.every((sl) => sliders[sl.key] === p[sl.key]);
  }

  function applyPreset(sliders, presetId) {
    const p = PRESETS[presetId];
    if (!p) return sliders;
    const next = { ...sliders, preset: presetId };
    for (const sl of SLIDERS) next[sl.key] = p[sl.key];
    return next;
  }

  function slidersFromPreset(presetId) {
    return applyPreset(defaultSliders(), presetId);
  }

  return {
    LS_KEY, SLIDERS, PRESETS, PRESET_ORDER,
    load, save, toConfig, makeDiff, defaultSliders,
    applyPreset, slidersMatchPreset, slidersFromPreset,
  };
})();
