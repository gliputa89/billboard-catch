/* Wspólna definicja spadających elementów — gra + katalog /assets/ */
window.BBC_FallingItems = (function () {
  'use strict';

  const LS_DISABLED = 'bbcatch.disabled.v1';
  const BRAND = 'znajdzreklame.pl';
  const POSTER_COLORS = ['#ff4d6d', '#ffb703', '#3a86ff', '#8338ec', '#06d6a0', '#fb5607', '#ff006e', '#00b4d8'];
  const POSTER_WORDS = ['SALE', '-50%', 'HIT!', 'NOWOŚĆ', 'PROMO', 'WOW', 'OKAZJA', 'TOP'];
  const BRAND_CHARS = 'znajdzreklame.pl';
  const BRAND_BONUS = 10000;
  const BRAND_LOGO_PTS = 80;
  const BRAND_LETTER_PTS = 40;
  const BRAND_DOT_PTS = 30;
  const BRAND_PROGRESS_STEP = 35;

  function calcBrandCatchPts(pieceId, char, alreadyCollected) {
    const base = pieceId === 'logo' ? BRAND_LOGO_PTS
      : char === '.' ? BRAND_DOT_PTS : BRAND_LETTER_PTS;
    const progress = Math.max(0, alreadyCollected) * BRAND_PROGRESS_STEP;
    return { base, progress, total: base + progress };
  }

  function makeBrandEntries() {
    const out = [{
      key: 'br_logo', pieceId: 'logo', kind: 'brand', name: 'LOGO KOLOROWE',
      desc: 'Kolorowy znak znajdzreklame.pl — małe punkty + bonus za postęp (+10 000 za komplet)',
      char: null, w: 50, h: 50, weight: 12, minT: 6, speed: 0.72, pts: BRAND_LOGO_PTS,
    }];
    for (let i = 0; i < BRAND_CHARS.length; i++) {
      const ch = BRAND_CHARS[i];
      out.push({
        key: `br_${i}`, pieceId: String(i), kind: 'brand',
        name: ch === '.' ? 'KROPKA „.”' : `LITERA „${ch.toUpperCase()}”`,
        desc: `Litera „${ch}” z napisu znajdzreklame.pl — małe punkty + bonus za postęp`,
        char: ch, w: ch === '.' ? 30 : 42, h: 44, weight: 14, minT: 6, speed: 0.72, pts: ch === '.' ? BRAND_DOT_PTS : BRAND_LETTER_PTS,
      });
    }
    return out;
  }

  function getBrandDisplayOrder() {
    return [
      { pieceId: 'logo', char: null, isLogo: true },
      ...BRAND_CHARS.split('').map((ch, i) => ({ pieceId: String(i), char: ch, isLogo: false })),
    ];
  }

  const BRAND_PIECE_COUNT = 1 + BRAND_CHARS.length;

  /** Metadane do katalogu (bez funkcji rysujących) */
  const CATALOG = [
    { key: 'poster',    kind: 'good',    name: 'REKLAMA',           desc: 'Mała kolorowa plansza z hasłem promocyjnym', pts: 100,  w: 56,  h: 70,  weight: 20, minT: 0 },
    { key: 'logo',      kind: 'good',    name: 'LOGO',              desc: 'Logo znajdzreklame.pl na białej kartce', pts: 100,  w: 52,  h: 52,  weight: 10, minT: 0 },
    { key: 'megaphone', kind: 'good',    name: 'MEGAFON',           desc: 'Megafon reklamowy', pts: 100,  w: 60,  h: 50,  weight: 8,  minT: 0 },
    { key: 'piwo',      kind: 'good',    name: 'PIWO',              desc: 'Neonowy szyld reklamowy z piwem', pts: 120,  w: 48,  h: 62,  weight: 10, minT: 0 },
    { key: 'citylight', kind: 'good',    name: 'CITYLIGHT',         desc: 'Podświetlana witryna citylight', pts: 150,  w: 48,  h: 92,  weight: 12, minT: 0 },
    { key: 'billboard', kind: 'good',    name: 'BILLBOARD',         desc: 'Billboard na konstrukcji (czasem z logo agencji)', pts: 200,  w: 112, h: 72,  weight: 10, minT: 8 },
    { key: 'format',    kind: 'good',    name: 'WIELKI FORMAT',     desc: 'Duża plansza mesh na elewacji', pts: 300,  w: 150, h: 90,  weight: 5,  minT: 15, speed: 0.9 },
    { key: 'paczkomat', kind: 'good',    name: 'PACZKOMAT',         desc: 'Reklama na paczkomacie InPost', pts: 180,  w: 52,  h: 88,  weight: 9,  minT: 4 },
    { key: 'dooh',      kind: 'good',    name: 'DOOH',              desc: 'Cyfrowa reklama DOOH (Digital Out Of Home)', pts: 220,  w: 72,  h: 96,  weight: 8,  minT: 6 },
    { key: 'trash',     kind: 'bad',     name: 'ŚMIECI',            desc: 'Pełny kosz na śmieci — traci życie', w: 50,  h: 52,  weight: 14, minT: 0 },
    { key: 'box',       kind: 'bad',     name: 'PUSTY KARTON',      desc: 'Pusty karton po plakatach', w: 56,  h: 50,  weight: 12, minT: 0 },
    { key: 'oldposter', kind: 'bad',     name: 'STARY PLAKAT',      desc: 'Podarty, wyblakły plakat', w: 52,  h: 66,  weight: 10, minT: 0 },
    { key: 'stop',      kind: 'bad',     name: 'STOP',              desc: 'Znak drogowy STOP', w: 54,  h: 54,  weight: 11, minT: 0 },
    { key: 'beam',      kind: 'bad',     name: 'KONSTRUKCJA',       desc: 'Belka konstrukcyjna billboardu', w: 92,  h: 24,  weight: 8,  minT: 12 },
    { key: 'broken',    kind: 'bad',     name: 'USZKODZONA REKLAMA', desc: 'Pęknięty, zniszczony billboard', w: 66,  h: 58,  weight: 8,  minT: 10 },
    { key: 'tire',      kind: 'bad',     name: 'OPONA',             desc: 'Stara opona z ulicy', w: 48,  h: 48,  weight: 8,  minT: 0 },
    { key: 'bomb',      kind: 'bad',     name: 'BOMBA',             desc: 'Wybuchowa pułapka — traci życie', w: 48,  h: 52,  weight: 10, minT: 6 },
    { key: 'faktura',   kind: 'bad',     name: 'NIEZAPŁACONA FAKTURA', desc: 'Zaległa faktura — traci życie', w: 50,  h: 58,  weight: 11, minT: 4 },
    { key: 'klient',    kind: 'bad',     name: 'PROBLEMATYCZNY KLIENT', desc: 'Trudny klient — traci życie', w: 52,  h: 60,  weight: 9,  minT: 8 },
    { key: 'broken_format', kind: 'bad', name: 'ZNISZCZ. WIELKI FORMAT', desc: 'Zniszczona reklama wielkoformatowa — traci 2 życia', w: 130, h: 78, weight: 4, minT: 18, livesLost: 2, speed: 0.85 },
    { key: 'power',     kind: 'special', name: 'BILLBOARD POWER',   desc: 'Billboard znajdzreklame.pl — +1000 i 2× punkty', pts: 1000, w: 170, h: 100, weight: 35, minT: 0,  effect: 'double', speed: 0.8 },
    { key: 'glow',      kind: 'special', name: 'CITYLIGHT BONUS',   desc: 'Świecący citylight — 2× punkty', pts: 150,  w: 58,  h: 108, weight: 30, minT: 0,  effect: 'double', speed: 0.85 },
    { key: 'mega',      kind: 'special', name: 'WIELKI FORMAT (+2K)', desc: 'Ogromna plansza — +2000 pkt, szybka i chwiejna', pts: 2000, w: 230, h: 120, weight: 22, minT: 15, speed: 1.35, wobble: 70 },
    { key: 'bus',       kind: 'special', name: 'AUTOBUS',           desc: 'Oklejony autobus — MEGA BONUS +5000', pts: 5000, w: 210, h: 84,  weight: 13, minT: 20, mover: true },
    { key: 'pu_heart',    kind: 'powerup', name: 'SERCE',           desc: 'Dodatkowe życie (+1 serduszko, max 5)', pts: 0, w: 52, h: 52, weight: 18, minT: 6,  effect: 'heart' },
    { key: 'pu_slowfall', kind: 'powerup', name: 'SPOWOLNIENIE',    desc: 'Wolniejsze opadanie reklam przez 8 s', pts: 0, w: 56, h: 56, weight: 16, minT: 8,  effect: 'slowFall', duration: 8 },
    { key: 'pu_magnet',   kind: 'powerup', name: 'SUPER ZASIĘG',    desc: 'Szersza strefa łapania przez 8 s', pts: 0, w: 58, h: 58, weight: 16, minT: 10, effect: 'bigCatch', duration: 8 },
    { key: 'pu_mini',     kind: 'powerup', name: 'MINI AUTO',       desc: 'Mniejszy pojazd — łatwiej manewrować (8 s)', pts: 0, w: 54, h: 54, weight: 14, minT: 12, effect: 'smallCar', duration: 8 },
    { key: 'pu_cruise',   kind: 'powerup', name: 'PRECYZJA',        desc: 'Wolniejszy pojazd — lepsza kontrola (8 s)', pts: 0, w: 56, h: 56, weight: 14, minT: 10, effect: 'slowCar', duration: 8 },
    ...makeBrandEntries(),
  ];

  function mulberry(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function getDisabled() {
    try { const v = localStorage.getItem(LS_DISABLED); return v ? JSON.parse(v) : []; } catch { return []; }
  }
  function setDisabled(keys) {
    try { localStorage.setItem(LS_DISABLED, JSON.stringify(keys)); } catch { /* prywatny tryb */ }
  }
  function isEnabled(key) { return !getDisabled().includes(key); }
  function toggle(key) {
    const d = getDisabled();
    const i = d.indexOf(key);
    if (i >= 0) d.splice(i, 1); else d.push(key);
    setDisabled(d);
    return isEnabled(key);
  }
  function enableAll() { setDisabled([]); }
  function disableKeys(keys) { setDisabled([...new Set(keys)]); }

  /** Tworzy silnik rysowania powiązany z kontekstem canvas gry */
  function createRenderer(ctx, drawLogo) {
    const noopLogo = (cx, cy, maxW, variant, maxH) => {
      ctx.font = `700 ${Math.min(14, maxW / 7)}px Rubik, system-ui, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = variant === 'white' ? '#fff' : '#394145';
      ctx.fillText(BRAND, cx, cy);
    };
    const logo = drawLogo || noopLogo;

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
    function fillRR(x, y, w, h, r, color) { rrect(x, y, w, h, r); ctx.fillStyle = color; ctx.fill(); }
    function text(str, x, y, size, color, { align = 'center', weight = 900, base = 'middle', stroke, lw = 4 } = {}) {
      ctx.font = `${weight} ${size}px Rubik, system-ui, sans-serif`;
      ctx.textAlign = align; ctx.textBaseline = base;
      if (stroke) { ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.strokeStyle = stroke; ctx.strokeText(str, x, y); }
      ctx.fillStyle = color; ctx.fillText(str, x, y);
    }
    function fitText(str, x, y, maxW, size, color, opts = {}) {
      ctx.font = `${opts.weight || 900} ${size}px Rubik, system-ui, sans-serif`;
      const m = ctx.measureText(str).width;
      if (m > maxW) size = Math.max(6, size * maxW / m);
      text(str, x, y, size, color, opts);
    }

    const D = {};
    D.poster = (w, h, r) => {
      const c = POSTER_COLORS[Math.floor(r() * POSTER_COLORS.length)];
      fillRR(0, 0, w, h, 5, '#fff');
      fillRR(4, 4, w - 8, h - 8, 3, c);
      ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(4, 4, w - 8, (h - 8) * 0.35);
      fitText(POSTER_WORDS[Math.floor(r() * POSTER_WORDS.length)], w / 2, h * 0.55, w - 14, 16, '#fff');
      ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(10, h - 14, w - 20, 3); ctx.fillRect(14, h - 8, w - 28, 2);
    };
    D.logo = (w, h) => {
      fillRR(0, 0, w, h, 10, '#fff');
      ctx.strokeStyle = 'rgba(255,122,0,.35)'; ctx.lineWidth = 2; rrect(2, 2, w - 4, h - 4, 8); ctx.stroke();
      logo(w / 2, h * 0.46, w - 14, 'default', h * 0.38);
      fillRR(w * 0.18, h * 0.72, w * 0.64, h * 0.16, 3, '#ff7a00');
      fitText('LOGO', w / 2, h * 0.8, w - 16, 9, '#fff', { weight: 900 });
    };
    D.megaphone = (w, h) => {
      ctx.fillStyle = '#ff4d6d';
      ctx.beginPath(); ctx.moveTo(w * 0.1, h * 0.4); ctx.lineTo(w * 0.62, h * 0.08); ctx.lineTo(w * 0.62, h * 0.92); ctx.lineTo(w * 0.1, h * 0.6); ctx.closePath(); ctx.fill();
      fillRR(w * 0.58, h * 0.02, w * 0.14, h * 0.96, 4, '#fff');
      fillRR(w * 0.02, h * 0.38, w * 0.14, h * 0.24, 4, '#0f1b3d');
      fillRR(w * 0.2, h * 0.6, w * 0.14, h * 0.4, 3, '#0f1b3d');
      ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 3;
      for (let i = 1; i <= 2; i++) { ctx.beginPath(); ctx.arc(w * 0.72, h * 0.5, i * w * 0.12, -0.9, 0.9); ctx.stroke(); }
    };
    D.piwo = (w, h, r, item) => {
      const glow = item ? 0.85 + 0.15 * Math.sin(item.age * 7) : 1;
      fillRR(0, 0, w, h, 5, '#1a1208');
      fillRR(2, 2, w - 4, h - 4, 4, '#292018');
      ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2;
      rrect(3, 3, w - 6, h - 6, 4); ctx.stroke();
      fillRR(4, 4, w - 8, h * 0.72, 3, '#14532d');
      const sky = ctx.createLinearGradient(0, h * 0.06, 0, h * 0.62);
      sky.addColorStop(0, '#166534'); sky.addColorStop(1, '#052e16');
      fillRR(w * 0.08, h * 0.08, w * 0.84, h * 0.58, 3, sky);
      fillRR(w * 0.36, h * 0.1, w * 0.28, h * 0.12, 2, '#166534');
      fillRR(w * 0.38, h * 0.06, w * 0.24, h * 0.06, 1, '#dc2626');
      fillRR(w * 0.34, h * 0.2, w * 0.32, h * 0.44, 4, '#15803d');
      const beer = ctx.createLinearGradient(0, h * 0.24, 0, h * 0.62);
      beer.addColorStop(0, '#fde68a'); beer.addColorStop(0.4, '#fbbf24'); beer.addColorStop(1, '#b45309');
      fillRR(w * 0.36, h * 0.24, w * 0.28, h * 0.38, 3, beer);
      fillRR(w * 0.35, h * 0.36, w * 0.3, h * 0.12, 2, '#fff');
      fitText('BEER', w / 2, h * 0.42, w * 0.28, 6, '#166534', { weight: 900 });
      ctx.fillStyle = '#fff';
      for (const [fx, fr] of [[0.42, 2.5], [0.5, 3.2 * glow], [0.58, 2.5]]) {
        ctx.beginPath(); ctx.arc(w * fx, h * 0.2, fr, 0, 7); ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(w * 0.39, h * 0.26, w * 0.06, h * 0.3);
      fillRR(w * 0.06, h * 0.74, w * 0.88, h * 0.2, 3, '#fbbf24');
      ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 8 * glow;
      fitText('PIWO', w / 2, h * 0.84, w * 0.82, 11, '#14532d', { weight: 900, stroke: 'rgba(255,255,255,.35)', lw: 1 });
      ctx.shadowBlur = 0;
    };
    D.citylight = (w, h, r, item) => {
      fillRR(0, 0, w, h, 6, '#2b3350');
      const g = ctx.createLinearGradient(0, 0, 0, h);
      const c = POSTER_COLORS[Math.floor(r() * POSTER_COLORS.length)];
      g.addColorStop(0, '#ffffff'); g.addColorStop(1, c);
      fillRR(5, 5, w - 10, h - 22, 3, g);
      ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(9, 9, 5, h - 30);
      fitText('CITY', w / 2, h * 0.36, w - 14, 12, c, { weight: 900 });
      fitText('LIGHT', w / 2, h * 0.52, w - 14, 12, '#0f1b3d');
      ctx.fillStyle = '#1a2038'; ctx.fillRect(w * 0.2, h - 14, w * 0.6, 14);
      if (item && item.glow) { ctx.fillStyle = `rgba(255,255,200,${0.25 + 0.2 * Math.sin(item.age * 8)})`; ctx.fillRect(5, 5, w - 10, h - 22); }
    };
    D.billboard = (w, h, r) => {
      const brand = r() < 0.3;
      const legH = h * 0.22;
      ctx.fillStyle = '#4a5068';
      ctx.fillRect(w * 0.2, h - legH, 6, legH); ctx.fillRect(w * 0.8 - 6, h - legH, 6, legH);
      fillRR(0, 0, w, h - legH, 4, '#e8ecf5');
      const c = brand ? '#ff7a00' : POSTER_COLORS[Math.floor(r() * POSTER_COLORS.length)];
      fillRR(4, 4, w - 8, h - legH - 8, 2, c);
      if (brand) {
        fillRR(8, 8, w - 16, (h - legH) * 0.52, 3, '#fff');
        logo(w / 2, (h - legH) * 0.34, w - 24, 'default', (h - legH) * 0.38);
        fitText('BILLBOARDY • CITYLIGHTY', w / 2, (h - legH) * 0.78, w - 22, 8, 'rgba(255,255,255,.9)', { weight: 700 });
      } else {
        ctx.fillStyle = 'rgba(255,255,255,.28)';
        ctx.beginPath(); ctx.arc(w * 0.25, (h - legH) * 0.5, (h - legH) * 0.28, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.fillRect(w * 0.45, (h - legH) * 0.32, w * 0.42, 6); ctx.fillRect(w * 0.45, (h - legH) * 0.52, w * 0.32, 5);
        fitText(POSTER_WORDS[Math.floor(r() * POSTER_WORDS.length)], w * 0.66, (h - legH) * 0.75, w * 0.4, 10, '#fff');
      }
    };
    D.format = (w, h, r) => {
      const c1 = POSTER_COLORS[Math.floor(r() * POSTER_COLORS.length)];
      const c2 = POSTER_COLORS[Math.floor(r() * POSTER_COLORS.length)];
      fillRR(0, 0, w, h, 3, '#1c2238');
      const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, c1); g.addColorStop(1, c2);
      fillRR(5, 5, w - 10, h - 10, 2, g);
      ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 1;
      for (let x = 5; x < w - 5; x += 12) { ctx.beginPath(); ctx.moveTo(x, 5); ctx.lineTo(x, h - 5); ctx.stroke(); }
      for (let y = 5; y < h - 5; y += 12) { ctx.beginPath(); ctx.moveTo(5, y); ctx.lineTo(w - 5, y); ctx.stroke(); }
      fitText('WIELKI FORMAT', w / 2, h * 0.45, w - 24, 20, '#fff', { stroke: 'rgba(0,0,0,.3)', lw: 5 });
      fitText('reklama na elewacji', w / 2, h * 0.72, w - 24, 10, 'rgba(255,255,255,.9)', { weight: 700 });
      ctx.fillStyle = '#cfd6e6'; [[8, 8], [w - 12, 8], [8, h - 12], [w - 12, h - 12]].forEach(([x, y]) => ctx.fillRect(x, y, 4, 4));
    };
    D.paczkomat = (w, h, r) => {
      fillRR(0, 0, w, h, 5, '#ffcc00');
      fillRR(2, 2, w - 4, h - 4, 4, '#ffd633');
      const slotH = (h - 16) / 3.4;
      for (let row = 0; row < 3; row++) {
        const sy = 10 + row * slotH;
        fillRR(6, sy, w - 12, slotH - 4, 2, '#f5d020');
        ctx.fillStyle = '#c9a000';
        ctx.fillRect(w - 14, sy + 4, 4, slotH - 10);
        ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 1;
        ctx.strokeRect(6.5, sy + 0.5, w - 13, slotH - 5);
        ctx.fillStyle = '#e6b800';
      }
      fillRR(5, 5, w - 10, h * 0.28, 2, '#1a2038');
      const c = POSTER_COLORS[Math.floor(r() * POSTER_COLORS.length)];
      fillRR(7, 7, w - 14, h * 0.24, 2, c);
      fitText(POSTER_WORDS[Math.floor(r() * POSTER_WORDS.length)], w / 2, h * 0.17, w - 16, 9, '#fff', { weight: 900 });
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(8, 8, 4, h * 0.2);
      fillRR(4, h - 14, w - 8, 10, 2, '#1a1a1a');
      fitText('PACZKOMAT', w / 2, h - 9, w - 12, 6, '#ffcc00', { weight: 900 });
    };
    D.dooh = (w, h, r, item) => {
      ctx.fillStyle = '#3a4060';
      ctx.fillRect(w * 0.46, h * 0.72, w * 0.08, h * 0.28);
      fillRR(0, 0, w, h * 0.72, 4, '#1c2238');
      fillRR(4, 4, w - 8, h * 0.64, 3, '#0a0e18');
      const c1 = POSTER_COLORS[Math.floor(r() * POSTER_COLORS.length)];
      const c2 = POSTER_COLORS[Math.floor(r() * POSTER_COLORS.length)];
      const pulse = item ? 0.55 + 0.45 * Math.sin(item.age * 5) : 0.75;
      ctx.globalAlpha = pulse;
      const g = ctx.createLinearGradient(0, 0, w, h * 0.55);
      g.addColorStop(0, c1); g.addColorStop(1, c2);
      fillRR(8, 8, w - 16, h * 0.48, 2, g);
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(0,0,0,.18)';
      for (let y = 8; y < h * 0.56; y += 3) ctx.fillRect(8, y, w - 16, 1);
      ctx.fillStyle = 'rgba(255,255,255,.12)';
      for (let x = 10; x < w - 10; x += 6) for (let y = 10; y < h * 0.52; y += 6) {
        if (Math.floor((x + y) / 6 + (item?.age || 0) * 3) % 3 === 0) ctx.fillRect(x, y, 2, 2);
      }
      fitText('DOOH', w / 2, h * 0.34, w - 20, 16, '#fff', { stroke: 'rgba(0,0,0,.45)', lw: 4 });
      fitText('DIGITAL OOH', w / 2, h * 0.5, w - 20, 7, 'rgba(255,255,255,.92)', { weight: 700 });
      if (item) {
        ctx.fillStyle = `rgba(100,200,255,${0.1 + 0.08 * Math.sin(item.age * 6)})`;
        fillRR(2, 2, w - 4, h * 0.68, 3, `rgba(100,200,255,${0.08 + 0.06 * Math.sin(item.age * 6)})`);
      }
      ctx.fillStyle = '#6b7280';
      ctx.fillRect(w * 0.2, h * 0.72, w * 0.6, 3);
    };
    D.trash = (w, h) => {
      ctx.fillStyle = '#2c2f3a';
      ctx.beginPath(); ctx.ellipse(w / 2, h * 0.62, w * 0.46, h * 0.38, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(w * 0.35, h * 0.3); ctx.lineTo(w * 0.28, h * 0.02); ctx.lineTo(w * 0.5, h * 0.2); ctx.lineTo(w * 0.72, h * 0.02); ctx.lineTo(w * 0.65, h * 0.3); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#8fd14f'; ctx.fillRect(w * 0.4, h * 0.22, w * 0.2, h * 0.08);
      ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.ellipse(w * 0.38, h * 0.5, w * 0.12, h * 0.16, -0.5, 0, Math.PI * 2); ctx.fill();
    };
    D.box = (w, h) => {
      fillRR(0, h * 0.12, w, h * 0.88, 3, '#b0763a');
      ctx.fillStyle = '#8d5a2b'; ctx.fillRect(0, h * 0.12, w, h * 0.12);
      ctx.fillStyle = '#c98a48'; ctx.beginPath(); ctx.moveTo(0, h * 0.12); ctx.lineTo(w * 0.2, 0); ctx.lineTo(w * 0.45, h * 0.12); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(w, h * 0.12); ctx.lineTo(w * 0.8, 0); ctx.lineTo(w * 0.55, h * 0.12); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#e9d9a8'; ctx.fillRect(w * 0.45, h * 0.12, w * 0.1, h * 0.88);
      text('PUSTY', w / 2, h * 0.62, 9, '#5a3a18', { weight: 700 });
    };
    D.oldposter = (w, h) => {
      fillRR(0, 0, w, h, 2, '#b9b19c');
      ctx.fillStyle = '#d9d2bd'; ctx.fillRect(4, 4, w - 8, h - 8);
      ctx.fillStyle = '#a99f86'; ctx.fillRect(10, 12, w - 20, 5); ctx.fillRect(10, 24, w - 26, 4);
      ctx.fillStyle = '#7a705a'; ctx.beginPath(); ctx.moveTo(w, h * 0.55); ctx.lineTo(w, h); ctx.lineTo(w * 0.55, h); ctx.closePath(); ctx.fill();
      text('OLD', w * 0.42, h * 0.72, 10, '#8a7f66', { weight: 700 });
    };
    D.stop = (w, h) => {
      ctx.fillStyle = '#d7263d'; ctx.beginPath();
      for (let i = 0; i < 8; i++) { const a = Math.PI / 8 + i * Math.PI / 4; ctx.lineTo(w / 2 + Math.cos(a) * w / 2, h / 2 + Math.sin(a) * h / 2); }
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();
      fitText('STOP', w / 2, h / 2 + 1, w * 0.72, 16, '#fff');
    };
    D.beam = (w, h) => {
      fillRR(0, 0, w, h, 2, '#6b7280');
      ctx.fillStyle = '#4b5160'; ctx.fillRect(0, h * 0.35, w, h * 0.3);
      ctx.fillStyle = '#ffd60a';
      for (let x = 4; x < w - 8; x += 16) { ctx.beginPath(); ctx.moveTo(x, h * 0.35); ctx.lineTo(x + 8, h * 0.35); ctx.lineTo(x + 2, h * 0.65); ctx.lineTo(x - 6, h * 0.65); ctx.closePath(); ctx.fill(); }
    };
    D.broken = (w, h) => {
      const legH = h * 0.2;
      ctx.fillStyle = '#4a5068'; ctx.fillRect(w * 0.2, h - legH, 6, legH);
      ctx.save(); ctx.translate(w * 0.8, h - legH); ctx.rotate(0.6); ctx.fillRect(-3, 0, 6, legH); ctx.restore();
      fillRR(0, 0, w, h - legH, 3, '#9aa0b3');
      ctx.fillStyle = '#c7c2b1'; ctx.fillRect(4, 4, w - 8, h - legH - 8);
      ctx.fillStyle = '#6d6a72'; ctx.beginPath(); ctx.moveTo(w * 0.55, 4); ctx.lineTo(w - 4, 4); ctx.lineTo(w - 4, h - legH - 4); ctx.lineTo(w * 0.7, h - legH - 4); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(w * 0.3, 6); ctx.lineTo(w * 0.42, h * 0.3); ctx.lineTo(w * 0.34, h * 0.5); ctx.lineTo(w * 0.5, h - legH - 6); ctx.stroke();
    };
    D.tire = (w, h) => {
      ctx.fillStyle = '#1c1e26'; ctx.beginPath(); ctx.arc(w / 2, h / 2, w / 2, 0, 7); ctx.fill();
      ctx.fillStyle = '#3a3d4a'; ctx.beginPath(); ctx.arc(w / 2, h / 2, w * 0.3, 0, 7); ctx.fill();
      ctx.fillStyle = '#6b6f80'; ctx.beginPath(); ctx.arc(w / 2, h / 2, w * 0.12, 0, 7); ctx.fill();
    };
    D.bomb = (w, h, r, item) => {
      const pulse = item ? 0.85 + 0.15 * Math.sin(item.age * 12) : 1;
      ctx.fillStyle = '#1c1e26';
      ctx.beginPath(); ctx.arc(w / 2, h * 0.58, w * 0.38, 0, 7); ctx.fill();
      ctx.fillStyle = '#2a2d38';
      ctx.beginPath(); ctx.arc(w * 0.42, h * 0.5, w * 0.12, 0, 7); ctx.fill();
      ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(w / 2, h * 0.22); ctx.quadraticCurveTo(w * 0.62, h * 0.08, w * 0.58, 0); ctx.stroke();
      ctx.fillStyle = `rgba(255,${Math.floor(100 + 80 * pulse)},60,.95)`;
      ctx.beginPath(); ctx.arc(w * 0.58, 2, 4 * pulse, 0, 7); ctx.fill();
      ctx.shadowColor = '#ff4d5e'; ctx.shadowBlur = 8 * pulse;
      fitText('BUM', w / 2, h * 0.62, w * 0.5, 11, '#ff4d5e', { weight: 900, stroke: '#fff', lw: 2 });
      ctx.shadowBlur = 0;
    };
    D.faktura = (w, h) => {
      fillRR(0, 0, w, h, 3, '#f4f6fb');
      ctx.fillStyle = '#d1d5db'; ctx.fillRect(0, 0, w, 6);
      ctx.fillStyle = '#9ca3af';
      for (let y = 14; y < h - 10; y += 9) ctx.fillRect(8, y, w - (y % 18 === 0 ? 22 : 14), 3);
      fillRR(w * 0.08, h * 0.12, w * 0.84, h * 0.22, 2, '#fee2e2');
      fitText('FAKTURA', w / 2, h * 0.2, w - 12, 8, '#991b1b', { weight: 900 });
      ctx.save(); ctx.translate(w / 2, h * 0.72); ctx.rotate(-0.18);
      ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 2;
      ctx.strokeRect(-w * 0.38, -h * 0.1, w * 0.76, h * 0.2);
      fitText('NIEZAPŁACONA', 0, 0, w * 0.72, 7, '#dc2626', { weight: 900 });
      ctx.restore();
      fitText('TERMIN!', w / 2, h * 0.48, w - 10, 7, '#374151', { weight: 700 });
    };
    D.klient = (w, h) => {
      fillRR(w * 0.22, h * 0.08, w * 0.56, h * 0.28, 8, '#fca5a5');
      ctx.fillStyle = '#1c1e26';
      ctx.beginPath(); ctx.arc(w * 0.36, h * 0.2, 3, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(w * 0.64, h * 0.2, 3, 0, 7); ctx.fill();
      ctx.strokeStyle = '#991b1b'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(w * 0.32, h * 0.28); ctx.lineTo(w * 0.42, h * 0.26); ctx.moveTo(w * 0.58, h * 0.26); ctx.lineTo(w * 0.68, h * 0.28); ctx.stroke();
      fillRR(w * 0.18, h * 0.36, w * 0.64, h * 0.48, 6, '#3b82f6');
      fillRR(w * 0.04, h * 0.52, w * 0.18, h * 0.22, 3, '#1e40af');
      fillRR(w * 0.04, h * 0.52, w * 0.14, h * 0.16, 2, '#93c5fd');
      fitText('!!!', w * 0.78, h * 0.18, w * 0.28, 12, '#dc2626', { weight: 900 });
      fillRR(w * 0.68, h * 0.08, w * 0.28, h * 0.18, 4, '#fff');
      fitText('?!', w * 0.82, h * 0.17, w * 0.2, 9, '#dc2626', { weight: 900 });
      fitText('KLIENT', w / 2, h * 0.92, w - 8, 6, '#1e3a8a', { weight: 900 });
    };
    D.broken_format = (w, h, r) => {
      const c1 = POSTER_COLORS[Math.floor(r() * POSTER_COLORS.length)];
      fillRR(0, 0, w, h, 3, '#1c2238');
      fillRR(5, 5, w - 10, h - 10, 2, c1);
      ctx.strokeStyle = 'rgba(255,255,255,.15)'; ctx.lineWidth = 1;
      for (let x = 5; x < w - 5; x += 10) { ctx.beginPath(); ctx.moveTo(x, 5); ctx.lineTo(x, h - 5); ctx.stroke(); }
      for (let y = 5; y < h - 5; y += 10) { ctx.beginPath(); ctx.moveTo(5, y); ctx.lineTo(w - 5, y); ctx.stroke(); }
      ctx.fillStyle = '#6d6a72';
      ctx.beginPath(); ctx.moveTo(w * 0.45, 5); ctx.lineTo(w - 5, 5); ctx.lineTo(w - 5, h * 0.55); ctx.lineTo(w * 0.62, h - 5); ctx.lineTo(w * 0.35, h - 5); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(w * 0.28, 8); ctx.lineTo(w * 0.38, h * 0.35); ctx.lineTo(w * 0.32, h * 0.58); ctx.lineTo(w * 0.48, h - 8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(w * 0.55, 12); ctx.lineTo(w * 0.62, h * 0.42); ctx.stroke();
      fitText('ZŁAMANY', w * 0.38, h * 0.42, w * 0.55, 14, '#fff', { stroke: 'rgba(0,0,0,.4)', lw: 4 });
      fitText('WIELKI FORMAT', w * 0.38, h * 0.62, w * 0.55, 9, 'rgba(255,255,255,.9)', { weight: 700 });
      fillRR(w * 0.04, h - 14, w * 0.28, 12, 2, 'rgba(220,38,38,.9)');
      fitText('-2 ŻYCIA', w * 0.18, h - 8, w * 0.24, 6, '#fff', { weight: 900 });
    };
    D.power = (w, h, r, item) => {
      const legH = h * 0.2;
      ctx.fillStyle = '#4a5068'; ctx.fillRect(w * 0.15, h - legH, 8, legH); ctx.fillRect(w * 0.85 - 8, h - legH, 8, legH);
      fillRR(0, 0, w, h - legH, 6, '#fff');
      const g = ctx.createLinearGradient(0, 0, w, 0); g.addColorStop(0, '#ff7a00'); g.addColorStop(1, '#ffb703');
      fillRR(5, 5, w - 10, h - legH - 10, 4, g);
      fillRR(12, 12, w - 24, (h - legH) * 0.48, 4, '#fff');
      logo(w / 2, (h - legH) * 0.36, w - 36, 'default', (h - legH) * 0.34);
      fitText('BILLBOARD POWER  •  2x PUNKTY', w / 2, (h - legH) * 0.74, w - 30, 10, '#0f1b3d', { weight: 900 });
      for (let i = 0; i < 6; i++) { ctx.fillStyle = (Math.floor((item?.age || 0) * 6) + i) % 2 ? '#fff' : '#ffd166'; ctx.beginPath(); ctx.arc(14 + i * (w - 28) / 5, -4, 3, 0, 7); ctx.fill(); }
    };
    D.glow = (w, h, r, item) => { item = item || { glow: true, age: 0 }; item.glow = true; D.citylight(w, h, r, item); fitText('2x', w / 2, h * 0.7, w - 16, 20, '#ff7a00', { stroke: '#fff', lw: 4 }); };
    D.mega = (w, h, r) => { D.format(w, h, r); fillRR(w * 0.5 - 44, h * 0.5 - 14, 88, 28, 6, 'rgba(15,27,61,.85)'); text('+2000', w / 2, h * 0.5 + 1, 18, '#ffd166'); };
    D.bus = (w, h) => {
      ctx.fillStyle = '#1c1e26'; [w * 0.2, w * 0.8].forEach((x) => { ctx.beginPath(); ctx.arc(x, h - 9, 11, 0, 7); ctx.fill(); });
      fillRR(0, 0, w, h - 14, 10, '#ff7a00');
      const g = ctx.createLinearGradient(0, 0, w, 0); g.addColorStop(0, '#ffb703'); g.addColorStop(1, '#ff4d00');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, h * 0.55); ctx.lineTo(w, h * 0.3); ctx.lineTo(w, h - 14); ctx.lineTo(0, h - 14); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#9fd8ff';
      for (let i = 0; i < 5; i++) fillRR(10 + i * (w - 20) / 5, 8, (w - 20) / 5 - 6, h * 0.32, 3, '#a9dcff');
      fillRR(8, h * 0.52, w - 16, h * 0.34, 4, '#fff');
      logo(w / 2, h * 0.69, w - 28, 'default', h * 0.22);
    };

    function drawHeartIcon(cx, cy, s, color) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(cx, cy + s * 0.35);
      ctx.bezierCurveTo(cx, cy, cx - s * 0.5, cy, cx - s * 0.5, cy + s * 0.3);
      ctx.bezierCurveTo(cx - s * 0.5, cy + s * 0.6, cx, cy + s * 0.8, cx, cy + s);
      ctx.bezierCurveTo(cx, cy + s * 0.8, cx + s * 0.5, cy + s * 0.6, cx + s * 0.5, cy + s * 0.3);
      ctx.bezierCurveTo(cx + s * 0.5, cy, cx, cy, cx, cy + s * 0.35);
      ctx.fill();
    }

    function puBubble(w, h, c1, c2, label) {
      const g = ctx.createRadialGradient(w * 0.35, h * 0.3, 2, w / 2, h / 2, w * 0.55);
      g.addColorStop(0, c1); g.addColorStop(1, c2);
      fillRR(2, 2, w - 4, h - 4, 14, g);
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2;
      rrect(2, 2, w - 4, h - 4, 14); ctx.stroke();
      fitText(label, w / 2, h - 9, w - 10, 7, '#fff', { weight: 900, stroke: 'rgba(0,0,0,.35)', lw: 3 });
    }

    D.pu_heart = (w, h, r, item) => {
      puBubble(w, h, '#ff6b8a', '#d7263d', '+1 ŻYCIE');
      drawHeartIcon(w / 2, h * 0.42, h * 0.22, '#fff');
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.arc(w * 0.28, h * 0.26, 4, 0, 7); ctx.fill();
    };
    D.pu_slowfall = (w, h) => {
      puBubble(w, h, '#5eead4', '#0891b2', 'WOLNIEJ');
      ctx.fillStyle = '#fff'; ctx.font = `900 ${h * 0.34}px Rubik, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('▼', w / 2, h * 0.38);
      ctx.globalAlpha = 0.45;
      ctx.fillText('▼', w / 2 - 10, h * 0.52); ctx.fillText('▼', w / 2 + 10, h * 0.52);
      ctx.globalAlpha = 1;
    };
    D.pu_magnet = (w, h) => {
      puBubble(w, h, '#a78bfa', '#7c3aed', 'ZASIĘG');
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(w / 2, h * 0.38, w * 0.22, Math.PI, 0); ctx.stroke();
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(w * 0.32, h * 0.36, w * 0.12, h * 0.1); ctx.fillRect(w * 0.56, h * 0.36, w * 0.12, h * 0.1);
      ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2;
      for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(w / 2 + i * 14, h * 0.52); ctx.lineTo(w / 2 + i * 22, h * 0.62); ctx.stroke(); }
    };
    D.pu_mini = (w, h) => {
      puBubble(w, h, '#fcd34d', '#f59e0b', 'MINI');
      fillRR(w * 0.28, h * 0.48, w * 0.44, h * 0.22, 3, '#f4f6fb');
      fillRR(w * 0.3, h * 0.5, w * 0.28, h * 0.12, 2, '#0f1b3d');
      ctx.fillStyle = '#1c1e26'; ctx.beginPath(); ctx.arc(w * 0.36, h * 0.72, 4, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(w * 0.64, h * 0.72, 4, 0, 7); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(w * 0.2, h * 0.46); ctx.lineTo(w * 0.8, h * 0.46); ctx.moveTo(w * 0.2, h * 0.74); ctx.lineTo(w * 0.8, h * 0.74); ctx.stroke();
    };
    D.pu_cruise = (w, h) => {
      puBubble(w, h, '#93c5fd', '#3b82f6', 'PRECYZJA');
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(w / 2, h * 0.42, w * 0.18, 0.2, Math.PI - 0.2); ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.moveTo(w * 0.62, h * 0.4); ctx.lineTo(w * 0.72, h * 0.48); ctx.lineTo(w * 0.58, h * 0.5); ctx.closePath(); ctx.fill();
      fitText('1×', w / 2, h * 0.58, w * 0.4, 14, '#fff', { weight: 900 });
    };

    function drawBrandLogoBlock(w, h) {
      fillRR(0, 0, w, h, 7, '#fff');
      fillRR(3, 3, w * 0.42, h * 0.38, 4, '#F69F2B');
      fillRR(w * 0.52, 3, w * 0.45, h * 0.38, 4, '#0F435E');
      fillRR(3, h * 0.48, w * 0.42, h * 0.47, 4, '#0F435E');
      fillRR(w * 0.52, h * 0.48, w * 0.45, h * 0.47, 4, '#D52928');
      ctx.strokeStyle = '#ff7a00'; ctx.lineWidth = 2;
      rrect(2, 2, w - 4, h - 4, 6); ctx.stroke();
    }
    function drawBrandLetterBlock(w, h, ch) {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#fff'); g.addColorStop(1, '#eef1f6');
      fillRR(0, 0, w, h, 6, '#fff');
      fillRR(2, 2, w - 4, h - 4, 5, g);
      ctx.strokeStyle = '#ff7a00'; ctx.lineWidth = 2;
      rrect(2, 2, w - 4, h - 4, 5); ctx.stroke();
      if (ch === '.') {
        ctx.fillStyle = '#394145';
        ctx.beginPath(); ctx.arc(w / 2, h * 0.66, Math.min(w, h) * 0.12, 0, 7); ctx.fill();
      } else {
        text(ch.toLowerCase(), w / 2, h / 2 + 1, Math.min(w, h) * 0.62, '#394145', { weight: 900, stroke: 'rgba(255,122,0,.35)', lw: 2 });
      }
    }
    for (const meta of CATALOG) {
      if (meta.kind !== 'brand') continue;
      D[meta.key] = meta.pieceId === 'logo'
        ? (w, h) => drawBrandLogoBlock(w, h)
        : (w, h) => drawBrandLetterBlock(w, h, meta.char);
    }

    const ITEMS = {};
    for (const meta of CATALOG) {
      ITEMS[meta.key] = { ...meta, draw: D[meta.key] };
    }

    function renderPreview(key, seed, boxW, boxH) {
      const def = ITEMS[key];
      if (!def) return;
      const scale = Math.min(boxW / def.w, boxH / def.h, 2.5);
      const w = def.w * scale, h = def.h * scale;
      const ox = (boxW - w) / 2, oy = (boxH - h) / 2;
      const r = mulberry(seed || 42);
      const item = { age: 1.2, glow: key === 'glow' };
      ctx.save();
      ctx.translate(ox, oy);
      if (def.kind === 'bad') {
        ctx.setLineDash([5, 4]); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,77,94,.85)';
        ctx.strokeRect(-4, -4, w + 8, h + 8); ctx.setLineDash([]);
      }
      if (def.kind === 'special') {
        ctx.shadowColor = '#ffd166'; ctx.shadowBlur = 14;
      }
      if (def.kind === 'powerup') {
        ctx.shadowColor = '#4cc9f0'; ctx.shadowBlur = 16;
        fillRR(-3, -3, w + 6, h + 6, 10, 'rgba(76,201,240,.22)');
        ctx.shadowBlur = 0;
      }
      if (def.kind === 'brand') {
        ctx.shadowColor = '#ff7a00'; ctx.shadowBlur = 14;
        fillRR(-3, -3, w + 6, h + 6, 8, 'rgba(255,122,0,.22)');
        ctx.shadowBlur = 0;
      }
      ctx.scale(scale, scale);
      def.draw(def.w, def.h, r, item);
      ctx.restore();
    }

    return { ITEMS, renderPreview, D };
  }

  return {
    CATALOG, LS_DISABLED, BRAND, BRAND_CHARS, BRAND_BONUS, BRAND_PIECE_COUNT,
    BRAND_LOGO_PTS, BRAND_LETTER_PTS, BRAND_DOT_PTS, BRAND_PROGRESS_STEP,
    calcBrandCatchPts, getBrandDisplayOrder,
    getDisabled, setDisabled, isEnabled, toggle, enableAll, disableKeys,
    createRenderer, mulberry,
  };
})();
