/* ADS CATCHER — gra zręcznościowa dla znajdzreklame.pl */
(() => {
  "use strict";

  // ------------------------------------------------------------------
  // Stałe i narzędzia
  // ------------------------------------------------------------------
  const W = 960,
    H = 640;
  const SIDEWALK_Y = 436; // górna krawędź chodnika (podstawa budynków)
  const ROAD_Y = 470; // górna krawędź jezdni
  const PLAYER_Y = H - 30; // linia kół pojazdu gracza
  const CATCH_Y = PLAYER_Y - 112; // górna krawędź tablicy na dachu (strefa łapania)
  const CATCH_ZONE_BOTTOM = PLAYER_Y + 18; // dolna krawędź strefy łapania (cały van + zapas)
  const DOUBLE_DURATION = 6; // sekundy bonusu 2x
  const PU_DURATION = 8; // czas power-upów tymczasowych
  const PAWEL_DURATION = 7; // podwyższenie tempa (krócej niż wcześniej)
  const PAWEL_SPEED_MUL = 1.2; // było 1.45 — wyraźnie, ale nie aż tak ostro
  const PAWEL_STING_DUR = 2.85;
  const PENALTY_STING_DUR = 3.8;
  const PENALTY_STING_INTRO = 0.75;
  const PENALTY_STING_FADE = 0.45;
  const PENALTY_PTS = 10000;
  const ZUREK_FLY_COUNT = 36;
  const ZUREK_FLY_AFTER = 5;
  const START_LIVES = 4;
  const MAX_LIVES = 5;
  const PLAYER_BASE_W = 124;
  const CAR_BASE_MAXV = 820;
  const CAR_BASE_ACC = 4400;
  const CAR_BASE_DEC = 3800;
  const SPAWN_REACH_BUFFER = 0.42;
  const BRAND = "znajdzreklame.pl";
  const LOGO_URL = "logo.svg";
  const LOGO_CDN = "https://www.znajdzreklame.pl/logo.svg";
  const logo = { base: null, white: null, ready: false, aspect: 8 };

  const GS = window.BBC_GameSettings;
  const XL = window.BBC_XanoLeaderboard;
  const LS = {
    board: "bbcatch.board.v1",
    best: "bbcatch.best.v1",
    name: "bbcatch.name.v1",
    mute: "bbcatch.mute.v1",
    debug: (GS && GS.LS_DEBUG) || "bbcatch.debug.v1",
  };
  const store = {
    get(k, d) {
      try {
        const v = localStorage.getItem(k);
        return v == null ? d : JSON.parse(v);
      } catch {
        return d;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem(k, JSON.stringify(v));
      } catch {
        /* prywatny tryb */
      }
    },
  };

  function readDebugMode() {
    if (GS && typeof GS.readDebugMode === "function") return GS.readDebugMode();
    try {
      const q = new URLSearchParams(location.search).get("debug");
      if (q === "0" || q === "false") {
        store.set(LS.debug, false);
        return false;
      }
      if (q === "1" || q === "true") {
        store.set(LS.debug, true);
        return true;
      }
    } catch {
      /* ignore */
    }
    if (/debug/i.test(location.hash)) return true;
    return !!store.get(LS.debug, false);
  }
  let DEBUG = readDebugMode();
  document.body.classList.toggle("debug-mode", DEBUG);
  if (GS && typeof GS.setWritable === "function") GS.setWritable(DEBUG);
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const $ = (s) => document.querySelector(s);

  const fmt = (n) =>
    Math.round(n)
      .toLocaleString("pl-PL")
      .replace(/\u00a0/g, " ");
  const BOARD_MEDALS = ["🥇", "🥈", "🥉"];

  function parseBoardDate(raw) {
    if (raw == null || raw === "") return null;
    const d = typeof raw === "number" ? new Date(raw) : new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function formatBoardWhen(raw) {
    const d = parseBoardDate(raw);
    if (!d) return "—";
    const day = d.getDate();
    const mon = new Intl.DateTimeFormat("pl-PL", { month: "short" })
      .format(d)
      .replace(/\./g, "")
      .trim();
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${day} ${mon} · ${hh}:${mm}`;
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const lerp = (a, b, t) => a + (b - a) * t;
  function mulberry(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ------------------------------------------------------------------
  // Dźwięk (WebAudio — SFX + synthwave BGM a la Midnight City)
  // ------------------------------------------------------------------
  const audio = {
    ctx: null,
    muted: !!store.get(LS.mute, false),
    master: null,
    sfxGain: null,
    musicGain: null,
  };
  function audioInit() {
    if (audio.ctx) return;
    try {
      audio.ctx = new (window.AudioContext || window.webkitAudioContext)();
      audio.master = audio.ctx.createGain();
      audio.master.gain.value = 1;
      audio.sfxGain = audio.ctx.createGain();
      audio.sfxGain.gain.value = 1;
      audio.musicGain = audio.ctx.createGain();
      audio.musicGain.gain.value = audio.muted ? 0 : 0.26;
      audio.sfxGain.connect(audio.master);
      audio.musicGain.connect(audio.master);
      audio.master.connect(audio.ctx.destination);
      musicSetupFx();
    } catch {
      /* brak audio */
    }
  }
  function tone(
    freq,
    dur,
    { type = "square", vol = 0.06, delay = 0, slide = 0 } = {},
  ) {
    if (!audio.ctx || audio.muted) return;
    const c = audio.ctx,
      t0 = c.currentTime + delay;
    const o = c.createOscillator(),
      g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slide)
      o.frequency.exponentialRampToValueAtTime(
        Math.max(30, freq + slide),
        t0 + dur,
      );
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(audio.sfxGain || c.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }
  const sfx = {
    catch(combo) {
      tone(520 + Math.min(combo, 12) * 45, 0.09, { type: "square" });
      tone(780 + Math.min(combo, 12) * 45, 0.08, {
        type: "triangle",
        delay: 0.05,
        vol: 0.04,
      });
    },
    bad() {
      tone(160, 0.25, { type: "sawtooth", vol: 0.07, slide: -90 });
      tone(90, 0.3, { type: "square", vol: 0.05, delay: 0.03 });
    },
    miss() {
      tone(220, 0.18, { type: "triangle", vol: 0.05, slide: -120 });
    },
    bonus() {
      [523, 659, 784, 1046].forEach((f, i) =>
        tone(f, 0.12, { type: "square", delay: i * 0.07, vol: 0.06 }),
      );
    },
    mega() {
      [392, 523, 659, 784, 1046, 1318].forEach((f, i) =>
        tone(f, 0.16, { type: "square", delay: i * 0.08, vol: 0.07 }),
      );
    },
    tick() {
      tone(880, 0.035, { type: "square", vol: 0.035 });
    },
    over() {
      [440, 370, 311, 220].forEach((f, i) =>
        tone(f, 0.28, { type: "triangle", delay: i * 0.18, vol: 0.07 }),
      );
    },
    start() {
      tone(440, 0.1, {});
      tone(660, 0.14, { delay: 0.1 });
    },
    siren() {
      for (let i = 0; i < 6; i++) {
        tone(i % 2 ? 880 : 660, 0.14, {
          type: "sawtooth",
          delay: i * 0.16,
          vol: 0.045,
        });
        tone(i % 2 ? 660 : 880, 0.14, {
          type: "triangle",
          delay: i * 0.16 + 0.08,
          vol: 0.03,
        });
      }
    },
  };

  // --- Muzyka: oryginalny loop synthwave (104 BPM, arpeggio + pad + beat) ---
  const music = {
    playing: false,
    timer: null,
    nextTime: 0,
    step: 0,
    mode: "game", // game | casino
    BPM: 104,
    loopSteps: 64, // 4 takty × 16 szesnastek
    delay: null,
    delayFb: null,
  };
  const CHORDS = [
    { root: 110, tones: [220, 261.63, 329.63, 440] }, // Am
    { root: 87.31, tones: [174.61, 220, 261.63, 349.23] }, // F
    { root: 130.81, tones: [261.63, 329.63, 392, 523.25] }, // C (oktawa wyżej)
    { root: 98, tones: [196, 246.94, 293.66, 392] }, // G
  ];
  const ARP = [0, 1, 2, 1, 3, 2, 1, 2, 0, 1, 2, 3, 2, 1, 0, 1];
  const LEAD = [0, -1, -1, -1, 2, -1, 1, -1, 3, -1, 2, -1, 1, 0, -1, -1]; // -1 = brak nuty

  function musicSetupFx() {
    if (!audio.ctx || music.delay) return;
    const c = audio.ctx;
    music.delay = c.createDelay(1.2);
    music.delay.delayTime.value = 0.28;
    music.delayFb = c.createGain();
    music.delayFb.gain.value = 0.28;
    const wet = c.createGain();
    wet.gain.value = 0.35;
    music.delay.connect(music.delayFb).connect(music.delay);
    music.delay.connect(wet).connect(audio.musicGain);
    music.wet = wet;
  }

  function musicOut(node) {
    return node.connect(audio.musicGain);
  }

  function musicSynth(
    freq,
    t,
    dur,
    {
      type = "sawtooth",
      vol = 0.07,
      cut = 2600,
      atk = 0.006,
      rel = 0.1,
      dest = "dry",
    } = {},
  ) {
    if (!audio.ctx || audio.muted || !freq) return;
    const c = audio.ctx;
    const o = c.createOscillator(),
      g = c.createGain(),
      f = c.createBiquadFilter();
    o.type = type;
    o.frequency.value = freq;
    f.type = "lowpass";
    f.frequency.value = cut;
    f.Q.value = 1.4;
    o.connect(f).connect(g);
    if (dest === "wet" && music.wet) g.connect(music.wet);
    else musicOut(g);
    const end = t + dur;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + atk);
    g.gain.setValueAtTime(vol * 0.7, Math.max(t + atk, end - rel));
    g.gain.exponentialRampToValueAtTime(0.0001, end);
    o.start(t);
    o.stop(end + 0.04);
  }

  function musicKick(t, vol = 0.38) {
    if (!audio.ctx || audio.muted) return;
    const c = audio.ctx,
      o = c.createOscillator(),
      g = c.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(160, t);
    o.frequency.exponentialRampToValueAtTime(48, t + 0.16);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    o.connect(g);
    musicOut(g);
    o.start(t);
    o.stop(t + 0.18);
  }

  function musicSnare(t, vol = 0.11) {
    if (!audio.ctx || audio.muted) return;
    const c = audio.ctx,
      len = (c.sampleRate * 0.11) | 0;
    const buf = c.createBuffer(1, len, c.sampleRate),
      d = buf.getChannelData(0);
    for (let i = 0; i < len; i++)
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.8);
    const src = c.createBufferSource();
    src.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 1800;
    f.Q.value = 0.7;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
    src.connect(f).connect(g);
    musicOut(g);
    src.start(t);
    src.stop(t + 0.12);
  }

  function musicHat(t, vol = 0.035, open = false) {
    if (!audio.ctx || audio.muted) return;
    const c = audio.ctx,
      len = (c.sampleRate * (open ? 0.06 : 0.035)) | 0;
    const buf = c.createBuffer(1, len, c.sampleRate),
      d = buf.getChannelData(0);
    for (let i = 0; i < len; i++)
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, open ? 1.2 : 2.4);
    const src = c.createBufferSource();
    src.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = 7000;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + (open ? 0.06 : 0.035));
    src.connect(f).connect(g);
    musicOut(g);
    src.start(t);
    src.stop(t + 0.07);
  }

  function musicPad(chord, t, dur) {
    if (!audio.ctx || audio.muted) return;
    const c = audio.ctx;
    [0, 1, 2].forEach((i, k) => {
      const o = c.createOscillator(),
        g = c.createGain(),
        f = c.createBiquadFilter();
      o.type = k === 0 ? "sawtooth" : "triangle";
      o.frequency.value = chord.tones[i] / 2;
      f.type = "lowpass";
      f.frequency.value = 900;
      f.Q.value = 0.5;
      o.connect(f).connect(g);
      musicOut(g);
      const atk = 0.35,
        rel = 0.45,
        end = t + dur;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.028 - k * 0.006, t + atk);
      g.gain.setValueAtTime(0.022 - k * 0.005, end - rel);
      g.gain.exponentialRampToValueAtTime(0.0001, end);
      o.start(t);
      o.stop(end + 0.05);
    });
  }

  const CASINO_WALK = [
    [130.81, 164.81, 174.61, 185.0, 196.0, 164.81, 146.83, 196.0],
    [110.0, 138.59, 164.81, 174.61, 196.0, 164.81, 146.83, 110.0],
    [146.83, 174.61, 196.0, 220.0, 246.94, 220.0, 196.0, 174.61],
    [196.0, 246.94, 293.66, 246.94, 196.0, 164.81, 146.83, 185.0],
  ];
  const CASINO_CHORDS = [
    [261.63, 329.63, 392.0, 440.0], // C6
    [220.0, 277.18, 329.63, 392.0], // A7
    [293.66, 349.23, 440.0, 523.25], // Dm7
    [196.0, 246.94, 293.66, 349.23], // G7
  ];

  function musicScheduleCasino(step, t) {
    const bar = (step / 16) | 0,
      pos = step % 16;
    const sixteenth = 60 / music.BPM / 4;
    const swing = pos % 2 === 1 ? sixteenth * 0.22 : 0;
    const tt = t + swing;
    const walk = CASINO_WALK[bar % 4];
    if (pos % 2 === 0) {
      musicSynth(walk[pos / 2], tt, sixteenth * 1.7, {
        type: "triangle",
        vol: 0.11,
        cut: 480,
        atk: 0.004,
        rel: 0.08,
      });
    }
    if (pos === 0 || pos === 8) {
      const ch = CASINO_CHORDS[bar % 4];
      for (let i = 0; i < ch.length; i++) {
        musicSynth(ch[i], tt, sixteenth * 3.2, {
          type: i % 2 ? "triangle" : "square",
          vol: 0.026,
          cut: 2400,
          dest: "wet",
        });
      }
    }
    if (pos === 0 && bar % 2 === 0) {
      musicSynth(1046.5, tt, 0.09, { type: "sine", vol: 0.03, cut: 5000 });
      musicSynth(1568, tt + 0.07, 0.08, { type: "sine", vol: 0.02, cut: 5000 });
    }
    if (pos === 0) musicKick(tt, 0.22);
    if (pos === 4 || pos === 12) musicSnare(tt, 0.065);
    if (pos % 4 === 0) musicHat(tt, 0.038, true);
    else if (pos % 2 === 0) musicHat(tt, 0.02);
  }

  function musicScheduleStep(step, t) {
    if (music.mode === "casino") {
      musicScheduleCasino(step, t);
      return;
    }
    const bar = (step / 16) | 0,
      pos = step % 16;
    const chord = CHORDS[bar % 4];
    const sixteenth = 60 / music.BPM / 4;
    const noteDur = sixteenth * 0.82;

    // --- Arpeggio (charakterystyczny synth 16th — serce utworu) ---
    const arpIdx = ARP[pos];
    musicSynth(chord.tones[arpIdx], t, noteDur, {
      type: "sawtooth",
      vol: 0.055,
      cut: 3200,
      dest: "wet",
    });

    // --- Lead (co 2 takt, górna linia) ---
    if (bar % 2 === 1) {
      const li = LEAD[pos];
      if (li >= 0)
        musicSynth(chord.tones[li] * 2, t, noteDur * 1.4, {
          type: "square",
          vol: 0.022,
          cut: 4200,
        });
    }

    // --- Bas (puls na 1 i 3, dodatkowo offbeat) ---
    if (pos === 0 || pos === 8)
      musicSynth(chord.root, t, sixteenth * 1.6, {
        type: "triangle",
        vol: 0.09,
        cut: 420,
        atk: 0.002,
        rel: 0.08,
      });
    else if (pos === 10)
      musicSynth(chord.root * 1.5, t, sixteenth * 0.9, {
        type: "triangle",
        vol: 0.04,
        cut: 500,
        atk: 0.002,
        rel: 0.06,
      });

    // --- Pad (początek taktu) ---
    if (pos === 0) musicPad(chord, t, (60 / music.BPM) * 4 - 0.02);

    // --- Beat (retro 808 + gated snare) ---
    if (pos === 0) musicKick(t, 0.4);
    else if (pos === 8) musicKick(t, 0.32);
    if (pos === 4 || pos === 12) musicSnare(t, pos === 4 ? 0.12 : 0.1);
    if (pos % 2 === 0) musicHat(t, pos % 4 === 0 ? 0.03 : 0.022);
    if (pos === 14) musicHat(t, 0.028, true);
  }

  function musicTick() {
    if (!audio.ctx || !music.playing || audio.muted) return;
    const c = audio.ctx,
      ahead = 0.14,
      sixteenth = 60 / music.BPM / 4;
    while (music.nextTime < c.currentTime + ahead) {
      musicScheduleStep(music.step, music.nextTime);
      music.nextTime += sixteenth;
      music.step = (music.step + 1) % music.loopSteps;
    }
  }

  function setMusicMode(mode) {
    audioInit();
    if (!audio.ctx) return;
    const next = mode === "casino" ? "casino" : "game";
    music.mode = next;
    music.BPM = next === "casino" ? 126 : 104;
    music.step = 0;
    music.nextTime = audio.ctx.currentTime + 0.05;
    if (!music.playing && !audio.muted) startMusic();
  }

  function startMusic() {
    if (!audio.ctx || music.playing) return;
    music.playing = true;
    if (!music.mode) music.mode = "game";
    music.step = 0;
    music.nextTime = audio.ctx.currentTime + 0.08;
    if (audio.musicGain) {
      audio.musicGain.gain.cancelScheduledValues(audio.ctx.currentTime);
      audio.musicGain.gain.setValueAtTime(
        audio.muted ? 0 : 0.001,
        audio.ctx.currentTime,
      );
      audio.musicGain.gain.linearRampToValueAtTime(
        audio.muted ? 0 : 0.26,
        audio.ctx.currentTime + 1.2,
      );
    }
    music.timer = setInterval(musicTick, 25);
    musicTick();
  }

  function stopMusic(fade = true) {
    music.playing = false;
    music.mode = "game";
    music.BPM = 104;
    if (music.timer) {
      clearInterval(music.timer);
      music.timer = null;
    }
    if (fade && audio.ctx && audio.musicGain) {
      const t = audio.ctx.currentTime;
      audio.musicGain.gain.cancelScheduledValues(t);
      audio.musicGain.gain.setValueAtTime(audio.musicGain.gain.value, t);
      audio.musicGain.gain.linearRampToValueAtTime(0.0001, t + 0.6);
    } else if (audio.ctx && audio.musicGain && !audio.muted) {
      audio.musicGain.gain.value = 0.26;
    }
  }

  function setMuted(m) {
    audio.muted = m;
    store.set(LS.mute, m);
    $("#btn-mute").textContent = m ? "🔇" : "🔊";
    if (audio.musicGain && audio.ctx) {
      audio.musicGain.gain.cancelScheduledValues(audio.ctx.currentTime);
      audio.musicGain.gain.setValueAtTime(
        m ? 0 : music.playing ? 0.26 : 0,
        audio.ctx.currentTime,
      );
    }
    if (!m && (state === "play" || state === "start") && !music.playing)
      startMusic();
  }

  function ensureMenuMusic() {
    if (state !== "start" || audio.muted) return;
    audioInit();
    if (audio.ctx && audio.ctx.state === "suspended") audio.ctx.resume();
    startMusic();
  }

  // ------------------------------------------------------------------
  // Pomocnicze rysowanie
  // ------------------------------------------------------------------
  function rrect(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function fillRR(x, y, w, h, r, color) {
    rrect(x, y, w, h, r);
    ctx.fillStyle = color;
    ctx.fill();
  }
  function text(
    str,
    x,
    y,
    size,
    color,
    { align = "center", weight = 900, base = "middle", stroke, lw = 4 } = {},
  ) {
    ctx.font = `${weight} ${size}px Rubik, system-ui, sans-serif`;
    ctx.textAlign = align;
    ctx.textBaseline = base;
    if (stroke) {
      ctx.lineWidth = lw;
      ctx.lineJoin = "round";
      ctx.strokeStyle = stroke;
      ctx.strokeText(str, x, y);
    }
    ctx.fillStyle = color;
    ctx.fillText(str, x, y);
  }
  // Tekst dopasowany do szerokości pola
  function fitText(str, x, y, maxW, size, color, opts = {}) {
    ctx.font = `${opts.weight || 900} ${size}px Rubik, system-ui, sans-serif`;
    const m = ctx.measureText(str).width;
    if (m > maxW) size = Math.max(6, (size * maxW) / m);
    text(str, x, y, size, color, opts);
  }

  // Logo znajdzreklame.pl (logo.svg)
  function loadLogo() {
    return new Promise((resolve) => {
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      const timer = setTimeout(() => {
        logo.ready = !!logo.base;
        done();
      }, 4000);
      const img = new Image();
      const finish = (ok) => {
        if (!ok) {
          logo.ready = false;
          clearTimeout(timer);
          return done();
        }
        logo.base = img;
        logo.aspect = (img.naturalWidth || 200) / (img.naturalHeight || 25);
        try {
          const c = document.createElement("canvas");
          c.width = img.naturalWidth || 200;
          c.height = img.naturalHeight || 25;
          const lx = c.getContext("2d");
          lx.drawImage(img, 0, 0);
          lx.globalCompositeOperation = "source-in";
          lx.fillStyle = "#ffffff";
          lx.fillRect(0, 0, c.width, c.height);
          const wimg = new Image();
          wimg.onload = () => {
            logo.white = wimg;
            logo.ready = true;
            clearTimeout(timer);
            done();
          };
          wimg.onerror = () => {
            logo.ready = true;
            clearTimeout(timer);
            done();
          };
          wimg.src = c.toDataURL("image/png");
        } catch {
          logo.ready = true;
          clearTimeout(timer);
          done();
        }
      };
      img.onload = () => finish(true);
      img.onerror = () => {
        if (img.src.includes(LOGO_CDN)) finish(false);
        else {
          img.onerror = () => finish(false);
          img.src = LOGO_CDN;
        }
      };
      img.src = LOGO_URL;
    });
  }
  /** Rysuje logo wyśrodkowane w (cx,cy). variant: 'default' | 'white' */
  function drawLogo(cx, cy, maxW, variant = "default", maxH) {
    const img = variant === "white" ? logo.white || logo.base : logo.base;
    if (!logo.ready || !img) {
      fitText(
        BRAND,
        cx,
        cy,
        maxW,
        Math.min(14, maxW / 7),
        variant === "white" ? "#fff" : "#394145",
        { weight: 700 },
      );
      return;
    }
    let w = maxW,
      h = w / logo.aspect;
    if (maxH && h > maxH) {
      h = maxH;
      w = h * logo.aspect;
    }
    ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
  }
  function heart(x, y, s, color) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.35);
    ctx.bezierCurveTo(x, y, x - s * 0.5, y, x - s * 0.5, y + s * 0.3);
    ctx.bezierCurveTo(x - s * 0.5, y + s * 0.6, x, y + s * 0.8, x, y + s);
    ctx.bezierCurveTo(
      x,
      y + s * 0.8,
      x + s * 0.5,
      y + s * 0.6,
      x + s * 0.5,
      y + s * 0.3,
    );
    ctx.bezierCurveTo(x + s * 0.5, y, x, y, x, y + s * 0.35);
    ctx.fillStyle = color;
    ctx.fill();
  }
  const POSTER_COLORS = [
    "#ff4d6d",
    "#ffb703",
    "#3a86ff",
    "#8338ec",
    "#06d6a0",
    "#fb5607",
    "#ff006e",
    "#00b4d8",
  ];
  const POSTER_WORDS = [
    "SALE",
    "-50%",
    "HIT!",
    "NOWOŚĆ",
    "PROMO",
    "WOW",
    "OKAZJA",
    "TOP",
  ];

  // ------------------------------------------------------------------
  // Spadające elementy (lib/falling-items.js)
  // ------------------------------------------------------------------
  let ITEMS = {};
  function initItemEngine() {
    ITEMS = BBC_FallingItems.createRenderer(ctx, drawLogo).ITEMS;
  }
  function itemPool(kind, t) {
    return Object.values(ITEMS).filter(
      (d) =>
        d.kind === kind &&
        t >= (d.minT || 0) &&
        BBC_FallingItems.isEnabled(d.key),
    );
  }

  // ------------------------------------------------------------------
  // Miasto w tle
  // ------------------------------------------------------------------
  const CITY_POI_DEFS = [
    { id: "bar", label: "BAR", col: "#fbbf24", glow: "#f59e0b", sub: "PUB" },
    { id: "sor", label: "SOR", col: "#fca5a5", glow: "#ef4444", sub: "24H" },
    {
      id: "hotel",
      label: "HOTEL",
      col: "#d8b4fe",
      glow: "#8b5cf6",
      sub: "★★★★",
    },
    {
      id: "basen",
      label: "BASEN",
      col: "#67e8f9",
      glow: "#06b6d4",
      sub: "POOL",
    },
    {
      id: "choroszcz",
      label: "CHOROSZCZ",
      col: "#86efac",
      glow: "#22c55e",
      sub: "MIASTO",
    },
  ];

  const city = {
    L: 2600,
    far: [],
    near: [],
    lamps: [],
    stops: [],
    cls: [],
    stars: [],
    pois: [],
  };
  let poiHighlight = null;
  let poiHighlightT = rand(10, 18);
  let poiHighlightLife = 0;

  function drawPoiIcon(id, cx, cy, t) {
    ctx.save();
    ctx.translate(cx, cy);
    if (id === "bar") {
      ctx.fillStyle = "#fff";
      fillRR(-5, -4, 10, 12, 2, "#fff");
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(-4, 0, 8, 7);
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(7, 2, 4, -0.8, 0.8);
      ctx.stroke();
    } else if (id === "sor") {
      ctx.fillStyle = "#fff";
      ctx.fillRect(-1.5, -8, 3, 16);
      ctx.fillRect(-8, -1.5, 16, 3);
    } else if (id === "hotel") {
      ctx.fillStyle = "#fff";
      fillRR(-8, 2, 16, 8, 2, "#fff");
      ctx.beginPath();
      ctx.moveTo(-9, 2);
      ctx.lineTo(0, -8);
      ctx.lineTo(9, 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = poiHighlight?.id === "hotel" ? "#ffd166" : "#c084fc";
      ctx.fillRect(-3, 5, 6, 4);
    } else if (id === "basen") {
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.arc(i * 5, 0, 4, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(-10, 6);
      ctx.quadraticCurveTo(0, 2 + Math.sin(t * 4) * 2, 10, 6);
      ctx.stroke();
    } else if (id === "choroszcz") {
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(8, 0);
      ctx.lineTo(0, 8);
      ctx.lineTo(-8, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#22c55e";
      ctx.fillRect(-2, -2, 4, 4);
    }
    ctx.restore();
  }

  function drawCityPOI(poi, dx, t) {
    const w = poi.w || (poi.label.length > 6 ? 118 : 72);
    const h = 54;
    const by = SIDEWALK_Y - h - 10;
    const hot = poiHighlight === poi && poiHighlightLife > 0;
    const pulse = hot
      ? 0.85 + 0.15 * Math.sin(t * 10)
      : 0.7 + 0.3 * Math.sin(t * 2.5 + poi.x * 0.01);
    ctx.save();
    ctx.shadowColor = poi.glow;
    ctx.shadowBlur = (hot ? 22 : 12) * pulse;
    fillRR(dx - 2, by - 2, w + 4, h + 4, 5, "rgba(0,0,0,.35)");
    fillRR(dx, by, w, h, 4, "#141828");
    fillRR(dx + 3, by + 3, w - 6, h - 6, 3, poi.col);
    drawPoiIcon(
      poi.id,
      dx + (poi.label.length > 6 ? 16 : 14),
      by + h * 0.38,
      t,
    );
    const tx = dx + w / 2 + (poi.label.length > 6 ? 6 : 4);
    fitText(
      poi.label,
      tx,
      by + h * 0.4,
      w - 28,
      poi.label.length > 6 ? 8 : 11,
      "#fff",
      { weight: 900, stroke: "rgba(0,0,0,.45)", lw: 2 },
    );
    fitText(poi.sub, tx, by + h * 0.72, w - 20, 6, "rgba(255,255,255,.92)", {
      weight: 700,
    });
    if (hot) {
      ctx.globalAlpha = 0.25 + 0.15 * Math.sin(t * 12);
      fillRR(dx, by, w, h, 4, "#fff");
    }
    ctx.restore();
  }

  function genCity() {
    const farPal = ["#2b3a67", "#243257", "#1f2b4d", "#32406f", "#283566"];
    const nearPal = [
      "#3d2b5a",
      "#2f2a4a",
      "#45305f",
      "#2a3550",
      "#3a3a5c",
      "#33294f",
    ];
    let x = 0,
      i = 1;
    while (x < city.L) {
      const w = rand(60, 130),
        h = rand(150, 290),
        r = mulberry(i * 7 + 1),
        win = [];
      for (let wy = 14; wy < h - 10; wy += 18)
        for (let wx = 8; wx < w - 10; wx += 16)
          if (r() < 0.5) win.push([wx, wy]);
      city.far.push({ x, w, h, c: pick(farPal), win, antenna: r() < 0.3 });
      x += w + rand(0, 8);
      i++;
    }
    x = 0;
    while (x < city.L) {
      const w = rand(110, 220),
        h = rand(80, 200),
        r = mulberry(i * 13 + 5),
        win = [];
      for (let wy = 16; wy < h - 12; wy += 24)
        for (let wx = 12; wx < w - 16; wx += 22)
          if (r() < 0.45) win.push([wx, wy]);
      const d = r();
      const decor =
        d < 0.28
          ? "billboard"
          : d < 0.44
            ? "neon"
            : d < 0.56
              ? "brand"
              : d < 0.68
                ? "bar"
                : null;
      city.near.push({
        x,
        w,
        h,
        c: pick(nearPal),
        win,
        decor,
        col: pick(POSTER_COLORS),
        word: pick(POSTER_WORDS),
      });
      x += w + rand(14, 50);
      i++;
    }
    for (let lx = 60; lx < city.L - 60; lx += rand(230, 330))
      city.lamps.push(lx);
    city.stops = [{ x: 420, choroszcz: true }, { x: 1700 }];
    city.cls = [900, 1300, 2200];
    city.pois = [];
    let poiX = 260;
    for (const p of CITY_POI_DEFS) {
      city.pois.push({
        x: poiX,
        w: p.label.length > 6 ? 118 : 72,
        ...p,
      });
      poiX += rand(380, 500);
    }
    const r = mulberry(99);
    for (let s = 0; s < 60; s++)
      city.stars.push([r() * W, r() * 250, r() * 1.4 + 0.4]);
  }
  // rysuje obiekt z zawijaniem względem przesunięcia paralaksy
  function wrapX(x, off) {
    return (((x - off) % city.L) + city.L) % city.L;
  }

  const BG_CAR_COLORS = [
    "#4cc9f0",
    "#f72585",
    "#b5e48c",
    "#ffd166",
    "#e0e0e0",
    "#94a3b8",
    "#c084fc",
    "#fb7185",
    "#38bdf8",
    "#f97316",
  ];
  const BG_CAR_STYLES = ["sedan", "hatch", "compact"];
  const bgCars = [];
  let bgCarTimer = 1.0;
  let bgCarTimer2 = 1.4;
  const bgPolice = [];
  let policeTimer = rand(8, 14);
  const bgFlyCars = [];
  let flyCarTimer = rand(10, 18);
  const bgChoroszczBus = [{ x: 70, vx: 88, w: 196 }];
  let choroszczBusTimer = rand(16, 26);

  function spawnChoroszczBus() {
    bgChoroszczBus.push({
      x: -220,
      vx: rand(72, 102),
      w: 196,
    });
  }

  function drawChoroszczBus(b, t) {
    const x = b.x,
      w = b.w,
      h = 44,
      y = ROAD_Y + 12;
    const led = 0.65 + 0.35 * Math.sin(t * 6);
    ctx.save();
    ctx.globalAlpha = 0.98;
    ctx.fillStyle = "#12141c";
    [20, 58, w - 58, w - 20].forEach((wx) => {
      ctx.beginPath();
      ctx.arc(x + wx, y + h, 8, 0, 7);
      ctx.fill();
    });
    ctx.fillStyle = "#64748b";
    [20, 58, w - 58, w - 20].forEach((wx) => {
      ctx.beginPath();
      ctx.arc(x + wx, y + h, 3.2, 0, 7);
      ctx.fill();
    });
    fillRR(x, y, w, h, 7, "#15803d");
    fillRR(x + 3, y + 2, w - 6, 16, 5, "#22c55e");
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(x + 4, y + 22, w - 8, 12);
    fillRR(x + 8, y - 28, 124, 28, 4, "#052e16");
    ctx.shadowColor = "#86efac";
    ctx.shadowBlur = 10 * led;
    fitText("CHOROSZCZ", x + 70, y - 19, 110, 11, "#bbf7d0", { weight: 900 });
    fitText("NA BADANIA", x + 70, y - 7, 110, 8, "#86efac", { weight: 800 });
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(186,230,253,.9)";
    for (let k = 0; k < 5; k++)
      fillRR(x + 10 + k * 30, y + 5, 24, 14, 2, "rgba(186,230,253,.9)");
    fillRR(x + w - 32, y + 5, 22, 16, 2, "rgba(224,242,254,.96)");
    ctx.fillStyle = "rgba(15,23,42,.28)";
    ctx.fillRect(x + w * 0.4, y + 4, 2, h - 10);
    ctx.fillRect(x + w * 0.4 + 16, y + 4, 2, h - 10);
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(x + 14, y + 24, 3, 9);
    ctx.fillRect(x + 10, y + 27, 11, 3);
    fillRR(x + w - 38, y + 24, 28, 9, 2, "#052e16");
    fitText("C", x + w - 24, y + 28.5, 18, 8, "#86efac", { weight: 900 });
    ctx.fillStyle = "#fff9c4";
    fillRR(x + w - 5, y + h * 0.62, 5, 8, 1, "#fff9c4");
    ctx.shadowColor = "#fff7c2";
    ctx.shadowBlur = 10;
    ctx.fillRect(x + w - 4, y + h * 0.64, 4, 6);
    ctx.shadowBlur = 0;
    fillRR(x, y + h * 0.62, 4, 7, 1, "#ff6b6b");
    ctx.restore();
  }

  function drawFlyingCar(f, t) {
    const bob = Math.sin(t * 4 + f.phase) * 3;
    const x = f.x,
      y = f.y + bob,
      w = f.w,
      h = 18;
    const tilt = f.vx > 0 ? 0.06 : -0.06;
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(tilt);
    ctx.translate(-(x + w / 2), -(y + h / 2));
    ctx.globalAlpha = 0.92;
    // smuga świetlna
    const trailLen = 48 + Math.sin(t * 8 + f.phase) * 8;
    const tg = ctx.createLinearGradient(
      x - (f.vx > 0 ? trailLen : 0),
      y + h * 0.55,
      x + (f.vx > 0 ? 0 : trailLen),
      y + h * 0.55,
    );
    tg.addColorStop(0, "rgba(255,255,255,0)");
    tg.addColorStop(0.35, f.glow);
    tg.addColorStop(1, f.col);
    ctx.fillStyle = tg;
    ctx.fillRect(x - (f.vx > 0 ? trailLen : 0), y + h * 0.42, trailLen, 4);
    // dno — światła antygraw
    ctx.shadowColor = f.glow;
    ctx.shadowBlur = 16;
    ctx.fillStyle = f.glow;
    [x + w * 0.22, x + w * 0.78].forEach((tx) => {
      ctx.beginPath();
      ctx.ellipse(tx, y + h + 2, 5, 2.5, 0, 0, 7);
      ctx.fill();
    });
    ctx.shadowBlur = 0;
    // kadłub
    fillRR(x, y + 2, w, h - 4, 6, f.col);
    fillRR(x + w * 0.12, y, w * 0.76, h * 0.55, 5, f.dark);
    // szyba kokpitu
    ctx.fillStyle = "rgba(180,230,255,.85)";
    fillRR(x + w * 0.28, y + 3, w * 0.44, h * 0.38, 4, "rgba(180,230,255,.85)");
    // skrzydła / stabilizatory
    ctx.fillStyle = f.dark;
    fillRR(x + w * 0.04, y + h * 0.52, w * 0.18, 5, 2, f.dark);
    fillRR(x + w * 0.78, y + h * 0.52, w * 0.18, 5, 2, f.dark);
    // neon przedni
    ctx.shadowColor = f.glow;
    ctx.shadowBlur = 10;
    ctx.fillStyle = f.glow;
    ctx.fillRect(x + (f.vx > 0 ? w - 4 : 0), y + h * 0.38, 4, 5);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  function spawnBgCar(fromRight = false) {
    const isBus = !fromRight && Math.random() < 0.16;
    bgCars.push({
      x: fromRight ? W + rand(120, 240) : -rand(120, 240),
      vx: (fromRight ? -1 : 1) * (isBus ? rand(95, 145) : rand(125, 215)),
      w: isBus ? rand(138, 158) : rand(56, 90),
      bus: isBus,
      c: pick(BG_CAR_COLORS),
      style: pick(BG_CAR_STYLES),
      lane: fromRight ? 1 : Math.random() < 0.38 ? 1 : 0,
    });
  }

  function drawBgStreetCar(c, t) {
    const y = c.lane === 1 ? ROAD_Y + 34 : ROAD_Y + 6;
    const h = c.bus ? 34 : c.lane === 1 ? 26 : 24;
    const goingRight = c.vx > 0;
    ctx.globalAlpha = c.lane === 0 ? 0.78 : 0.94;
    ctx.fillStyle = "#12141c";
    const wheels = c.bus ? [14, c.w - 14] : [11, c.w - 11];
    wheels.forEach((wx) => {
      ctx.beginPath();
      ctx.arc(c.x + wx, y + h, 6, 0, 7);
      ctx.fill();
    });
    fillRR(c.x, y, c.w, h, 6, c.bus ? "#ff7a00" : c.c);
    ctx.fillStyle = "rgba(190,230,255,.85)";
    if (c.bus) {
      for (let k = 0; k < 5; k++) ctx.fillRect(c.x + 8 + k * 28, y + 5, 20, 11);
      fillRR(c.x + 6, y + 18, c.w - 12, 12, 2, "#fff");
      drawLogo(c.x + c.w / 2, y + 24, c.w - 18, "default", 9);
    } else if (c.style === "hatch") {
      fillRR(
        c.x + c.w * 0.18,
        y + 4,
        c.w * 0.58,
        10,
        2,
        "rgba(190,230,255,.85)",
      );
      ctx.fillStyle = c.c;
      ctx.beginPath();
      ctx.moveTo(c.x + c.w * 0.72, y + 4);
      ctx.lineTo(c.x + c.w - 4, y + 12);
      ctx.lineTo(c.x + c.w - 4, y + h - 2);
      ctx.lineTo(c.x + c.w * 0.72, y + h - 2);
      ctx.closePath();
      ctx.fill();
    } else if (c.style === "sedan") {
      fillRR(c.x + c.w * 0.2, y + 4, c.w * 0.38, 9, 2, "rgba(190,230,255,.85)");
      fillRR(
        c.x + c.w * 0.58,
        y + 6,
        c.w * 0.24,
        8,
        2,
        "rgba(190,230,255,.75)",
      );
    } else {
      fillRR(
        c.x + c.w * 0.24,
        y + 4,
        c.w * 0.48,
        9,
        2,
        "rgba(190,230,255,.85)",
      );
    }
    ctx.fillStyle = goingRight ? "#fff9c4" : "#ffb4b4";
    fillRR(
      goingRight ? c.x + c.w - 4 : c.x,
      y + h * 0.52,
      4,
      5,
      1,
      goingRight ? "#fff9c4" : "#ffb4b4",
    );
    if (goingRight) {
      ctx.fillStyle = "#ff6b6b";
      fillRR(c.x, y + h * 0.52, 3, 4, 1, "#ff6b6b");
    } else {
      ctx.fillStyle = "#fff9c4";
      fillRR(c.x + c.w - 3, y + h * 0.52, 3, 4, 1, "#fff9c4");
    }
    ctx.globalAlpha = 1;
  }

  function drawPoliceCar(p, t) {
    const x = p.x,
      w = p.w,
      h = 28,
      y = ROAD_Y + 30;
    const flash = Math.floor(t * 11) % 2;
    ctx.save();
    ctx.globalAlpha = 0.96;
    // odbicie świateł na jezdni
    if (p.x > -20 && p.x < W + 20) {
      ctx.fillStyle = flash ? "rgba(255,45,85,.07)" : "rgba(59,130,246,.07)";
      ctx.fillRect(clamp(x, 0, W), y + h + 1, Math.min(w, W - x), 16);
    }
    // koła
    ctx.fillStyle = "#12141c";
    [x + 15, x + w - 15].forEach((wx) => {
      ctx.beginPath();
      ctx.arc(wx, y + h, 7, 0, 7);
      ctx.fill();
    });
    // nadwozie
    fillRR(x, y, w, h, 5, "#f0f4fa");
    fillRR(x + 3, y + h * 0.44, w - 6, h * 0.24, 2, "#1e40af");
    // szyby
    ctx.fillStyle = "rgba(150,200,255,.9)";
    fillRR(x + w * 0.52, y + 4, w * 0.34, h * 0.36, 3, "rgba(150,200,255,.9)");
    fillRR(x + w * 0.12, y + 6, w * 0.28, h * 0.3, 2, "rgba(150,200,255,.75)");
    // kogut — migające czerwono-niebieskie
    ctx.shadowColor = flash ? "#ff2d55" : "#3b82f6";
    ctx.shadowBlur = 14;
    fillRR(x + w * 0.26, y - 5, w * 0.48, 7, 2, flash ? "#ff2d55" : "#2563eb");
    ctx.shadowBlur = 0;
    fillRR(x + w * 0.36, y - 5, w * 0.12, 7, 1, flash ? "#2563eb" : "#ff2d55");
    fitText("POLICJA", x + w * 0.34, y + h * 0.56, w * 0.42, 8, "#fff", {
      weight: 900,
      stroke: "#1e3a8a",
      lw: 2,
    });
    // emblem
    ctx.fillStyle = "#ffd166";
    ctx.fillRect(x + w * 0.08, y + h * 0.48, 8, 8);
    ctx.restore();
  }

  function drawCity(t, dt) {
    // niebo
    const sky = ctx.createLinearGradient(0, 0, 0, SIDEWALK_Y);
    sky.addColorStop(0, "#0d173a");
    sky.addColorStop(0.55, "#2c2c66");
    sky.addColorStop(1, "#6d3d74");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, SIDEWALK_Y);
    ctx.fillStyle = "rgba(255,255,255,.8)";
    city.stars.forEach(([x, y, s]) => {
      ctx.globalAlpha = 0.4 + 0.4 * Math.sin(t * 2 + x);
      ctx.fillRect(x, y, s, s);
    });
    ctx.globalAlpha = 1;
    // księżyc
    ctx.fillStyle = "#fff3c4";
    ctx.beginPath();
    ctx.arc(820, 70, 28, 0, 7);
    ctx.fill();
    ctx.fillStyle = "rgba(255,243,196,.12)";
    ctx.beginPath();
    ctx.arc(820, 70, 44, 0, 7);
    ctx.fill();

    // latające auta — co jakiś czas nad miastem
    if (state === "play") {
      flyCarTimer -= dt;
      if (flyCarTimer <= 0) {
        const fromRight = Math.random() < 0.42;
        const palette = pick([
          { col: "#7c3aed", dark: "#4c1d95", glow: "rgba(167,139,250,.75)" },
          { col: "#06b6d4", dark: "#0e7490", glow: "rgba(34,211,238,.75)" },
          { col: "#f72585", dark: "#9d174d", glow: "rgba(244,114,182,.75)" },
          { col: "#ffd166", dark: "#b45309", glow: "rgba(253,224,71,.75)" },
        ]);
        bgFlyCars.push({
          x: fromRight ? W + 80 : -80,
          y: rand(55, SIDEWALK_Y - 140),
          vx: (fromRight ? -1 : 1) * rand(140, 220),
          w: rand(56, 74),
          phase: rand(0, 7),
          ...palette,
        });
        flyCarTimer = rand(14, 28);
      }
    }
    for (let i = bgFlyCars.length - 1; i >= 0; i--) {
      const f = bgFlyCars[i];
      f.x += f.vx * dt;
      if (f.x < -120 || f.x > W + 120) {
        bgFlyCars.splice(i, 1);
        continue;
      }
      drawFlyingCar(f, t);
    }

    // budynki dalekie
    const offF = t * 12;
    for (const b of city.far) {
      const sx = wrapX(b.x, offF);
      for (const dx of [sx, sx - city.L]) {
        if (dx > W || dx + b.w < 0) continue;
        const top = SIDEWALK_Y - 18 - b.h;
        ctx.fillStyle = b.c;
        ctx.fillRect(dx, top, b.w, b.h + 18);
        ctx.fillStyle = "rgba(255,220,140,.55)";
        for (const [wx, wy] of b.win) ctx.fillRect(dx + wx, top + wy, 7, 9);
        if (b.antenna) {
          ctx.fillStyle = "#5a6a9a";
          ctx.fillRect(dx + b.w / 2 - 1, top - 26, 2, 26);
          ctx.fillStyle = "#ff4d5e";
          ctx.fillRect(dx + b.w / 2 - 2, top - 28, 4, 4);
        }
      }
    }
    // budynki bliskie
    const offN = t * 32;
    for (const b of city.near) {
      const sx = wrapX(b.x, offN);
      for (const dx of [sx, sx - city.L]) {
        if (dx > W || dx + b.w < 0) continue;
        const top = SIDEWALK_Y - b.h;
        ctx.fillStyle = b.c;
        ctx.fillRect(dx, top, b.w, b.h);
        ctx.fillStyle = "rgba(0,0,0,.18)";
        ctx.fillRect(dx, top, b.w, 6);
        ctx.fillStyle = "rgba(255,230,160,.7)";
        for (const [wx, wy] of b.win) ctx.fillRect(dx + wx, top + wy, 10, 13);
        if (b.decor === "billboard" || b.decor === "brand") {
          const bw = Math.min(b.w - 20, 120),
            bh = 46,
            bx = dx + (b.w - bw) / 2,
            by = top - bh - 14;
          ctx.fillStyle = "#5b6280";
          ctx.fillRect(bx + 10, by + bh, 4, 14);
          ctx.fillRect(bx + bw - 14, by + bh, 4, 14);
          fillRR(bx, by, bw, bh, 3, "#e9edf7");
          fillRR(
            bx + 3,
            by + 3,
            bw - 6,
            bh - 6,
            2,
            b.decor === "brand" ? "#ff7a00" : b.col,
          );
          if (b.decor === "brand") {
            fillRR(bx + 5, by + 5, bw - 10, bh - 10, 2, "#fff");
            drawLogo(bx + bw / 2, by + bh / 2, bw - 16, "default", bh - 12);
          } else {
            ctx.fillStyle = "rgba(255,255,255,.9)";
            ctx.fillRect(bx + 10, by + 12, bw * 0.5, 6);
            ctx.fillRect(bx + 10, by + 24, bw * 0.35, 5);
            fitText(
              b.word,
              bx + bw * 0.78,
              by + bh * 0.55,
              bw * 0.34,
              12,
              "#fff",
            );
          }
        } else if (b.decor === "neon") {
          const nw = Math.min(b.w - 30, 90);
          ctx.shadowColor = b.col;
          ctx.shadowBlur = 14;
          fillRR(dx + (b.w - nw) / 2, top + 14, nw, 18, 4, b.col);
          ctx.shadowBlur = 0;
          fitText(b.word, dx + b.w / 2, top + 23, nw - 10, 11, "#fff");
        } else if (b.decor === "bar") {
          const nw = Math.min(b.w - 24, 78);
          const bx = dx + (b.w - nw) / 2;
          const by = top + 8;
          const pulse = 0.75 + 0.25 * Math.sin(t * 3.2 + b.x * 0.02);
          ctx.shadowColor = "#fbbf24";
          ctx.shadowBlur = 16 * pulse;
          fillRR(bx - 2, by - 2, nw + 4, 30, 5, "rgba(0,0,0,.35)");
          fillRR(bx, by, nw, 26, 4, "#f59e0b");
          fillRR(bx + 3, by + 3, nw - 6, 20, 3, "#d97706");
          drawPoiIcon("bar", bx + 12, by + 13, t);
          fitText("BAR", bx + nw / 2 + 4, by + 14, nw - 22, 13, "#fff", {
            weight: 900,
            stroke: "rgba(0,0,0,.45)",
            lw: 2,
          });
          fitText(
            "PUB",
            bx + nw / 2 + 4,
            by + 22,
            nw - 22,
            6,
            "rgba(255,255,255,.9)",
            { weight: 700 },
          );
          ctx.shadowBlur = 0;
        }
      }
    }
    // POI miasta — BAR, SOR, HOTEL, BASEN, CHOROSZCZ (paralaksa)
    if (state === "play") {
      poiHighlightT -= dt;
      if (poiHighlightT <= 0) {
        poiHighlight = pick(city.pois);
        poiHighlightLife = rand(2.2, 3.6);
        poiHighlightT = rand(14, 24);
      }
      if (poiHighlightLife > 0) poiHighlightLife -= dt;
      else poiHighlight = null;
    }
    for (const poi of city.pois) {
      const sx = wrapX(poi.x, offN);
      for (const dx of [sx, sx - city.L]) {
        if (dx < -140 || dx > W + 140) continue;
        drawCityPOI(poi, dx, t);
      }
    }
    // chodnik i infrastruktura
    ctx.fillStyle = "#5b6079";
    ctx.fillRect(0, SIDEWALK_Y, W, ROAD_Y - SIDEWALK_Y);
    ctx.fillStyle = "#7b8199";
    ctx.fillRect(0, SIDEWALK_Y, W, 4);
    ctx.fillStyle = "#3f445b";
    ctx.fillRect(0, ROAD_Y - 6, W, 6);
    const offP = offN;
    for (const lx of city.lamps) {
      const sx = wrapX(lx, offP);
      for (const dx of [sx, sx - city.L]) {
        if (dx < -20 || dx > W + 20) continue;
        ctx.fillStyle = "#20243a";
        ctx.fillRect(dx - 2, SIDEWALK_Y - 120, 4, 124);
        ctx.fillRect(dx - 2, SIDEWALK_Y - 120, 22, 4);
        ctx.fillStyle = "rgba(255,240,180,.15)";
        ctx.beginPath();
        ctx.arc(dx + 20, SIDEWALK_Y - 112, 22, 0, 7);
        ctx.fill();
        ctx.fillStyle = "#fff2b0";
        fillRR(dx + 12, SIDEWALK_Y - 120, 16, 8, 3, "#fff2b0");
      }
    }
    for (const cx of city.cls) {
      const sx = wrapX(cx, offP);
      for (const dx of [sx, sx - city.L]) {
        if (dx < -40 || dx > W + 40) continue;
        ctx.shadowColor = "#bfe9ff";
        ctx.shadowBlur = 12;
        fillRR(dx, SIDEWALK_Y - 74, 30, 60, 3, "#2b3350");
        ctx.shadowBlur = 0;
        fillRR(dx + 4, SIDEWALK_Y - 70, 22, 48, 2, "#dff6ff");
        ctx.fillStyle = "#ff7a00";
        ctx.fillRect(dx + 8, SIDEWALK_Y - 62, 14, 18);
        ctx.fillStyle = "#1a2038";
        ctx.fillRect(dx + 11, SIDEWALK_Y - 14, 8, 14);
      }
    }
    for (const stop of city.stops) {
      const sx = wrapX(stop.x, offP);
      const chor = !!stop.choroszcz;
      for (const dx of [sx, sx - city.L]) {
        if (dx < -120 || dx > W + 120) continue;
        ctx.fillStyle = chor
          ? "rgba(134,239,172,.22)"
          : "rgba(180,220,255,.25)";
        ctx.fillRect(dx, SIDEWALK_Y - 66, 100, 58);
        ctx.fillStyle = "#20243a";
        ctx.fillRect(dx - 4, SIDEWALK_Y - 72, 108, 6);
        ctx.fillRect(dx, SIDEWALK_Y - 66, 4, 66);
        ctx.fillRect(dx + 96, SIDEWALK_Y - 66, 4, 66);
        fillRR(
          dx + 8,
          SIDEWALK_Y - 62,
          84,
          18,
          3,
          chor ? "#16a34a" : "#ff7a00",
        );
        fitText(
          chor ? "CHOROSZCZ" : "PRZYSTANEK",
          dx + 50,
          SIDEWALK_Y - 53,
          76,
          chor ? 8 : 6,
          "#fff",
          { weight: 900 },
        );
        if (chor) {
          fillRR(dx + 14, SIDEWALK_Y - 40, 72, 22, 2, "#052e16");
          ctx.shadowColor = "#86efac";
          ctx.shadowBlur = 8;
          fitText("NA BADANIA", dx + 50, SIDEWALK_Y - 29, 66, 8, "#bbf7d0", {
            weight: 900,
          });
          ctx.shadowBlur = 0;
        } else {
          fillRR(dx + 14, SIDEWALK_Y - 48, 72, 12, 2, "#fff");
          drawLogo(dx + 50, SIDEWALK_Y - 42, 66, "default", 9);
          ctx.fillStyle = "#3a4060";
          ctx.fillRect(dx + 14, SIDEWALK_Y - 28, 72, 6);
        }
      }
    }
    // jezdnia
    ctx.fillStyle = "#2a2d3c";
    ctx.fillRect(0, ROAD_Y, W, H - ROAD_Y);
    ctx.fillStyle = "rgba(255,255,255,.35)";
    const dashOff = (t * 300) % 90;
    for (let x = -dashOff; x < W; x += 90) ctx.fillRect(x, ROAD_Y + 62, 50, 5);
    ctx.fillStyle = "rgba(255,255,255,.12)";
    ctx.fillRect(0, H - 8, W, 8);

    // auta w tle — dwa pasy, oba kierunki, częstsze spawny
    bgCarTimer -= dt;
    if (bgCarTimer <= 0) {
      spawnBgCar(false);
      if (Math.random() < 0.38) spawnBgCar(false);
      bgCarTimer = rand(0.75, 1.9);
    }
    bgCarTimer2 -= dt;
    if (bgCarTimer2 <= 0) {
      spawnBgCar(true);
      if (Math.random() < 0.32) spawnBgCar(true);
      bgCarTimer2 = rand(0.85, 2.1);
    }
    for (let i = bgCars.length - 1; i >= 0; i--) {
      const c = bgCars[i];
      c.x += c.vx * dt;
      if (c.x > W + 240 || c.x < -240) {
        bgCars.splice(i, 1);
        continue;
      }
      drawBgStreetCar(c, t);
    }

    // linia C — autobus do Choroszczy na badania
    choroszczBusTimer -= dt;
    if (choroszczBusTimer <= 0 && bgChoroszczBus.length === 0) {
      spawnChoroszczBus();
      choroszczBusTimer = rand(16, 26);
    }
    for (let i = bgChoroszczBus.length - 1; i >= 0; i--) {
      const b = bgChoroszczBus[i];
      b.x += b.vx * dt;
      if (b.x > W + 240) {
        bgChoroszczBus.splice(i, 1);
        continue;
      }
      drawChoroszczBus(b, t);
    }

    // radiowozy — od czasu do czasu przejeżdżają (szybciej niż ruch uliczny)
    if (state === "play") {
      policeTimer -= dt;
      if (policeTimer <= 0) {
        const fromRight = Math.random() < 0.45;
        bgPolice.push({
          x: fromRight ? W + 110 : -110,
          vx: (fromRight ? -1 : 1) * rand(300, 420),
          w: rand(84, 98),
        });
        sfx.siren();
        policeTimer = rand(12, 22);
      }
    }
    for (let i = bgPolice.length - 1; i >= 0; i--) {
      const p = bgPolice[i];
      p.x += p.vx * dt;
      if (p.x < -140 || p.x > W + 140) {
        bgPolice.splice(i, 1);
        continue;
      }
      drawPoliceCar(p, t);
    }
  }

  // ------------------------------------------------------------------
  // Gracz
  // ------------------------------------------------------------------
  const player = { x: W / 2, vx: 0, w: PLAYER_BASE_W, tilt: 0, scale: 1 };
  function drawPlayer(t) {
    const { x, scale } = player;
    ctx.save();
    ctx.translate(x, PLAYER_Y);
    ctx.rotate(-player.tilt * 0.04);
    ctx.scale(scale, scale);
    // cień
    ctx.fillStyle = "rgba(0,0,0,.35)";
    ctx.beginPath();
    ctx.ellipse(0, 4, 70 * scale, 8, 0, 0, 7);
    ctx.fill();
    if (G.pu && G.pu.bigCatch > 0) {
      ctx.strokeStyle = `rgba(167,139,250,${0.35 + 0.25 * Math.sin(t * 6)})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.ellipse(0, -50, 95, 28, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    // słupki i tablica na dachu
    ctx.fillStyle = "#3a4060";
    ctx.fillRect(-46, -84, 6, 14);
    ctx.fillRect(40, -84, 6, 14);
    fillRR(-62, -112, 124, 30, 5, "#ffffff");
    fillRR(-58, -108, 116, 22, 3, "#ffffff");
    drawLogo(0, -97, 108, "default", 16);
    // nadwozie (skrzynia) + kabina
    fillRR(-60, -72, 84, 58, 6, "#f4f6fb");
    fillRR(-56, -66, 76, 44, 3, "#0f1b3d");
    fitText("REKLAMA", -18, -50, 64, 12, "#ffb703");
    fitText("OUTDOOR", -18, -34, 64, 9, "#fff", { weight: 700 });
    ctx.fillStyle = "#e63946";
    ctx.fillRect(-60, -18, 84, 4);
    // kabina
    ctx.fillStyle = "#f4f6fb";
    ctx.beginPath();
    ctx.moveTo(24, -72);
    ctx.lineTo(44, -72);
    ctx.lineTo(62, -46);
    ctx.lineTo(62, -14);
    ctx.lineTo(24, -14);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#9fd8ff";
    ctx.beginPath();
    ctx.moveTo(30, -66);
    ctx.lineTo(44, -66);
    ctx.lineTo(58, -46);
    ctx.lineTo(30, -46);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ffe66d";
    fillRR(56, -30, 7, 8, 2, "#ffe66d");
    ctx.fillStyle = "#c9ced9";
    ctx.fillRect(-62, -20, 126, 6);
    // koła
    [-36, 40].forEach((wx) => {
      ctx.fillStyle = "#1c1e26";
      ctx.beginPath();
      ctx.arc(wx, 0, 15, 0, 7);
      ctx.fill();
      ctx.fillStyle = "#9aa0b3";
      ctx.beginPath();
      ctx.arc(wx, 0, 7, 0, 7);
      ctx.fill();
      ctx.strokeStyle = "#3a3d4a";
      ctx.lineWidth = 3;
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2 + t * (player.vx / 15);
        ctx.beginPath();
        ctx.moveTo(wx + Math.cos(a) * 7, Math.sin(a) * 7);
        ctx.lineTo(wx + Math.cos(a) * 13, Math.sin(a) * 13);
        ctx.stroke();
      }
    });
    ctx.restore();
  }

  // ------------------------------------------------------------------
  // Stan gry
  // ------------------------------------------------------------------
  let state = "start"; // start | play | over
  const G = {};
  let gameSliders = GS.load();
  let gameCfg = GS.toConfig(gameSliders);
  let diff = GS.makeDiff(gameCfg);

  function refreshGameConfig() {
    gameSliders = GS.load();
    gameCfg = GS.toConfig(gameSliders);
    diff = GS.makeDiff(gameCfg);
    updateDiffBadge();
  }

  function updateDiffBadge() {
    const el = $("#diff-badge");
    if (!el) return;
    el.textContent = gameCfg.presetLabel;
  }

  function resetRun() {
    refreshGameConfig();
    const c = gameCfg;
    Object.assign(G, {
      time: 0,
      score: 0,
      lives: START_LIVES,
      combo: 0,
      bestCombo: 0,
      caught: 0,
      double: 0,
      spawnT: 1.0,
      specialT: rand(c.specialMin, c.specialMax),
      powerupT: rand(c.powerupMin, c.powerupMax),
      pu: { slowFall: 0, bigCatch: 0, smallCar: 0, raiseGoals: 0 },
      pawelSting: null,
      roulette: null,
      penaltySting: null,
      flySwarm: null,
      items: [],
      pops: [],
      parts: [],
      banner: null,
      shake: 0,
      flash: 0,
      flashColor: "255,77,94",
      comboPulse: 0,
      scorePulse: 0,
    });
    player.x = W / 2;
    player.vx = 0;
    player.tilt = 0;
    player.w = PLAYER_BASE_W;
    player.scale = 1;
    bgCars.length = 0;
    bgPolice.length = 0;
    bgFlyCars.length = 0;
    bgCarTimer = rand(0.5, 1.2);
    bgCarTimer2 = rand(0.7, 1.5);
    policeTimer = rand(6, 12);
    flyCarTimer = rand(8, 14);
    poiHighlight = null;
    poiHighlightT = rand(10, 18);
    poiHighlightLife = 0;
  }

  function weightedPick(pool) {
    const total = pool.reduce((s, d) => s + d.weight, 0);
    let r = Math.random() * total;
    for (const d of pool) {
      r -= d.weight;
      if (r <= 0) return d;
    }
    return pool[pool.length - 1];
  }

  function getCarStats() {
    const t = G.time || 0;
    const fallMul = diff.speedMul(t);
    const timeCarMul = 1 + (fallMul - 1) * gameCfg.carTimeSync;
    const carMul = gameCfg.carSpeedMul * timeCarMul;
    return {
      MAXV: CAR_BASE_MAXV * carMul,
      ACC: CAR_BASE_ACC * carMul,
      DEC: CAR_BASE_DEC * carMul,
    };
  }

  /** Minimalny czas dojazdu auta (przyspieszenie + hamowanie) */
  function travelTime(fromX, toX, stats = getCarStats()) {
    const dist = Math.abs(toX - fromX);
    if (dist < 2) return 0;
    const { MAXV, ACC } = stats;
    const tAccel = MAXV / ACC;
    const dAccel = 0.5 * ACC * tAccel * tAccel;
    if (dist <= dAccel * 2) return 2 * Math.sqrt(dist / ACC);
    return 2 * tAccel + (dist - 2 * dAccel) / MAXV;
  }

  function fallSpeedMul(t) {
    const tempo = G.pu?.raiseGoals > 0 ? PAWEL_SPEED_MUL : 1;
    return diff.speedMul(t) * (G.pu?.slowFall > 0 ? 0.5 : 1) * tempo;
  }

  function itemFallTime(def, h, sm) {
    const vy = gameCfg.baseFallSpeed * (def.speed || 1) * sm;
    return (CATCH_Y + h + 10) / Math.max(vy, 40);
  }

  function itemVy(def, sm) {
    return gameCfg.baseFallSpeed * (def.speed || 1) * sm;
  }

  function timeToReachCatch(it) {
    const bottom = it.y + it.h;
    if (bottom >= CATCH_Y) return 0;
    return (
      (CATCH_Y - bottom) / Math.max(itemVy(it.def, fallSpeedMul(G.time)), 40)
    );
  }

  function inCatchZone(it) {
    const top = it.y,
      bottom = it.y + it.h;
    return bottom >= CATCH_Y && top <= CATCH_ZONE_BOTTOM;
  }

  function tryCatchOverlap(it, d) {
    const catchW = player.w * (G.pu.bigCatch > 0 ? 1.55 : 1);
    const pl = player.x - catchW / 2,
      pr = player.x + catchW / 2;
    const overlap = Math.min(it.x + it.w, pr) - Math.max(it.x, pl);
    const ease = d.kind === "bad" ? 0.45 : G.pu.bigCatch > 0 ? 0.18 : 0.26;
    const need = Math.min(it.w, catchW) * ease;
    return overlap >= need;
  }

  function spawnConflict(x, w, def, h, t) {
    const sm = fallSpeedMul(t);
    const fallT = itemFallTime(def, h, sm);
    const cx = x + w / 2;
    const mySide = cx < W * 0.5 ? "L" : "R";
    for (const it of G.items) {
      if (it.done) continue;
      const eta = timeToReachCatch(it);
      if (eta > 1.15) continue;
      const ocx = it.x + it.w / 2;
      const oSide = ocx < W * 0.5 ? "L" : "R";
      if (mySide === oSide) continue;
      if (eta < 0.95 && fallT < 0.95) {
        if (it.def.kind === "bad" || def.kind === "bad") return true;
        if (it.def.kind === "good" && def.kind === "good") return true;
      }
    }
    return false;
  }

  function pickFairSpawnX(w, h, def, nearX, t) {
    const sm = fallSpeedMul(t);
    const fallT = itemFallTime(def, h, sm);
    const stats = getCarStats();
    const budget = Math.max(0.55, fallT - SPAWN_REACH_BUFFER);

    for (let attempt = 0; attempt < 16; attempt++) {
      let x;
      if (nearX != null) {
        const sep = clamp(w * 0.45 + rand(18, 52), 36, 150);
        x = nearX + (Math.random() < 0.5 ? -1 : 1) * sep;
      } else {
        x = rand(12, W - w - 12);
      }
      x = clamp(x, 8, W - w - 8);
      const cx = x + w / 2;
      if (travelTime(player.x, cx, stats) > budget) continue;
      if (spawnConflict(x, w, def, h, t)) continue;
      return x;
    }

    // awaryjnie: bliżej gracza, żeby nie tworzyć sytuacji bez wyjścia
    const cx = clamp(player.x, w / 2 + 8, W - w / 2 - 8);
    return cx - w / 2;
  }

  function spawnItem(nearX) {
    const t = G.time;
    let bad = Math.random() < diff.badChance(t);
    let pool = itemPool(bad ? "bad" : "good", t);
    if (!pool.length) return;
    let def = weightedPick(pool);
    const scale = t > 10 ? rand(0.85, 1.15) : 1;
    let w = def.w * scale,
      h = def.h * scale;
    let x = pickFairSpawnX(w, h, def, nearX, t);

    if (
      def.kind === "bad" &&
      travelTime(player.x, x + w / 2) >
        itemFallTime(def, h, fallSpeedMul(t)) - 0.25
    ) {
      const goodPool = itemPool("good", t);
      if (goodPool.length) {
        def = weightedPick(goodPool);
        bad = false;
        w = def.w * scale;
        h = def.h * scale;
        x = pickFairSpawnX(w, h, def, nearX, t);
      }
    }

    G.items.push({
      def,
      x,
      y: -h - 10,
      w,
      h,
      baseX: x,
      vx: 0,
      seed: (Math.random() * 1e9) | 0,
      rot: rand(-0.1, 0.1),
      age: 0,
      done: false,
      catchZoneSince: null,
      passedCatch: false,
    });
  }

  function spawnSpecial() {
    const t = G.time;
    const pool = itemPool("special", t);
    if (!pool.length) return;
    const def = weightedPick(pool);
    const w = def.w,
      h = def.h;
    const item = {
      def,
      x: rand(20, W - w - 20),
      y: -h - 10,
      w,
      h,
      vx: 0,
      seed: (Math.random() * 1e9) | 0,
      rot: 0,
      age: 0,
      done: false,
    };
    item.baseX = item.x;
    if (def.mover) {
      // autobus przejeżdża przez ekran, powoli opadając ku pojazdowi gracza
      const fromLeft = Math.random() < 0.5;
      item.x = fromLeft ? -w - 10 : W + 10;
      item.y = 110;
      item.vx = (fromLeft ? 1 : -1) * rand(230, 300);
      item.vyFixed = 95;
      showBanner("AUTOBUS!", "złap go, zanim odjedzie", 1.6, "#ffd166");
    } else if (def.key === "mega") {
      showBanner("WIELKI FORMAT!", "+2000 PKT", 1.4, "#ffd166");
    }
    G.items.push(item);
  }

  function spawnPowerup() {
    const pool = itemPool("powerup", G.time);
    if (!pool.length) return;
    const def = weightedPick(pool);
    const w = def.w,
      h = def.h;
    G.items.push({
      def,
      x: rand(16, W - w - 16),
      y: -h - 10,
      w,
      h,
      baseX: 0,
      vx: 0,
      seed: (Math.random() * 1e9) | 0,
      rot: rand(-0.06, 0.06),
      age: 0,
      done: false,
    });
  }

  function applyPowerup(effect, dur = PU_DURATION) {
    switch (effect) {
      case "heart":
        G.flash = 0.25;
        G.flashColor = "255,107,138";
        if (G.lives < MAX_LIVES) {
          G.lives++;
          return "+1 ŻYCIE!";
        }
        return "PEŁNE ŻYCIA!";
      case "slowFall":
        G.pu.slowFall = dur;
        return "WOLNIEJSZE OPADANIE";
      case "bigCatch":
        G.pu.bigCatch = dur;
        return "SUPER ZASIĘG!";
      case "smallCar":
        G.pu.smallCar = dur;
        player.w = PLAYER_BASE_W * 0.72;
        player.scale = 0.72;
        return "MINI AUTO";
      case "raiseGoals":
        G.pu.raiseGoals = dur;
        return "TEMPO ↑!";
      default:
        return "POWER-UP!";
    }
  }

  function addPop(x, y, txt, color, size = 26, sub) {
    G.pops.push({
      x: clamp(x, 60, W - 60),
      y,
      txt,
      color,
      size,
      sub,
      life: 1.1,
      max: 1.1,
    });
  }
  function burst(x, y, color, n = 14, power = 200) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2),
        s = rand(power * 0.3, power);
      G.parts.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 120,
        life: rand(0.4, 0.8),
        color,
        size: rand(3, 7),
      });
    }
  }
  function showBanner(txt, sub, life, color) {
    G.banner = { txt, sub, life, max: life, color: color || "#fff" };
  }

  function easeOutBack(t) {
    const c1 = 1.12;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  function startPawelSting(x, y) {
    G.pawelSting = {
      t: 0,
      dur: PAWEL_STING_DUR,
      x0: x,
      y0: y,
      size0: 64,
      size1: Math.min(W, H) * 0.68,
    };
    G.shake = 0.45;
    G.flash = 0.4;
    G.flashColor = "255,183,3";
  }

  function triggerPawel(x, y) {
    G.roulette = null;
    if (music.mode === "casino") setMusicMode("game");
    const def = ITEMS.pu_pawel;
    const dur = (def && def.duration) || PAWEL_DURATION;
    startPawelSting(x, y);
    applyPowerup("raiseGoals", dur);
    burst(x, y, "#ffb703", 28, 320);
    sfx.mega();
    G.comboPulse = 0.6;
  }

  function debugTriggerPawel() {
    debugSpawnKey("pu_pawel");
  }

  function debugEnsurePlay() {
    if (!DEBUG) return false;
    if (state !== "play") {
      if (
        state === "start" &&
        $("#tab-settings") &&
        !$("#tab-settings").classList.contains("hidden")
      )
        return false;
      if (state !== "start" && state !== "over") return false;
      startGame();
    }
    return true;
  }

  const ROULETTE_SLOTS = [
    {
      key: "life2",
      label: "+2 ŻYCIA",
      short: "+2",
      sub: "bonus",
      color: "#22e07a",
      kind: "life",
      n: 2,
    },
    {
      key: "ptsP",
      label: "+800 PKT",
      short: "+800",
      sub: "jackpot",
      color: "#ffd166",
      kind: "pts",
      n: 800,
    },
    {
      key: "life1",
      label: "+1 ŻYCIE",
      short: "+1",
      sub: "serce",
      color: "#ff6b8a",
      kind: "life",
      n: 1,
    },
    {
      key: "mod",
      label: "MOD",
      short: "MOD",
      sub: "power-up",
      color: "#4cc9f0",
      kind: "mod",
    },
    {
      key: "lifeM",
      label: "−1 ŻYCIE",
      short: "−1",
      sub: "ryzyko",
      color: "#ff4d5e",
      kind: "life",
      n: -1,
    },
    {
      key: "ptsM",
      label: "−400 PKT",
      short: "−400",
      sub: "pech",
      color: "#fb5607",
      kind: "pts",
      n: -400,
    },
  ];
  const ROULETTE_MODS = [
    { effect: "slowFall", label: "SPOWOLNIENIE" },
    { effect: "bigCatch", label: "SUPER ZASIĘG" },
    { effect: "smallCar", label: "MINI AUTO" },
  ];
  const ROULETTE_N = 12;
  const ROULETTE_SPIN = 3.45;
  const ROULETTE_HOLD = 1.45;

  function pocketOf(i) {
    return ROULETTE_SLOTS[
      ((i % ROULETTE_SLOTS.length) + ROULETTE_SLOTS.length) %
        ROULETTE_SLOTS.length
    ];
  }

  function triggerRoulette() {
    G.pawelSting = null;
    const n = ROULETTE_N;
    const pocketA = (Math.PI * 2) / n;
    const target = (Math.random() * n) | 0;
    const lapsW = 5 + ((Math.random() * 2) | 0);
    const lapsB = 9 + ((Math.random() * 3) | 0);
    const ballFrom = rand(0, Math.PI * 2);
    G.roulette = {
      t: 0,
      phase: "spin",
      target,
      n,
      pocketA,
      wheel: 0,
      wheelTo: lapsW * Math.PI * 2 + (-Math.PI / 2 - (target + 0.5) * pocketA),
      ball: ballFrom,
      ballFrom,
      ballTo: -Math.PI / 2 - lapsB * Math.PI * 2,
      ballK: 0,
      lastTick: -1,
      result: pocketOf(target),
      prizeMsg: "",
      applied: false,
      gameOver: false,
    };
    G.shake = 0.18;
    G.flash = 0.22;
    G.flashColor = "255,209,102";
    setMusicMode("casino");
    sfx.bonus();
  }

  function applyRoulettePrize(slot) {
    if (slot.kind === "life") {
      if (slot.n > 0) {
        const before = G.lives;
        G.lives = Math.min(MAX_LIVES, G.lives + slot.n);
        G.flash = 0.32;
        G.flashColor = "34,224,122";
        if (G.lives === before) return "PEŁNE ŻYCIA!";
        return slot.label;
      }
      G.flash = 0.35;
      G.flashColor = "255,77,94";
      G.combo = 0;
      if (DEBUG) return "−1 ŻYCIE";
      G.lives -= 1;
      if (G.lives <= 0) {
        G.lives = 0;
        if (G.roulette) G.roulette.gameOver = true;
      }
      return "−1 ŻYCIE";
    }
    if (slot.kind === "pts") {
      G.score = Math.max(0, G.score + slot.n);
      G.scorePulse = 1.1;
      G.flash = 0.28;
      G.flashColor = slot.n > 0 ? "255,209,102" : "251,86,7";
      return slot.n > 0 ? `+${fmt(slot.n)} PKT` : `${fmt(slot.n)} PKT`;
    }
    const m = pick(ROULETTE_MODS);
    const msg = applyPowerup(m.effect, PU_DURATION);
    G.flash = 0.28;
    G.flashColor = "76,201,240";
    return msg || m.label;
  }

  function updateRoulette(dt) {
    const r = G.roulette;
    if (!r) return;
    r.t += dt;
    G.shake = Math.max(0, G.shake - dt);
    G.flash = Math.max(0, G.flash - dt);
    if (r.phase === "spin") {
      const k = clamp(r.t / ROULETTE_SPIN, 0, 1);
      const easeW = 1 - Math.pow(1 - k, 3);
      const easeB = 1 - Math.pow(1 - k, 2.35);
      r.wheel = r.wheelTo * easeW;
      r.ball = lerp(r.ballFrom, r.ballTo, easeB);
      r.ballK = k < 0.74 ? 0 : clamp((k - 0.74) / 0.26, 0, 1);
      const local = (r.ball - r.wheel) / r.pocketA;
      const idx = Math.floor(((local % r.n) + r.n) % r.n);
      if (idx !== r.lastTick) {
        r.lastTick = idx;
        sfx.tick();
      }
      if (k >= 1) {
        r.wheel = r.wheelTo;
        r.ball = -Math.PI / 2;
        r.ballK = 1;
        r.phase = "hold";
        r.t = 0;
        r.prizeMsg = applyRoulettePrize(r.result);
        r.applied = true;
        if (r.result.kind === "life" && r.result.n < 0) sfx.bad();
        else sfx.mega();
      }
      return;
    }
    if (r.t >= ROULETTE_HOLD) {
      const over = r.gameOver;
      G.roulette = null;
      setMusicMode("game");
      showBanner(r.prizeMsg || "RULETKA", r.result.label, 1.7, r.result.color);
      if (over) endGame();
    }
  }

  function debugTriggerRoulette() {
    debugSpawnKey("pu_roulette");
  }

  function spawnKeyedItem(def, x) {
    if (!def) return;
    const w = def.w,
      h = def.h;
    const px = clamp(x != null ? x : rand(16, W - w - 16), 8, W - w - 8);
    G.items.push({
      def,
      x: px,
      y: -h - 10,
      w,
      h,
      baseX: px,
      vx: 0,
      seed: (Math.random() * 1e9) | 0,
      rot: rand(-0.12, 0.12),
      age: 0,
      done: false,
      catchZoneSince: null,
      passedCatch: false,
    });
  }

  function debugSpawnKey(key) {
    if (!debugEnsurePlay()) return;
    const def = ITEMS[key];
    if (!def) return;
    const x = clamp((player.x || W / 2) - def.w / 2, 8, W - def.w - 8);
    spawnKeyedItem(def, x);
  }

  function triggerPenaltyOverlay(def, x, y) {
    G.pawelSting = null;
    G.roulette = null;
    const penalty = Math.abs((def && def.pts) || PENALTY_PTS);
    G.score = Math.max(0, G.score - penalty);
    G.scorePulse = 1.25;
    G.combo = 0;
    const burstCols = (def && def.overlayBurst) || ["#ff4d5e", "#7f1d1d"];
    G.penaltySting = {
      key: def && def.key,
      t: 0,
      dur: PENALTY_STING_DUR,
      x0: x,
      y0: y,
      size0: 72,
      size1: Math.min(W, H) * 0.52,
      penalty,
      title: (def && def.overlayTitle) || (def && def.name) || "PRZYPAL",
      sub: (def && def.overlaySub) || "",
      color: (def && def.overlayColor) || "#ffd166",
      tint: (def && def.overlayTint) || {
        dark: "12, 8, 6",
        mid: "220,70,36",
        edge: "80,20,12",
        core: "255,140,60",
      },
    };
    G.shake = 0.55;
    G.flash = 0.5;
    G.flashColor = (def && def.overlayFlash) || "220,70,36";
    burst(x, y, burstCols[0], 24, 300);
    burst(x, y, burstCols[1] || burstCols[0], 16, 220);
    sfx.bad();
    if (def && def.key === "zurek") spawnZurekFlies(x, y);
  }

  function spawnZurekFlies(x, y) {
    const overlayLeft = G.penaltySting
      ? Math.max(0.2, G.penaltySting.dur - G.penaltySting.t)
      : PENALTY_STING_DUR;
    const flies = [];
    const n = ZUREK_FLY_COUNT;
    for (let i = 0; i < n; i++) {
      const ang = (Math.PI * 2 * i) / n + rand(-0.4, 0.4);
      const spread = i < 8 ? rand(6, 28) : rand(40, Math.min(W, H) * 0.42);
      flies.push({
        x: clamp(x + Math.cos(ang) * spread, 12, W - 12),
        y: clamp(y + Math.sin(ang) * spread * 0.72, 12, H - 12),
        dir: ang + rand(-0.8, 0.8),
        speed: rand(160, 340),
        phase: rand(0, Math.PI * 2),
        flap: rand(11, 18),
        dart: rand(0.12, 0.38),
        dartT: rand(0, 0.3),
        size: rand(2.4, 4.8),
      });
    }
    G.flySwarm = { t: 0, dur: overlayLeft + ZUREK_FLY_AFTER, fade: 1.4, flies };
  }

  function updateFlySwarm(dt) {
    const swarm = G.flySwarm;
    if (!swarm) return;
    swarm.t += dt;
    if (swarm.t >= swarm.dur) {
      G.flySwarm = null;
      return;
    }
    for (const f of swarm.flies) {
      f.phase += dt * f.flap;
      f.dartT -= dt;
      if (f.dartT <= 0) {
        f.dir += rand(-1.35, 1.35);
        f.speed = rand(150, 360);
        f.dartT = f.dart;
      }
      f.dir += Math.sin(f.phase * 0.65) * 2.4 * dt;
      f.x += Math.cos(f.dir) * f.speed * dt;
      f.y += Math.sin(f.dir) * f.speed * dt;
      if (f.x < 10) {
        f.x = 10;
        f.dir = Math.PI - f.dir;
      } else if (f.x > W - 10) {
        f.x = W - 10;
        f.dir = Math.PI - f.dir;
      }
      if (f.y < 10) {
        f.y = 10;
        f.dir = -f.dir;
      } else if (f.y > H - 10) {
        f.y = H - 10;
        f.dir = -f.dir;
      }
    }
  }

  function drawFlySwarm() {
    const swarm = G.flySwarm;
    if (!swarm || !swarm.flies.length) return;
    const fade =
      swarm.t > swarm.dur - swarm.fade
        ? clamp((swarm.dur - swarm.t) / swarm.fade, 0, 1)
        : 1;
    ctx.save();
    for (const f of swarm.flies) {
      const flap = 0.4 + 0.6 * Math.abs(Math.sin(f.phase * 2.2));
      const s = f.size;
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.dir);
      ctx.globalAlpha = fade * 0.95;
      ctx.fillStyle = `rgba(228,228,220,${0.28 + 0.42 * flap})`;
      ctx.beginPath();
      ctx.ellipse(-s * 1.15, -s * 0.15, s * 1.35 * flap, s * 0.55, -0.55, 0, 7);
      ctx.ellipse(s * 1.15, -s * 0.15, s * 1.35 * flap, s * 0.55, 0.55, 0, 7);
      ctx.fill();
      ctx.fillStyle = "#14120c";
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 1.05, s * 0.55, 0, 0, 7);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.22)";
      ctx.beginPath();
      ctx.arc(s * 0.35, -s * 0.12, s * 0.18, 0, 7);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  function updatePenaltySting(dt) {
    const s = G.penaltySting;
    if (!s) return;
    s.t += dt;
    G.shake = Math.max(0, G.shake - dt);
    G.flash = Math.max(0, G.flash - dt);
    G.scorePulse = Math.max(0, G.scorePulse - dt * 2);
    if (s.t >= s.dur) {
      G.penaltySting = null;
      showBanner(s.title, s.sub ? s.sub : `−${fmt(s.penalty)} PKT`, 1.6, s.color);
    }
  }

  function debugSpawnZurek() {
    debugSpawnKey("zurek");
  }
  function debugSpawnWrongMiniboard() {
    debugSpawnKey("wrong_miniboard");
  }
  function debugSpawnLateReport() {
    debugSpawnKey("late_report");
  }

  function updatePawelSting(dt) {
    const s = G.pawelSting;
    if (!s) return;
    s.t += dt;
    G.shake = Math.max(0, G.shake - dt);
    G.flash = Math.max(0, G.flash - dt);
    G.comboPulse = Math.max(0, G.comboPulse - dt * 3);
    if (s.t >= s.dur) {
      G.pawelSting = null;
      showBanner("Paweł podwyższa cele", "Prędkość rośnie!", 1.8, "#ffb703");
    }
  }

  function onCatch(item) {
    const d = item.def,
      cx = item.x + item.w / 2,
      cy = CATCH_Y - 10;
    item.done = true;
    if (d.kind === "bad") {
      if (d.effect === "penaltyOverlay") {
        triggerPenaltyOverlay(d, cx, cy);
        return;
      }
      const lost = d.livesLost || 1;
      loseLife(cx, lost > 1 ? `-${lost} ŻYCIA!` : "AUĆ!", lost);
      sfx.bad();
      burst(cx, cy, "#ff4d5e", 12 + lost * 6, 240 + lost * 40);
      if (lost > 1) {
        G.shake = 0.55;
        G.flash = 0.5;
        sfx.mega();
      }
      return;
    }
    if (d.kind === "powerup") {
      G.caught++;
      if (d.key === "pu_pawel") {
        triggerPawel(cx, cy);
        return;
      }
      if (d.key === "pu_roulette") {
        triggerRoulette();
        burst(cx, cy, "#ffd166", 22, 280);
        return;
      }
      const msg = applyPowerup(d.effect, d.duration || PU_DURATION);
      addPop(cx, cy - 18, msg, "#4cc9f0", 22, d.name);
      burst(cx, cy, "#4cc9f0", 18, 240);
      sfx.bonus();
      G.comboPulse = 0.6;
      return;
    }
    G.combo++;
    G.bestCombo = Math.max(G.bestCombo, G.combo);
    G.caught++;
    const mult = Math.min(G.combo, 10);
    const dbl = G.double > 0 ? 2 : 1;
    if (d.kind === "special") {
      const gained = d.pts * dbl;
      G.score += gained;
      if (d.key === "bus") {
        addPop(cx, cy - 30, `MEGA BONUS +${fmt(gained)}`, "#ffd166", 34);
        showBanner("OKLEJONY!", `MEGA BONUS +${fmt(gained)}`, 2.2, "#ffd166");
        burst(cx, cy, "#ffd166", 40, 420);
        burst(cx, cy, "#ff7a00", 30, 320);
        sfx.mega();
        G.shake = 0.25;
      } else if (d.key === "mega") {
        addPop(cx, cy - 20, `+${fmt(gained)}`, "#ffd166", 36);
        showBanner("WIELKI FORMAT!", `+${fmt(gained)} PKT`, 1.6, "#ffd166");
        burst(cx, cy, "#ffd166", 30, 360);
        sfx.mega();
      } else if (d.key === "power") {
        addPop(cx, cy - 20, `+${fmt(gained)}`, "#ffd166", 34);
        G.double = DOUBLE_DURATION;
        showBanner(
          "BILLBOARD POWER!",
          "2x PUNKTY przez kilka sekund",
          1.8,
          "#ffb703",
        );
        burst(cx, cy, "#ffb703", 30, 340);
        sfx.bonus();
      } else if (d.key === "glow") {
        addPop(cx, cy - 20, `+${fmt(gained)}`, "#bfe9ff", 28);
        G.double = DOUBLE_DURATION;
        showBanner("2x PUNKTY!", "CITYLIGHT BONUS", 1.6, "#bfe9ff");
        burst(cx, cy, "#bfe9ff", 24, 300);
        sfx.bonus();
      }
    } else {
      const gained = d.pts * mult * dbl;
      G.score += gained;
      const sub =
        G.combo >= 2 ? `COMBO x${G.combo}` : dbl === 2 ? "2x" : undefined;
      if (d.key === "super_umowa") {
        addPop(
          cx,
          cy - 18,
          `+${fmt(gained)}`,
          "#fde68a",
          28 + Math.min(mult, 8),
          sub || "SUPER UMOWA",
        );
        showBanner("SUPER UMOWA!", `+${fmt(gained)} PKT`, 1.4, "#22c55e");
        burst(cx, cy, "#fbbf24", 18 + Math.min(mult, 8), 240 + mult * 12);
        burst(cx, cy, "#22c55e", 10, 180);
        sfx.bonus();
      } else if (d.key === "nowy_dostawca") {
        addPop(
          cx,
          cy - 18,
          `+${fmt(gained)}`,
          "#99f6e4",
          28 + Math.min(mult, 8),
          sub || "NOWY DOSTAWCA",
        );
        showBanner("NOWY DOSTAWCA!", `+${fmt(gained)} PKT`, 1.4, "#14b8a6");
        burst(cx, cy, "#14b8a6", 16 + Math.min(mult, 8), 240 + mult * 12);
        burst(cx, cy, "#fde68a", 10, 180);
        sfx.bonus();
      } else if (d.key === "plus_500") {
        addPop(
          cx,
          cy - 18,
          `+${fmt(gained)}`,
          "#fde68a",
          30 + Math.min(mult, 8),
          sub || "+500 PKT",
        );
        showBanner("+500 PKT!", `+${fmt(gained)}`, 1.5, "#f59e0b");
        burst(cx, cy, "#fbbf24", 22 + Math.min(mult, 8), 280 + mult * 12);
        burst(cx, cy, "#fff7ed", 12, 200);
        sfx.bonus();
      } else if (d.key === "nowe_billboardy") {
        addPop(
          cx,
          cy - 18,
          `+${fmt(gained)}`,
          "#bbf7d0",
          28 + Math.min(mult, 8),
          sub || "NOWE BILLBOARDY",
        );
        showBanner("NOWE BILLBOARDY W BAZIE!", `+${fmt(gained)} PKT`, 1.5, "#22e07a");
        burst(cx, cy, "#22e07a", 18 + Math.min(mult, 8), 260 + mult * 12);
        burst(cx, cy, "#ff7a00", 10, 180);
        sfx.bonus();
      } else {
        addPop(
          cx,
          cy - 16,
          `+${fmt(gained)}`,
          dbl === 2 ? "#ffd166" : "#ffffff",
          24 + Math.min(mult, 8) * 1.5,
          sub,
        );
        burst(
          cx,
          cy,
          d.pts >= 200 ? "#ffd166" : "#22e07a",
          10 + Math.min(mult, 8),
          180 + mult * 15,
        );
        sfx.catch(G.combo);
      }
    }
    G.comboPulse = 1;
    G.scorePulse = 1;
  }

  function loseLife(x, label, count = 1) {
    G.combo = 0;
    if (DEBUG) {
      addPop(x, CATCH_Y - 30, label, "rgba(255,255,255,.75)", 18);
      return;
    }
    G.lives -= count;
    G.shake = Math.max(G.shake, 0.25 + count * 0.1);
    G.flash = Math.max(G.flash, 0.25 + count * 0.1);
    G.flashColor = "255,77,94";
    addPop(x, CATCH_Y - 30, label, "#ff4d5e", 24 + count * 6);
    if (G.lives <= 0) endGame();
  }

  function onMiss(item) {
    const d = item.def;
    item.done = true;
    if (d.kind !== "good") return; // special / powerup — bez kary
    const cx = item.x + item.w / 2;
    if (item.catchZoneSince) {
      const needed = travelTime(player.x, cx);
      const had = G.time - item.catchZoneSince;
      if (had < needed * 0.88) {
        addPop(cx, CATCH_Y - 24, "ZA DALEKO!", "rgba(255,255,255,.7)", 20);
        return;
      }
    }
    sfx.miss();
    loseLife(cx, "PUDŁO!");
  }

  // ------------------------------------------------------------------
  // Aktualizacja
  // ------------------------------------------------------------------
  const keys = { left: false, right: false };

  function update(dt) {
    const t = (G.time += dt);
    // pojazd
    const dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    const { MAXV, ACC, DEC } = getCarStats();
    player.scale = G.pu.smallCar > 0 ? 0.72 : 1;
    player.w = PLAYER_BASE_W * player.scale;
    if (dir) player.vx = clamp(player.vx + dir * ACC * dt, -MAXV, MAXV);
    else if (player.vx > 0) player.vx = Math.max(0, player.vx - DEC * dt);
    else if (player.vx < 0) player.vx = Math.min(0, player.vx + DEC * dt);
    player.x += player.vx * dt;
    const minX = player.w / 2 + 4,
      maxX = W - player.w / 2 - 4;
    if (player.x < minX) {
      player.x = minX;
      player.vx = 0;
    }
    if (player.x > maxX) {
      player.x = maxX;
      player.vx = 0;
    }
    player.tilt = lerp(player.tilt, player.vx / MAXV, 1 - Math.pow(0.001, dt));

    // spawn
    G.spawnT -= dt;
    if (G.spawnT <= 0) {
      spawnItem();
      if (Math.random() < diff.pairChance(t))
        spawnItem(G.items[G.items.length - 1].x);
      G.spawnT = diff.spawnInt(t) * rand(0.8, 1.2);
    }
    G.specialT -= dt;
    if (G.specialT <= 0) {
      spawnSpecial();
      G.specialT = rand(gameCfg.specialMin, gameCfg.specialMax);
    }
    G.powerupT -= dt;
    if (G.powerupT <= 0) {
      spawnPowerup();
      G.powerupT = rand(gameCfg.powerupMin, gameCfg.powerupMax);
    }

    for (const k of Object.keys(G.pu)) G.pu[k] = Math.max(0, G.pu[k] - dt);

    // elementy
    const sm = fallSpeedMul(t);
    for (let i = G.items.length - 1; i >= 0; i--) {
      const it = G.items[i],
        d = it.def;
      it.age += dt;
      const mul =
        d.kind === "special"
          ? Math.min(sm, 1.9)
          : d.kind === "powerup"
            ? Math.min(sm, 1.4)
            : sm;
      it.y += (it.vyFixed || gameCfg.baseFallSpeed * (d.speed || 1) * mul) * dt;
      if (it.vx) it.x += it.vx * dt;
      if (d.wobble) it.x = it.baseX + Math.sin(it.age * 3.2) * d.wobble;
      if (!it.done) {
        const bottom = it.y + it.h;
        if (bottom >= CATCH_Y - 90 && !it.catchZoneSince)
          it.catchZoneSince = G.time;
        if (inCatchZone(it)) {
          if (tryCatchOverlap(it, d)) {
            onCatch(it);
            G.items.splice(i, 1);
            continue;
          }
        } else if (!it.passedCatch && it.y > CATCH_ZONE_BOTTOM) {
          it.passedCatch = true;
          onMiss(it);
          G.items.splice(i, 1);
          continue;
        }
        if (it.y > H + 10) {
          if (!it.passedCatch) onMiss(it);
          G.items.splice(i, 1);
          continue;
        }
        if (it.vx && (it.x > W + 40 || it.x + it.w < -40)) {
          G.items.splice(i, 1);
          continue;
        }
      }
    }
    // timery
    if (G.double > 0) G.double = Math.max(0, G.double - dt);
    G.shake = Math.max(0, G.shake - dt);
    G.flash = Math.max(0, G.flash - dt);
    G.comboPulse = Math.max(0, G.comboPulse - dt * 3);
    G.scorePulse = Math.max(0, G.scorePulse - dt * 4);
    if (G.banner) {
      G.banner.life -= dt;
      if (G.banner.life <= 0) G.banner = null;
    }
    for (let i = G.pops.length - 1; i >= 0; i--) {
      const p = G.pops[i];
      p.life -= dt;
      p.y -= 55 * dt;
      if (p.life <= 0) G.pops.splice(i, 1);
    }
    for (let i = G.parts.length - 1; i >= 0; i--) {
      const p = G.parts[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 600 * dt;
      p.vx *= 0.98;
      if (p.life <= 0) G.parts.splice(i, 1);
    }
  }

  // ------------------------------------------------------------------
  // Rysowanie sceny
  // ------------------------------------------------------------------
  function drawItem(it) {
    const d = it.def;
    ctx.save();
    ctx.translate(it.x + it.w / 2, it.y + it.h / 2);
    if (d.key !== "pu_pawel") {
      if (d.spin) ctx.rotate(it.age * d.spin);
      else ctx.rotate(it.rot * Math.sin(it.age * 2));
    }
    ctx.translate(-it.w / 2, -it.h / 2);
    if (d.kind === "special") {
      ctx.shadowColor = "#ffd166";
      ctx.shadowBlur = 18 + 8 * Math.sin(it.age * 6);
      fillRR(-4, -4, it.w + 8, it.h + 8, 8, "rgba(255,209,102,.35)");
      ctx.shadowBlur = 0;
    }
    if (d.kind === "powerup" && d.key !== "pu_pawel") {
      ctx.shadowColor = "#4cc9f0";
      ctx.shadowBlur = 16 + 6 * Math.sin(it.age * 8);
      fillRR(-4, -4, it.w + 8, it.h + 8, 10, "rgba(76,201,240,.28)");
      ctx.shadowBlur = 0;
    }
    if (d.kind === "bad") {
      ctx.save();
      ctx.setLineDash([6, 5]);
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(255,77,94,.85)";
      rrect(-5, -5, it.w + 10, it.h + 10, 8);
      ctx.stroke();
      ctx.restore();
    }
    ctx.save();
    ctx.scale(it.w / d.w, it.h / d.h);
    d.draw(d.w, d.h, mulberry(it.seed), it);
    ctx.restore();
    ctx.restore();
  }

  function drawHUD() {
    // wynik
    const sp = 1 + G.scorePulse * 0.12;
    ctx.save();
    ctx.translate(22, 26);
    ctx.scale(sp, sp);
    text(fmt(G.score), 0, 0, 40, "#fff", {
      align: "left",
      stroke: "rgba(0,0,0,.5)",
      lw: 6,
    });
    ctx.restore();
    ctx.font = "900 40px Rubik, system-ui, sans-serif";
    const sw = ctx.measureText(fmt(G.score)).width * sp;
    text("PKT", 30 + sw, 32, 15, "#ffb703", {
      align: "left",
      stroke: "rgba(0,0,0,.5)",
      lw: 4,
    });
    text(
      `REKORD ${fmt(Math.max(personalBest, G.score))}`,
      22,
      62,
      14,
      "rgba(255,255,255,.8)",
      { align: "left", weight: 700, stroke: "rgba(0,0,0,.5)", lw: 3 },
    );

    if (DEBUG) {
      text("∞ DEBUG", W - 20, 28, 12, "#5eead4", {
        align: "right",
        weight: 900,
        stroke: "rgba(0,0,0,.55)",
        lw: 4,
      });
    } else {
      const showLives = Math.max(START_LIVES, Math.min(G.lives, MAX_LIVES));
      for (let i = 0; i < showLives; i++)
        heart(
          W - 30 - i * 34,
          16,
          24,
          i < G.lives ? "#ff4d5e" : "rgba(255,255,255,.18)",
        );
    }

    // aktywne power-upy
    const puList = [
      ["slowFall", "SPOWOL.", "#5eead4", PU_DURATION],
      ["bigCatch", "ZASIĘG", "#a78bfa", PU_DURATION],
      ["smallCar", "MINI", "#fcd34d", PU_DURATION],
      ["raiseGoals", "TEMPO ↑", "#ffb703", PAWEL_DURATION],
    ].filter(([k]) => G.pu[k] > 0);
    if (puList.length) {
      let py = 88;
      for (const [k, label, col, puMax] of puList) {
        const rem = G.pu[k],
          bw = 120;
        text(label, 22, py, 10, col, {
          align: "left",
          weight: 900,
          stroke: "rgba(0,0,0,.5)",
          lw: 3,
        });
        fillRR(22, py + 8, bw, 8, 4, "rgba(0,0,0,.4)");
        fillRR(22, py + 8, bw * (rem / puMax), 8, 4, col);
        py += 22;
      }
    }

    // combo
    if (G.combo >= 2) {
      const s = 1 + G.comboPulse * 0.35;
      ctx.save();
      ctx.translate(W / 2, 40);
      ctx.scale(s, s);
      const col =
        G.combo >= 7 ? "#ff4dff" : G.combo >= 4 ? "#ffd166" : "#22e07a";
      text(`COMBO x${G.combo}`, 0, 0, 30 + Math.min(G.combo, 10) * 1.2, col, {
        stroke: "rgba(0,0,0,.55)",
        lw: 7,
      });
      ctx.restore();
    }
    // bonus 2x
    if (G.double > 0) {
      const bw = 200,
        bx = W / 2 - bw / 2,
        by = 78;
      fillRR(bx, by, bw, 18, 9, "rgba(0,0,0,.45)");
      fillRR(
        bx + 2,
        by + 2,
        (bw - 4) * (G.double / DOUBLE_DURATION),
        14,
        7,
        "#ffb703",
      );
      text("2x PUNKTY", W / 2, by + 9, 12, "#0f1b3d", { weight: 900 });
    }

    // baner (podczas wlotu Pawła własny napis jest w drawPawelFx)
    if (G.banner && !G.pawelSting && !G.roulette && !G.penaltySting) {
      const b = G.banner,
        k = b.life / b.max;
      const a = Math.min(1, k * 4) * Math.min(1, (1 - k) * 8 + 0.2);
      ctx.globalAlpha = a;
      const s = 1 + (1 - Math.min(1, (1 - k) * 6)) * 0.4;
      ctx.save();
      ctx.translate(W / 2, 250);
      ctx.scale(s, s);
      text(b.txt, 0, 0, 56, b.color, { stroke: "rgba(0,0,0,.6)", lw: 10 });
      if (b.sub)
        text(b.sub, 0, 44, 20, "#fff", {
          weight: 700,
          stroke: "rgba(0,0,0,.6)",
          lw: 5,
        });
      ctx.restore();
      ctx.globalAlpha = 1;
    }
  }

  /** Cienkie rosnące wykresy ze strzałkami w górę — obok głowy Pawła. */
  function drawPawelTrendCharts(cx, cy, headHalfW, headHalfH, k, alpha) {
    const reveal = clamp((k - 0.12) / 0.55, 0, 1);
    if (reveal <= 0 || alpha <= 0) return;

    const gap = headHalfW + 28;
    const chartW = 72;
    const chartH = headHalfH * 1.35;
    const baseY = cy + headHalfH * 0.35;
    const topY = baseY - chartH;
    const stroke = "#ffb703";
    const strokeDim = "rgba(255,183,3,0.45)";

    const series = [
      [0.08, 0.22, 0.18, 0.38, 0.32, 0.52, 0.48, 0.72, 0.68, 0.92],
      [0.12, 0.1, 0.28, 0.24, 0.44, 0.4, 0.58, 0.55, 0.78, 0.95],
      [0.05, 0.18, 0.14, 0.32, 0.28, 0.46, 0.42, 0.64, 0.6, 0.88],
    ];

    function drawChart(originX, flip) {
      const n = series[0].length;
      const drawN = Math.max(2, Math.floor(reveal * n));

      ctx.save();
      ctx.globalAlpha = alpha * (0.55 + 0.45 * reveal);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      for (let si = 0; si < series.length; si++) {
        const row = series[si];
        const laneH = chartH / (series.length + 0.6);
        const laneTop = topY + si * (laneH + 4);
        const laneBot = laneTop + laneH;
        ctx.strokeStyle = strokeDim;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(originX, laneBot);
        ctx.lineTo(originX + (flip ? -chartW : chartW), laneBot);
        ctx.stroke();

        ctx.strokeStyle = stroke;
        ctx.lineWidth = si === 0 ? 2.2 : 1.6;
        ctx.beginPath();
        for (let i = 0; i < drawN; i++) {
          const t = i / (n - 1);
          const px = originX + (flip ? chartW - t * chartW : t * chartW);
          const py = lerp(laneBot, laneTop, row[i]);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();

        if (drawN >= 2) {
          const i0 = drawN - 2;
          const i1 = drawN - 1;
          const t0 = i0 / (n - 1);
          const t1 = i1 / (n - 1);
          const x0 = originX + (flip ? chartW - t0 * chartW : t0 * chartW);
          const y0 = lerp(laneBot, laneTop, row[i0]);
          const x1 = originX + (flip ? chartW - t1 * chartW : t1 * chartW);
          const y1 = lerp(laneBot, laneTop, row[i1]);
          const ang = Math.atan2(y0 - y1, x1 - x0);
          const ah = 7;
          ctx.fillStyle = stroke;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(
            x1 - ah * Math.cos(ang - 0.42),
            y1 + ah * Math.sin(ang - 0.42),
          );
          ctx.lineTo(
            x1 - ah * Math.cos(ang + 0.42),
            y1 + ah * Math.sin(ang + 0.42),
          );
          ctx.closePath();
          ctx.fill();
        }
      }
      ctx.restore();
    }

    drawChart(cx - gap - chartW, false);
    drawChart(cx + gap, true);
  }

  function drawPawelFx() {
    const sting = G.pawelSting;
    const buff = G.pu?.raiseGoals > 0;
    if (!sting && !buff) return;

    let overlayA;
    if (sting) {
      const k = clamp(sting.t / sting.dur, 0, 1);
      overlayA = 0.58 + 0.28 * Math.min(1, k * 5);
    } else {
      const k = G.pu.raiseGoals / PAWEL_DURATION;
      overlayA = 0.18 + 0.22 * k;
    }

    ctx.save();
    ctx.fillStyle = `rgba(6, 4, 16, ${sting ? overlayA * 0.92 : overlayA * 0.35})`;
    ctx.fillRect(-40, -40, W + 80, H + 80);
    const g = ctx.createRadialGradient(
      W / 2,
      H * 0.42,
      H * 0.04,
      W / 2,
      H * 0.48,
      H * 0.95,
    );
    g.addColorStop(0, "rgba(255,183,3,0)");
    g.addColorStop(0.42, `rgba(255,122,0,${overlayA * 0.35})`);
    g.addColorStop(1, `rgba(180,40,0,${overlayA})`);
    ctx.fillStyle = g;
    ctx.fillRect(-40, -40, W + 80, H + 80);
    ctx.restore();

    if (!sting) return;

    const k = clamp(sting.t / sting.dur, 0, 1);
    const e = easeOutBack(k);
    const x = lerp(sting.x0, W / 2, e);
    const y = lerp(sting.y0, H * 0.4, e);
    const size = lerp(sting.size0, sting.size1, e);
    const img =
      typeof BBC_FallingItems.getPawelHeadImage === "function"
        ? BBC_FallingItems.getPawelHeadImage()
        : null;
    const a = Math.min(1, k * 8);

    ctx.save();
    ctx.globalAlpha = a;
    let headHalfW = size * 0.5;
    let headHalfH = size * 0.5;
    if (img && img.complete && img.naturalWidth > 0) {
      const ar = img.naturalWidth / img.naturalHeight;
      let dw = size,
        dh = size;
      if (ar >= 1) dh = size / ar;
      else dw = size * ar;
      headHalfW = dw / 2;
      headHalfH = dh / 2;
      ctx.drawImage(img, x - dw / 2, y - dh / 2, dw, dh);
    }
    ctx.restore();

    drawPawelTrendCharts(x, y, headHalfW, headHalfH, k, a);

    if (k > 0.28) {
      const ta = Math.min(1, (k - 0.28) / 0.22);
      ctx.save();
      ctx.globalAlpha = ta;
      text("PAWEŁ PODWYŻSZA CELE", W / 2, H * 0.78, 30, "#ffb703", {
        stroke: "rgba(0,0,0,.7)",
        lw: 8,
      });
      text("TEMPO ↑", W / 2, H * 0.78 + 36, 18, "#fff", {
        weight: 800,
        stroke: "rgba(0,0,0,.65)",
        lw: 5,
      });
      ctx.restore();
    }
  }

  function drawRouletteFx() {
    const r = G.roulette;
    if (!r) return;
    const overlayA =
      r.phase === "spin"
        ? 0.52 + 0.28 * Math.min(1, Math.max(0, r.t) * 6)
        : 0.8;
    ctx.save();
    ctx.fillStyle = `rgba(6, 18, 12, ${overlayA})`;
    ctx.fillRect(-40, -40, W + 80, H + 80);
    const vg = ctx.createRadialGradient(
      W / 2,
      H * 0.5,
      40,
      W / 2,
      H * 0.52,
      H * 0.92,
    );
    vg.addColorStop(0, "rgba(18, 90, 48, 0.15)");
    vg.addColorStop(1, `rgba(4, 28, 16, ${overlayA * 0.85})`);
    ctx.fillStyle = vg;
    ctx.fillRect(-40, -40, W + 80, H + 80);
    ctx.restore();

    text("RULETKA", W / 2, 78, 40, "#ffd166", {
      stroke: "rgba(0,0,0,.7)",
      lw: 9,
    });

    const cx = W / 2,
      cy = H * 0.5;
    const R = 178;
    const n = r.n,
      a = r.pocketA,
      rot = r.wheel;
    const drop = r.ballK || 0;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = "#0d5c32";
    ctx.beginPath();
    ctx.arc(0, 0, R + 28, 0, 7);
    ctx.fill();
    ctx.strokeStyle = "#c9a227";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(0, 0, R + 22, 0, 7);
    ctx.stroke();
    ctx.strokeStyle = "#7a4a12";
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(0, 0, R + 8, 0, 7);
    ctx.stroke();
    ctx.strokeStyle = "#e8d48a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, R + 1, 0, 7);
    ctx.stroke();

    for (let i = 0; i < n; i++) {
      const slot = pocketOf(i);
      const a0 = rot + i * a,
        a1 = a0 + a;
      const win = r.phase === "hold" && i === r.target;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, R - 6, a0, a1);
      ctx.closePath();
      ctx.fillStyle = slot.color;
      ctx.fill();
      if (win) {
        ctx.strokeStyle = "#fff8d0";
        ctx.lineWidth = 4;
        ctx.stroke();
      }
      ctx.strokeStyle = "rgba(255,255,255,.35)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a0) * (R - 6), Math.sin(a0) * (R - 6));
      ctx.stroke();

      const mid = a0 + a / 2;
      const lx = Math.cos(mid) * (R * 0.62);
      const ly = Math.sin(mid) * (R * 0.62);
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(mid + Math.PI / 2);
      text(slot.short, 0, 0, 13, "#0f1b3d", {
        stroke: "rgba(255,255,255,.35)",
        lw: 3,
      });
      ctx.restore();
    }

    ctx.fillStyle = "#1a1208";
    ctx.beginPath();
    ctx.arc(0, 0, 46, 0, 7);
    ctx.fill();
    ctx.strokeStyle = "#e8d48a";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, 46, 0, 7);
    ctx.stroke();
    ctx.fillStyle = "#c9a227";
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, 7);
    ctx.fill();
    ctx.fillStyle = "#fff3c4";
    ctx.beginPath();
    ctx.arc(-4, -4, 5, 0, 7);
    ctx.fill();

    ctx.fillStyle = "#ffd166";
    ctx.beginPath();
    ctx.moveTo(0, -R - 6);
    ctx.lineTo(-11, -R - 28);
    ctx.lineTo(11, -R - 28);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,.45)";
    ctx.lineWidth = 2;
    ctx.stroke();

    const trackR = lerp(R - 4, R * 0.7, drop);
    const bx = Math.cos(r.ball) * trackR;
    const by = Math.sin(r.ball) * trackR;
    ctx.fillStyle = "rgba(0,0,0,.35)";
    ctx.beginPath();
    ctx.arc(bx + 3, by + 4, 9, 0, 7);
    ctx.fill();
    const ballG = ctx.createRadialGradient(bx - 3, by - 3, 1, bx, by, 10);
    ballG.addColorStop(0, "#fff");
    ballG.addColorStop(0.45, "#e8e8ea");
    ballG.addColorStop(1, "#8a8a92");
    ctx.fillStyle = ballG;
    ctx.beginPath();
    ctx.arc(bx, by, 9, 0, 7);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,.35)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    if (r.phase === "hold" && r.prizeMsg) {
      text(r.prizeMsg, W / 2, cy + R + 48, 28, r.result.color, {
        stroke: "rgba(0,0,0,.7)",
        lw: 8,
      });
    } else {
      text(
        "kulka szuka szczęścia…",
        W / 2,
        cy + R + 42,
        14,
        "rgba(255,255,255,.8)",
        { weight: 700, stroke: "rgba(0,0,0,.55)", lw: 4 },
      );
    }
  }

  function drawAngryClientRise(t, fade) {
    const delay = 0.2;
    const k = clamp((t - delay) / 0.58, 0, 1);
    if (k <= 0 || fade <= 0) return;
    const e = easeOutBack(k);
    const size = Math.min(230, H * 0.36);
    const footY = lerp(H + 28, H - 10, e);
    const cx = W / 2;
    const shake = Math.sin(t * 26) * 7 * k;
    const a = Math.min(1, k * 5) * fade;
    const w = size * 0.7;
    const h = size;

    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(cx + shake, footY);
    ctx.rotate(Math.sin(t * 20) * 0.08);
    ctx.translate(-w / 2, -h);

    ctx.fillStyle = "rgba(0,0,0,.32)";
    ctx.beginPath();
    ctx.ellipse(w / 2, h - 3, w * 0.34, 9, 0, 0, 7);
    ctx.fill();

    fillRR(w * 0.26, h * 0.7, w * 0.17, h * 0.24, 5, "#1e3a8a");
    fillRR(w * 0.57, h * 0.7, w * 0.17, h * 0.24, 5, "#1e3a8a");
    fillRR(w * 0.24, h * 0.9, w * 0.22, h * 0.08, 4, "#0f172a");
    fillRR(w * 0.54, h * 0.9, w * 0.22, h * 0.08, 4, "#0f172a");
    fillRR(w * 0.2, h * 0.38, w * 0.6, h * 0.36, 12, "#3b82f6");

    const fistY = h * 0.4 + Math.sin(t * 24) * 10;
    fillRR(w * 0.72, fistY + 10, w * 0.12, h * 0.16, 5, "#1e40af");
    fillRR(w * 0.78, fistY, w * 0.2, w * 0.18, 10, "#fca5a5");

    fillRR(w * 0.24, h * 0.02, w * 0.52, h * 0.38, 18, "#fca5a5");
    ctx.fillStyle = "rgba(220,38,38,.38)";
    ctx.beginPath();
    ctx.ellipse(w * 0.36, h * 0.26, 9, 6, 0, 0, 7);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(w * 0.64, h * 0.26, 9, 6, 0, 0, 7);
    ctx.fill();
    ctx.strokeStyle = "#1c1e26";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(w * 0.3, h * 0.14);
    ctx.lineTo(w * 0.44, h * 0.2);
    ctx.moveTo(w * 0.7, h * 0.14);
    ctx.lineTo(w * 0.56, h * 0.2);
    ctx.stroke();
    ctx.fillStyle = "#1c1e26";
    ctx.beginPath();
    ctx.arc(w * 0.38, h * 0.22, 4.2, 0, 7);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(w * 0.62, h * 0.22, 4.2, 0, 7);
    ctx.fill();
    ctx.strokeStyle = "#991b1b";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.3, 11, 0.2, Math.PI - 0.2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(254,202,202,.9)";
    ctx.lineWidth = 2.5;
    const steam = Math.sin(t * 12) * 5;
    ctx.beginPath();
    ctx.moveTo(w * 0.2, h * 0.08);
    ctx.quadraticCurveTo(w * 0.12, h * 0.0, w * 0.2, -6 + steam);
    ctx.moveTo(w * 0.8, h * 0.08);
    ctx.quadraticCurveTo(w * 0.88, h * 0.0, w * 0.8, -6 - steam);
    ctx.stroke();
    ctx.restore();

    if (k > 0.42) {
      const ba = Math.min(1, (k - 0.42) / 0.2) * fade;
      const bx = Math.min(W - 118, cx + size * 0.42);
      const by = footY - size * 0.72;
      ctx.save();
      ctx.globalAlpha = ba;
      fillRR(bx - 108, by - 30, 216, 50, 14, "#fff");
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.moveTo(cx + 24, footY - size * 0.55);
      ctx.lineTo(bx - 48, by + 12);
      ctx.lineTo(bx - 22, by + 12);
      ctx.closePath();
      ctx.fill();
      fitText("TO NIE TA ULICA?!", bx, by - 5, 200, 16, "#991b1b", {
        weight: 900,
      });
      ctx.restore();
    }
  }

  function drawPenaltyFx() {
    const s = G.penaltySting;
    if (!s) return;
    const intro = PENALTY_STING_INTRO;
    const fadeOut = PENALTY_STING_FADE;
    const angryClient = s.key === "wrong_miniboard";
    const kIntro = clamp(s.t / intro, 0, 1);
    const fade =
      s.t > s.dur - fadeOut ? clamp((s.dur - s.t) / fadeOut, 0, 1) : 1;
    const overlayA = (0.62 + 0.28 * Math.min(1, kIntro * 5)) * fade;
    const tint = s.tint;
    ctx.save();
    ctx.fillStyle = `rgba(${tint.dark}, ${overlayA * 0.92})`;
    ctx.fillRect(-40, -40, W + 80, H + 80);
    const g = ctx.createRadialGradient(
      W / 2,
      H * 0.42,
      H * 0.04,
      W / 2,
      H * 0.48,
      H * 0.95,
    );
    g.addColorStop(0, `rgba(${tint.core},0)`);
    g.addColorStop(0.42, `rgba(${tint.mid},${overlayA * 0.38})`);
    g.addColorStop(1, `rgba(${tint.edge},${overlayA})`);
    ctx.fillStyle = g;
    ctx.fillRect(-40, -40, W + 80, H + 80);
    ctx.restore();

    const e = easeOutBack(Math.min(1, kIntro * 1.2));
    const x = lerp(s.x0, W / 2, e);
    const y = lerp(s.y0, angryClient ? H * 0.28 : H * 0.4, e);
    const size = lerp(s.size0, angryClient ? s.size1 * 0.62 : s.size1, e);
    const def = ITEMS[s.key];
    const a = Math.min(1, kIntro * 8) * fade;
    ctx.save();
    ctx.globalAlpha = a;
    if (def && def.draw) {
      const scale = size / Math.max(def.w, def.h);
      const dw = def.w * scale,
        dh = def.h * scale;
      ctx.translate(x - dw / 2, y - dh / 2);
      ctx.scale(scale, scale);
      def.draw(def.w, def.h, mulberry(7), { age: 1.4 + s.t * 4 });
    }
    ctx.restore();

    const textAt = intro * 0.42;
    if (s.t > textAt) {
      const ta = Math.min(1, (s.t - textAt) / 0.22) * fade;
      const hasSub = !!s.sub;
      const titleY = angryClient ? H * 0.5 : hasSub ? H * 0.7 : H * 0.76;
      ctx.save();
      ctx.globalAlpha = ta;
      fitText(s.title, W / 2, titleY, W - 80, hasSub ? 30 : 36, s.color, {
        stroke: "rgba(0,0,0,.72)",
        lw: 9,
      });
      if (hasSub) {
        fitText(s.sub, W / 2, titleY + 36, W - 100, 22, "#fff", {
          weight: 800,
          stroke: "rgba(0,0,0,.65)",
          lw: 6,
        });
        text(`−${fmt(s.penalty)} PKT`, W / 2, titleY + 68, 20, "#fecaca", {
          weight: 800,
          stroke: "rgba(0,0,0,.65)",
          lw: 6,
        });
      } else {
        text(`−${fmt(s.penalty)} PKT`, W / 2, titleY + 42, 22, "#fff", {
          weight: 800,
          stroke: "rgba(0,0,0,.65)",
          lw: 6,
        });
      }
      ctx.restore();
    }

    if (angryClient) drawAngryClientRise(s.t, fade);
  }

  function drawScene(dt) {
    const t = perfNow / 1000;
    ctx.save();
    if (state === "play" && G.shake > 0)
      ctx.translate(rand(-1, 1) * G.shake * 22, rand(-1, 1) * G.shake * 22);
    drawCity(t, dt);
    if (state !== "start") {
      // paczki (cząstki)
      for (const p of G.parts) {
        ctx.globalAlpha = clamp(p.life * 2, 0, 1);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
      ctx.globalAlpha = 1;
      drawPlayer(t);
      for (const it of G.items) drawItem(it);
      for (const p of G.pops) {
        const k = p.life / p.max;
        ctx.globalAlpha = Math.min(1, k * 3);
        text(p.txt, p.x, p.y, p.size, p.color, {
          stroke: "rgba(0,0,0,.6)",
          lw: 6,
        });
        if (p.sub)
          text(p.sub, p.x, p.y + p.size * 0.8, p.size * 0.6, "#ffd166", {
            stroke: "rgba(0,0,0,.6)",
            lw: 4,
          });
      }
      ctx.globalAlpha = 1;
      drawHUD();
      drawPawelFx();
      drawRouletteFx();
      drawPenaltyFx();
      drawFlySwarm();
      if (G.flash > 0) {
        ctx.fillStyle = `rgba(${G.flashColor},${G.flash * 0.6})`;
        ctx.fillRect(-40, -40, W + 80, H + 80);
      }
    } else {
      drawPlayer(t);
    }
    ctx.restore();
  }

  // ------------------------------------------------------------------
  // Tablica wyników i rekord
  // ------------------------------------------------------------------
  let personalBest = store.get(LS.best, 0);
  let boardCache = null;

  function normalizeBoardEntry(e) {
    if (!e || typeof e !== "object") return null;
    const name = String(e.name ?? e.player_name ?? "")
      .trim()
      .toUpperCase()
      .slice(0, 12);
    const score = Math.round(Number(e.score));
    if (!name || !Number.isFinite(score) || score <= 0) return null;
    return { name, score, date: e.date ?? e.created_at ?? null };
  }

  function loadBoard() {
    if (Array.isArray(boardCache)) return boardCache;
    const cached = store.get(LS.board, null);
    if (Array.isArray(cached)) {
      return cached.map(normalizeBoardEntry).filter(Boolean);
    }
    return [];
  }

  async function refreshBoardFromServer() {
    if (!XL) {
      renderBoard();
      return;
    }
    try {
      const remote = await XL.fetchBoard();
      boardCache = remote;
      store.set(LS.board, remote);
    } catch {
      /* offline / błąd API — zostaw cache lub pustą tablicę */
    }
    renderBoard();
  }

  function qualifies(score) {
    const b = loadBoard();
    return score > 0 && (b.length < 10 || score > b[b.length - 1].score);
  }

  function addToBoardLocal(name, score) {
    const b = loadBoard().slice();
    const entry = { name, score, date: Date.now() };
    b.push(entry);
    b.sort((p, q) => q.score - p.score);
    const cut = b.slice(0, 10);
    boardCache = cut;
    store.set(LS.board, cut);
    return cut.indexOf(entry);
  }

  async function addToBoard(name, score) {
    if (XL) {
      try {
        const { board, rank } = await XL.submitScore(name, score);
        boardCache = board;
        store.set(LS.board, board);
        if (Number.isFinite(rank) && rank > 0)
          return Math.min(rank - 1, board.length - 1);
        return board.findIndex(
          (e) => e.name === name && e.score === Math.round(score),
        );
      } catch {
        /* fallback lokalny */
      }
    }
    return addToBoardLocal(name, score);
  }
  function boardRowClasses(i, highlightIdx) {
    const parts = [];
    if (i < 3) parts.push(`top-${i + 1}`);
    if (i === highlightIdx) parts.push("me");
    return parts.join(" ");
  }

  function boardRowHtml(e, i, highlightIdx) {
    const rank =
      i < 3
        ? `<td class="rank rank--medal" aria-label="Miejsce ${i + 1}">${BOARD_MEDALS[i]}</td>`
        : `<td class="rank">${i + 1}</td>`;
    const when = formatBoardWhen(e.date);
    const cls = boardRowClasses(i, highlightIdx);
    return `<tr class="${cls}">${rank}<td class="player">${escapeHtml(e.name)}</td><td class="r score">${fmt(e.score)}</td><td class="r board-when">${escapeHtml(when)}</td></tr>`;
  }

  function renderBoard(highlightIdx = -1) {
    const b = loadBoard();
    const rows = b.map((e, i) => boardRowHtml(e, i, highlightIdx)).join("");
    $("#board-body").innerHTML = rows;
    const startBody = $("#start-board-body");
    if (startBody)
      startBody.innerHTML = b
        .slice(0, 10)
        .map((e, i) => boardRowHtml(e, i, -1))
        .join("");
    const leader = b[0];
    const ch = leader
      ? `Pobij wynik ${escapeHtml(possessive(leader.name))}: <strong>${fmt(leader.score)} PKT</strong>`
      : "Zapisz pierwszy wynik — otwórz TOP 10!";
    $("#challenge").innerHTML = ch;
  }
  function possessive(name) {
    // proste polskie formy dopełniacza dla popularnych imion
    const n = name.trim();
    const up = n === n.toUpperCase();
    const s = (x) => (up ? x.toUpperCase() : x);
    if (/IA$/i.test(n)) return n.slice(0, -1); // ANIA → ANI
    if (/[KG]A$/i.test(n)) return n.slice(0, -1) + s("i"); // AGNIESZKA → AGNIESZKI
    if (/A$/i.test(n)) return n.slice(0, -1) + s("y"); // MARTA → MARTY
    if (/EK$/i.test(n)) return n.slice(0, -2) + s("ka"); // TOMEK → TOMKA
    if (/O$/i.test(n)) return n.slice(0, -1) + s("a"); // MIESZKO → MIESZKA
    if (/[AEIOUY]$/i.test(n)) return n; // obce imiona bez odmiany
    return n + s("a"); // KAMIL → KAMILA
  }
  function escapeHtml(s) {
    return String(s).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  }

  // ------------------------------------------------------------------
  // Przepływ gry
  // ------------------------------------------------------------------
  function showStartTab(tab) {
    if (!DEBUG && tab === "settings") tab = "play";
    const play = tab === "play";
    $("#tab-play").classList.toggle("hidden", !play);
    $("#tab-settings").classList.toggle("hidden", play);
    $("#tab-btn-play").classList.toggle("active", play);
    $("#tab-btn-settings").classList.toggle("active", !play);
    $("#tab-btn-play").setAttribute("aria-selected", play ? "true" : "false");
    $("#tab-btn-settings").setAttribute(
      "aria-selected",
      play ? "false" : "true",
    );
  }

  function openSettingsTab() {
    if (!DEBUG) return;
    $("#start").classList.remove("hidden");
    $("#gameover").classList.add("hidden");
    showStartTab("settings");
    syncSettingsUI();
  }

  function initSettingsUI() {
    const presetHost = $("#preset-row");
    const sliderHost = $("#settings-sliders");
    if (!presetHost || !sliderHost || !GS) return;
    presetHost.innerHTML = GS.PRESET_ORDER.map((id) => {
      const p = GS.PRESETS[id];
      return `<button type="button" class="preset-btn" data-preset="${id}"><span class="ico">${p.icon}</span><span class="lbl">${p.label}</span></button>`;
    }).join("");

    sliderHost.innerHTML = GS.SLIDERS.map(
      (sl) => `
      <div class="slider-row" data-key="${sl.key}">
        <label><span>${sl.label}</span><span class="val" id="val-${sl.key}">100%</span></label>
        <input type="range" id="rng-${sl.key}" min="${sl.min}" max="${sl.max}" step="${sl.step}" value="100">
        <div class="hint">${sl.hint}</div>
      </div>`,
    ).join("");

    presetHost.addEventListener("click", (e) => {
      if (!DEBUG) return;
      const btn = e.target.closest("[data-preset]");
      if (!btn) return;
      gameSliders = GS.applyPreset(gameSliders, btn.dataset.preset);
      GS.save(gameSliders);
      syncSettingsUI();
    });

    for (const sl of GS.SLIDERS) {
      const rng = $(`#rng-${sl.key}`);
      rng.addEventListener("input", () => {
        if (!DEBUG) return;
        gameSliders[sl.key] = Number(rng.value);
        gameSliders.preset = "custom";
        for (const id of GS.PRESET_ORDER) {
          if (GS.slidersMatchPreset(gameSliders, id)) {
            gameSliders.preset = id;
            break;
          }
        }
        GS.save(gameSliders);
        syncSettingsUI(false);
      });
    }

    $("#btn-settings-reset").addEventListener("click", () => {
      if (!DEBUG) return;
      gameSliders = GS.slidersFromPreset("normal");
      GS.save(gameSliders);
      syncSettingsUI();
    });
    $("#btn-settings-play").addEventListener("click", startGame);
    $("#btn-open-settings").addEventListener("click", () => {
      if (state === "play") return;
      openSettingsTab();
    });
    document.querySelectorAll(".start-tab").forEach((btn) => {
      btn.addEventListener("click", () => showStartTab(btn.dataset.tab));
    });

    syncSettingsUI();
  }

  function syncSettingsUI(updateSliders = true) {
    if (!GS || !$("#settings-sliders")) return;
    gameSliders = GS.load();
    if (updateSliders) {
      for (const sl of GS.SLIDERS) {
        const rng = $(`#rng-${sl.key}`);
        const val = $(`#val-${sl.key}`);
        if (!rng || !val) continue;
        const v = gameSliders[sl.key];
        rng.value = v;
        val.textContent = `${v}${sl.unit || ""}`;
      }
    } else {
      for (const sl of GS.SLIDERS) {
        const val = $(`#val-${sl.key}`);
        if (val) val.textContent = `${gameSliders[sl.key]}${sl.unit || ""}`;
      }
    }
    document.querySelectorAll(".preset-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.preset === gameSliders.preset);
    });
    if (gameSliders.preset === "custom") {
      document
        .querySelectorAll(".preset-btn")
        .forEach((b) => b.classList.remove("active"));
    }
    refreshGameConfig();
  }

  function startGame() {
    if (typeof GS.flushSave === "function") GS.flushSave();
    audioInit();
    if (audio.ctx && audio.ctx.state === "suspended") audio.ctx.resume();
    resetRun();
    state = "play";
    $("#start").classList.add("hidden");
    $("#gameover").classList.add("hidden");
    $("#diff-badge").classList.remove("hidden");
    if (DEBUG) {
      showBanner("DEBUG", "Bez żyć — gra bez końca", 2.4, "#5eead4");
      const db = $("#debug-badge");
      if (db) db.classList.remove("hidden");
    } else showBanner("ZŁAP REKLAMĘ!", "← →  poruszaj się", 2.2, "#ffb703");
    sfx.start();
    startMusic();
  }

  function endGame() {
    if (state !== "play") return;
    state = "over";
    $("#diff-badge").classList.add("hidden");
    keys.left = keys.right = false;
    stopMusic(true);
    sfx.over();
    const score = Math.round(G.score);
    const isRecord = score > personalBest;
    const prevBest = personalBest;
    if (isRecord) {
      personalBest = score;
      store.set(LS.best, score);
    }

    $("#final-score").textContent = fmt(score);
    $("#stat-caught").textContent = fmt(G.caught);
    $("#stat-combo").textContent = "x" + G.bestCombo;
    const rb = $("#record-box");
    if (isRecord) {
      rb.className = "record new";
      rb.innerHTML = `NOWY REKORD!<span class="sub">${fmt(score)} PKT${prevBest ? ` • poprzedni: ${fmt(prevBest)}` : ""}</span>`;
    } else {
      rb.className = "record";
      const diffPts = prevBest - score;
      rb.innerHTML = `Twój rekord: ${fmt(prevBest)} PKT<span class="sub">Brakuje Ci ${diffPts <= prevBest * 0.5 ? "tylko " : ""}${fmt(diffPts)} punktów!</span>`;
    }
    const ne = $("#name-entry");
    if (qualifies(score)) {
      ne.classList.remove("hidden");
      const inp = $("#name-input");
      inp.value = store.get(LS.name, "");
      setTimeout(() => inp.focus(), 50);
    } else {
      ne.classList.add("hidden");
    }
    pendingScore = score;
    renderBoard(-1);
    updateChallengeOver(score);
    setTimeout(() => $("#gameover").classList.remove("hidden"), 350);
  }
  let pendingScore = 0;

  function updateChallengeOver(score) {
    const b = loadBoard();
    const above = b.filter((e) => e.score > score);
    const el = $("#challenge-over");
    if (!above.length) el.textContent = "Jesteś na szczycie! Utrzymaj pozycję.";
    else {
      const next = above[above.length - 1];
      el.textContent = `Pobij wynik ${possessive(next.name)} — brakuje ${fmt(next.score - score + 10)} punktów.`;
    }
  }

  $("#name-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const raw = $("#name-input").value.trim().toUpperCase().slice(0, 12);
    const name = raw || "GRACZ";
    store.set(LS.name, name);
    const submitBtn = $('#name-form button[type="submit"]');
    submitBtn.disabled = true;
    const idx = await addToBoard(name, pendingScore);
    submitBtn.disabled = false;
    $("#name-entry").classList.add("hidden");
    renderBoard(idx);
    $("#btn-again").focus();
  });

  // ------------------------------------------------------------------
  // Sterowanie
  // ------------------------------------------------------------------
  const isTyping = () =>
    document.activeElement && document.activeElement.tagName === "INPUT";
  window.addEventListener("keydown", (e) => {
    if (e.key === "m" || e.key === "M") {
      if (!isTyping()) setMuted(!audio.muted);
      return;
    }
    if (isTyping()) return;
    if (DEBUG && !e.repeat && (e.key === "p" || e.key === "P")) {
      e.preventDefault();
      debugTriggerPawel();
      return;
    }
    if (DEBUG && !e.repeat && (e.key === "r" || e.key === "R")) {
      e.preventDefault();
      debugTriggerRoulette();
      return;
    }
    if (DEBUG && !e.repeat && (e.key === "z" || e.key === "Z")) {
      e.preventDefault();
      debugSpawnZurek();
      return;
    }
    if (DEBUG && !e.repeat && (e.key === "b" || e.key === "B")) {
      e.preventDefault();
      debugSpawnWrongMiniboard();
      return;
    }
    if (DEBUG && !e.repeat && (e.key === "t" || e.key === "T")) {
      e.preventDefault();
      debugSpawnLateReport();
      return;
    }
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
      keys.left = true;
      e.preventDefault();
    }
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
      keys.right = true;
      e.preventDefault();
    }
    if (
      state === "start" &&
      !e.repeat &&
      !["Shift", "Control", "Alt", "Meta", "Tab", "Escape"].includes(e.key)
    ) {
      if (!$("#tab-settings").classList.contains("hidden")) return;
      e.preventDefault();
      startGame();
    } else if (
      state === "over" &&
      !e.repeat &&
      (e.key === "Enter" || e.key === " ") &&
      !$("#gameover").classList.contains("hidden")
    ) {
      e.preventDefault();
      startGame();
    }
  });
  window.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A")
      keys.left = false;
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D")
      keys.right = false;
  });
  window.addEventListener("blur", () => {
    keys.left = keys.right = false;
  });

  // dotyk / mysz: lewa lub prawa połowa ekranu
  const activePointers = new Map();
  function updatePointerKeys() {
    keys.left = false;
    keys.right = false;
    for (const side of activePointers.values()) keys[side] = true;
  }
  canvas.addEventListener("pointerdown", (e) => {
    if (state !== "play") return;
    const r = canvas.getBoundingClientRect();
    activePointers.set(
      e.pointerId,
      (e.clientX - r.left) / r.width < 0.5 ? "left" : "right",
    );
    updatePointerKeys();
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!activePointers.has(e.pointerId)) return;
    const r = canvas.getBoundingClientRect();
    activePointers.set(
      e.pointerId,
      (e.clientX - r.left) / r.width < 0.5 ? "left" : "right",
    );
    updatePointerKeys();
  });
  const releasePointer = (e) => {
    activePointers.delete(e.pointerId);
    updatePointerKeys();
  };
  canvas.addEventListener("pointerup", releasePointer);
  canvas.addEventListener("pointercancel", releasePointer);

  $("#btn-start").addEventListener("click", startGame);
  $("#btn-again").addEventListener("click", startGame);
  $("#btn-mute").addEventListener("click", () => {
    audioInit();
    setMuted(!audio.muted);
  });
  window.addEventListener("pointerdown", ensureMenuMusic);
  window.addEventListener("keydown", ensureMenuMusic);

  // ------------------------------------------------------------------
  // Pętla
  // ------------------------------------------------------------------
  let perfNow = 0,
    last = 0;
  function frame(now) {
    perfNow = now;
    const dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;
    const frozen =
      state === "play" && (G.pawelSting || G.roulette || G.penaltySting);
    if (G.flySwarm) updateFlySwarm(dt);
    if (G.pawelSting) updatePawelSting(dt);
    else if (G.roulette) updateRoulette(dt);
    else if (G.penaltySting) updatePenaltySting(dt);
    else if (state === "play") update(dt);
    drawScene(frozen ? 0 : dt);
    requestAnimationFrame(frame);
  }

  genCity();
  refreshBoardFromServer();
  try {
    initSettingsUI();
  } catch (err) {
    console.warn("settings UI", err);
  }
  Promise.resolve()
    .then(() =>
      typeof GS.hydrateFromServer === "function"
        ? GS.hydrateFromServer()
        : null,
    )
    .then(() => {
      if (state === "start") syncSettingsUI();
    })
    .catch((err) => console.warn("settings hydrate", err));
  setMuted(audio.muted);
  resetRun();
  try {
    initItemEngine();
  } catch (err) {
    console.warn("items", err);
  }
  requestAnimationFrame(frame);
  loadLogo().then(() => {
    try {
      initItemEngine();
    } catch {
      /* fallback już narysowany */
    }
  });

  function syncDebugChrome() {
    document.body.classList.toggle("debug-mode", DEBUG);
    if (GS && typeof GS.setWritable === "function") GS.setWritable(DEBUG);
    const db = $("#debug-badge");
    if (db) db.classList.toggle("hidden", !DEBUG || state !== "play");
    document
      .querySelectorAll(
        "#settings-sliders input, #preset-row button, #btn-settings-reset",
      )
      .forEach((el) => {
        el.disabled = !DEBUG;
      });
  }
  syncDebugChrome();

  if (DEBUG) {
    window.__bbcatch = {
      G,
      player,
      keys,
      get state() {
        return state;
      },
      CATCH_Y,
      W,
      DEBUG,
      spawn: debugSpawnKey,
      triggerPawel: debugTriggerPawel,
      triggerRoulette: debugTriggerRoulette,
      spawnZurek: debugSpawnZurek,
      spawnWrongMiniboard: debugSpawnWrongMiniboard,
      spawnLateReport: debugSpawnLateReport,
      setDebug(on) {
        DEBUG = !!on;
        store.set(LS.debug, DEBUG);
        if (GS && typeof GS.persistDebugFlag === "function") GS.persistDebugFlag(DEBUG);
        if (GS && typeof GS.setWritable === "function") GS.setWritable(DEBUG);
        if (!DEBUG) showStartTab("play");
        syncDebugChrome();
      },
    };
  }
})();
