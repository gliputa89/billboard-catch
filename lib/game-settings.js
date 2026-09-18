/* Ustawienia trudności i wyłączone assety — Xano (localStorage tylko jako cache) */
window.BBC_GameSettings = (function () {
  'use strict';

  const LS_KEY = 'bbcatch.settings.v1';
  const LS_DEBUG = 'bbcatch.debug.v1';
  const SAVE_DEBOUNCE_MS = 500;

  const SLIDERS = [
    { key: 'fallSpeed', label: 'Prędkość opadania', min: 50, max: 150, step: 5, unit: '%', hint: 'Jak szybko spadają obiekty' },
    { key: 'speedGrowth', label: 'Przyspieszanie w czasie', min: 50, max: 150, step: 5, unit: '%', hint: 'Rośnie trudność w miarę gry' },
    { key: 'spawnRate', label: 'Częstość spawnów', min: 50, max: 160, step: 5, unit: '%', hint: 'Ile obiektów pojawia się na ekranie' },
    { key: 'badChance', label: 'Udział przeszkód', min: 0, max: 150, step: 5, unit: '%', hint: 'Szansa na faktury, odklejone plakaty itd.' },
    { key: 'pairSpawns', label: 'Spawny podwójne', min: 0, max: 180, step: 5, unit: '%', hint: 'Dwa obiekty obok siebie' },
    { key: 'extrasRate', label: 'Bonusy / power-upy', min: 50, max: 180, step: 5, unit: '%', hint: 'Jak często spadają dodatki' },
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
  const PRESET_IDS = new Set([...PRESET_ORDER, 'custom']);
  const TO_API = {
    fallSpeed: 'fall_speed',
    speedGrowth: 'speed_growth',
    spawnRate: 'spawn_rate',
    badChance: 'bad_chance',
    pairSpawns: 'pair_spawns',
    extrasRate: 'extras_rate',
  };
  const FROM_API = Object.fromEntries(Object.entries(TO_API).map(([k, v]) => [v, k]));

  function defaultSliders() {
    return { ...PRESETS.normal, preset: 'normal', disabledAssets: [] };
  }

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function knownAssetKeys() {
    const FI = window.BBC_FallingItems;
    if (!FI || !Array.isArray(FI.CATALOG)) return null;
    return new Set(FI.CATALOG.map((c) => c.key));
  }

  function sanitizeDisabled(keys) {
    if (!Array.isArray(keys)) return [];
    const known = knownAssetKeys();
    const out = [];
    for (const raw of keys) {
      const key = String(raw || '').trim();
      if (!key || out.includes(key)) continue;
      if (known && !known.has(key)) continue;
      out.push(key);
    }
    return out;
  }

  function sanitize(raw) {
    const base = defaultSliders();
    if (!raw || typeof raw !== 'object') return base;
    const src = { ...raw };
    for (const [snake, camel] of Object.entries(FROM_API)) {
      if (src[camel] == null && src[snake] != null) src[camel] = src[snake];
    }
    if (src.disabledAssets == null && src.disabled_assets != null) {
      src.disabledAssets = src.disabled_assets;
    }
    const out = { ...base, ...src };
    for (const sl of SLIDERS) {
      const n = Number(out[sl.key]);
      out[sl.key] = clamp(Number.isFinite(n) ? n : PRESETS.normal[sl.key], sl.min, sl.max);
    }
    const p = String(out.preset || 'normal').toLowerCase();
    return {
      fallSpeed: out.fallSpeed,
      speedGrowth: out.speedGrowth,
      spawnRate: out.spawnRate,
      badChance: out.badChance,
      pairSpawns: out.pairSpawns,
      extrasRate: out.extrasRate,
      preset: PRESET_IDS.has(p) ? p : 'custom',
      disabledAssets: sanitizeDisabled(out.disabledAssets),
    };
  }

  function toApiPayload(sliders) {
    const s = sanitize(sliders);
    const payload = { preset: s.preset, disabled_assets: s.disabledAssets };
    for (const [camel, snake] of Object.entries(TO_API)) payload[snake] = s[camel];
    return payload;
  }

  function readCache() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return defaultSliders();
      return sanitize(JSON.parse(raw));
    } catch {
      return defaultSliders();
    }
  }

  function writeCache(sliders) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(sliders)); } catch { /* prywatny tryb */ }
  }

  function xano() {
    return window.BBC_XanoLeaderboard;
  }

  function persistDebugFlag(on) {
    try { localStorage.setItem(LS_DEBUG, JSON.stringify(!!on)); } catch { /* prywatny tryb */ }
  }

  function readDebugMode() {
    try {
      const q = new URLSearchParams(location.search).get('debug');
      if (q === '0' || q === 'false') {
        persistDebugFlag(false);
        return false;
      }
      if (q === '1' || q === 'true') {
        persistDebugFlag(true);
        return true;
      }
    } catch { /* ignore */ }
    if (/debug/i.test(location.hash)) return true;
    try {
      const v = localStorage.getItem(LS_DEBUG);
      return v == null ? false : JSON.parse(v) === true;
    } catch {
      return false;
    }
  }

  let current = readCache();
  let writable = false;
  let hydrated = false;
  let dirty = false;
  let saveTimer = null;

  function applyDisabledToItems(sliders) {
    const FI = window.BBC_FallingItems;
    if (!FI || typeof FI.setDisabled !== 'function') return;
    FI.setDisabled((sliders || current).disabledAssets);
  }

  applyDisabledToItems(current);

  function load() {
    return { ...current, disabledAssets: current.disabledAssets.slice() };
  }

  function setWritable(on) {
    writable = !!on;
  }

  function isWritable() {
    return writable;
  }

  async function saveToServer(payload) {
    const api = xano();
    if (!api || typeof api.saveSettings !== 'function') return null;
    const saved = await api.saveSettings(payload);
    return saved ? sanitize(saved) : null;
  }

  function flushSave() {
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
    if (!writable || !hydrated || !dirty) return Promise.resolve(null);
    dirty = false;
    const snapshot = { ...current };
    return saveToServer(toApiPayload(snapshot)).then((saved) => {
      if (saved && !dirty) {
        current = saved;
        writeCache(current);
        applyDisabledToItems(current);
      }
      return saved;
    }).catch(() => null);
  }

  function queueSave() {
    if (!writable || !hydrated) return;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { flushSave(); }, SAVE_DEBOUNCE_MS);
  }

  function save(sliders) {
    if (!writable) return;
    current = sanitize({ ...current, ...sliders, disabledAssets: current.disabledAssets });
    writeCache(current);
    applyDisabledToItems(current);
    dirty = true;
    queueSave();
  }

  function saveDisabled(keys) {
    if (!writable) return load();
    current = sanitize({ ...current, disabledAssets: keys });
    writeCache(current);
    applyDisabledToItems(current);
    dirty = true;
    queueSave();
    return load();
  }

  async function hydrateFromServer() {
    const api = xano();
    try {
      if (api && typeof api.fetchSettings === 'function') {
        const remote = await api.fetchSettings();
        if (remote && !dirty) {
          current = sanitize(remote);
          writeCache(current);
          applyDisabledToItems(current);
        }
      }
    } catch {
      /* offline / błąd API — zostaw cache lub default */
    }
    hydrated = true;
    if (dirty) queueSave();
    return load();
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', () => { flushSave(); });
  }

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
    LS_KEY, LS_DEBUG, SLIDERS, PRESETS, PRESET_ORDER,
    load, save, saveDisabled, flushSave, hydrateFromServer, toConfig, makeDiff, defaultSliders,
    applyPreset, slidersMatchPreset, slidersFromPreset,
    readDebugMode, persistDebugFlag, setWritable, isWritable,
  };
})();
