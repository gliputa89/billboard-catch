/* Wspólna definicja spadających elementów — gra + katalog /assets/ */
window.BBC_FallingItems = (function () {
  "use strict";

  const BRAND = "znajdzreklame.pl";
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

  /** Metadane do katalogu (bez funkcji rysujących) */
  const CATALOG = [
    {
      key: "poster",
      kind: "good",
      name: "REKLAMA",
      desc: "Mała kolorowa plansza z hasłem promocyjnym",
      pts: 100,
      w: 56,
      h: 70,
      weight: 20,
      minT: 0,
    },
    {
      key: "super_umowa",
      kind: "good",
      name: "SUPER UMOWA",
      desc: "Podpisana umowa reklamowa — duży kontrakt",
      pts: 350,
      w: 58,
      h: 74,
      weight: 12,
      minT: 4,
    },
    {
      key: "piwo",
      kind: "good",
      name: "PIWO",
      desc: "Kufel pysznego piwa z pianką",
      pts: 120,
      w: 50,
      h: 64,
      weight: 10,
      minT: 0,
    },
    {
      key: "citylight",
      kind: "good",
      name: "CITYLIGHT",
      desc: "Podświetlana witryna citylight",
      pts: 150,
      w: 48,
      h: 92,
      weight: 12,
      minT: 0,
    },
    {
      key: "billboard",
      kind: "good",
      name: "BILLBOARD",
      desc: "Billboard na konstrukcji (czasem z logo agencji)",
      pts: 200,
      w: 112,
      h: 72,
      weight: 10,
      minT: 8,
    },
    {
      key: "billboard_12m",
      kind: "good",
      name: "BILLBOARD 12 M",
      desc: "Najprostszy billboard 5,04×2,38 m na jednej nodzie, bez oświetlenia",
      pts: 180,
      w: 128,
      h: 96,
      weight: 12,
      minT: 3,
    },
    {
      key: "format",
      kind: "good",
      name: "WIELKI FORMAT",
      desc: "Duża plansza mesh na elewacji",
      pts: 300,
      w: 150,
      h: 90,
      weight: 5,
      minT: 15,
      speed: 0.9,
    },
    {
      key: "paczkomat",
      kind: "good",
      name: "PACZKOMAT",
      desc: "Reklama na paczkomacie InPost",
      pts: 180,
      w: 52,
      h: 88,
      weight: 9,
      minT: 4,
    },
    {
      key: "dooh",
      kind: "good",
      name: "DOOH",
      desc: "Cyfrowa reklama DOOH (Digital Out Of Home)",
      pts: 220,
      w: 72,
      h: 96,
      weight: 8,
      minT: 6,
    },
    {
      key: "nowy_dostawca",
      kind: "good",
      name: "NOWY DOSTAWCA",
      desc: "Nowy partner nośników — więcej powierzchni w ofercie",
      pts: 280,
      w: 58,
      h: 74,
      weight: 9,
      minT: 4,
    },
    {
      key: "plus_500",
      kind: "good",
      name: "+500 PKT",
      desc: "Złoty bonus punktowy — natychmiast +500",
      pts: 500,
      w: 62,
      h: 62,
      weight: 6,
      minT: 8,
    },
    {
      key: "nowe_billboardy",
      kind: "good",
      name: "NOWE BILLBOARDY W BAZIE",
      desc: "Świeży wsad nośników do bazy znajdzreklame.pl",
      pts: 400,
      w: 96,
      h: 78,
      weight: 7,
      minT: 5,
    },
    {
      key: "broken",
      kind: "bad",
      name: "USZKODZONA REKLAMA",
      desc: "Pęknięty, zniszczony billboard",
      w: 66,
      h: 58,
      weight: 8,
      minT: 10,
    },
    {
      key: "peel_poster",
      kind: "bad",
      name: "ODKLEJAJĄCY SIĘ PLAKAT",
      desc: "Plakat schodzi z billboardu — traci życie",
      w: 96,
      h: 68,
      weight: 8,
      minT: 5,
    },
    {
      key: "dead_light",
      kind: "bad",
      name: "NIE DZIAŁAJĄCE OŚWIETLENIE",
      desc: "Citylight bez podświetlenia — traci życie",
      w: 50,
      h: 94,
      weight: 8,
      minT: 6,
    },
    {
      key: "faktura",
      kind: "bad",
      name: "NIEZAPŁACONA FAKTURA",
      desc: "Zaległa faktura — traci życie",
      w: 50,
      h: 58,
      weight: 11,
      minT: 4,
    },
    {
      key: "klient",
      kind: "bad",
      name: "PROBLEMATYCZNY KLIENT",
      desc: "Trudny klient — traci życie",
      w: 52,
      h: 60,
      weight: 9,
      minT: 8,
    },
    {
      key: "broken_format",
      kind: "bad",
      name: "ZNISZCZONY WIELKI FORMAT",
      desc: "Zniszczona reklama wielkoformatowa — traci 2 życia",
      w: 130,
      h: 78,
      weight: 4,
      minT: 18,
      livesLost: 2,
      speed: 0.85,
    },
    {
      key: "zurek",
      kind: "bad",
      name: "ŻUREK",
      desc: "Zepsuty talerz żurku — overlay i −10 000 pkt",
      pts: -10000,
      w: 102,
      h: 72,
      weight: 7,
      minT: 8,
      effect: "penaltyOverlay",
      overlayTitle: "NIEŚWIEŻY ŻUREK",
      overlayColor: "#d7e36a",
      overlayFlash: "110,130,30",
      overlayBurst: ["#8a9a3a", "#3d3418"],
      overlayTint: {
        dark: "12, 10, 4",
        mid: "110,130,30",
        edge: "48,40,12",
        core: "154,170,66",
      },
    },
    {
      key: "wrong_miniboard",
      kind: "bad",
      name: "MINIBOARD W INNYM MIEJSCU",
      desc: "Dostawca sprzedał na jednej ulicy, a postawił na drugiej — overlay i −10 000 pkt",
      pts: -10000,
      w: 104,
      h: 88,
      weight: 6,
      minT: 9,
      effect: "penaltyOverlay",
      overlayTitle: "MINIBOARD W INNYM MIEJSCU",
      overlaySub: "PRZYPAL U KLIENTA",
      overlayColor: "#ffb45a",
      overlayFlash: "220,70,36",
      overlayBurst: ["#ff7a00", "#dc2626"],
      overlayTint: {
        dark: "18, 8, 6",
        mid: "220,90,40",
        edge: "90,22,14",
        core: "255,140,60",
      },
    },
    {
      key: "late_report",
      kind: "bad",
      name: "BRAK RAPORTÓW W TERMINIE",
      desc: "Raporty nie poszły na czas — overlay i −5 000 pkt, klient wydzwania",
      pts: -5000,
      w: 96,
      h: 92,
      weight: 6,
      minT: 7,
      effect: "penaltyOverlay",
      overlayTitle: "BRAK RAPORTÓW W TERMINIE",
      overlaySub: "KLIENT WYDZWANIA WKURZONY",
      overlayColor: "#f9a8d4",
      overlayFlash: "200,50,130",
      overlayBurst: ["#f472b6", "#7e22ce"],
      overlayTint: {
        dark: "16, 8, 22",
        mid: "168,50,140",
        edge: "70,16,48",
        core: "236,72,153",
      },
    },
    {
      key: "power",
      kind: "special",
      name: "BILLBOARD POWER",
      desc: "Billboard znajdzreklame.pl — +1000 i 2× punkty",
      pts: 1000,
      w: 170,
      h: 100,
      weight: 35,
      minT: 0,
      effect: "double",
      speed: 0.8,
    },
    {
      key: "glow",
      kind: "special",
      name: "CITYLIGHT BONUS",
      desc: "Świecący citylight — 2× punkty",
      pts: 150,
      w: 58,
      h: 108,
      weight: 30,
      minT: 0,
      effect: "double",
      speed: 0.85,
    },
    {
      key: "mega",
      kind: "special",
      name: "WIELKI FORMAT (+2K)",
      desc: "Ogromna plansza — +2000 pkt, szybka i chwiejna",
      pts: 2000,
      w: 230,
      h: 120,
      weight: 22,
      minT: 15,
      speed: 1.35,
      wobble: 70,
    },
    {
      key: "bus",
      kind: "special",
      name: "AUTOBUS",
      desc: "Oklejony autobus — MEGA BONUS +5000",
      pts: 5000,
      w: 210,
      h: 84,
      weight: 13,
      minT: 20,
      mover: true,
    },
    {
      key: "pu_heart",
      kind: "powerup",
      name: "SERCE",
      desc: "Dodatkowe życie (+1 serduszko, max 5)",
      pts: 0,
      w: 52,
      h: 52,
      weight: 18,
      minT: 6,
      effect: "heart",
    },
    {
      key: "pu_slowfall",
      kind: "powerup",
      name: "SPOWOLNIENIE",
      desc: "Wolniejsze opadanie reklam przez 8 s",
      pts: 0,
      w: 56,
      h: 56,
      weight: 16,
      minT: 8,
      effect: "slowFall",
      duration: 8,
    },
    {
      key: "pu_magnet",
      kind: "powerup",
      name: "SUPER ZASIĘG",
      desc: "Szersza strefa łapania przez 8 s",
      pts: 0,
      w: 58,
      h: 58,
      weight: 16,
      minT: 10,
      effect: "bigCatch",
      duration: 8,
    },
    {
      key: "pu_mini",
      kind: "powerup",
      name: "MINI AUTO",
      desc: "Mniejszy pojazd — łatwiej manewrować (8 s)",
      pts: 0,
      w: 54,
      h: 54,
      weight: 14,
      minT: 12,
      effect: "smallCar",
      duration: 8,
    },
    {
      key: "pu_pawel",
      kind: "powerup",
      name: "GŁOWA PAWŁA",
      desc: "Paweł zatrzymuje grę, podwyższa cele i krótko przyspiesza tempo",
      pts: 0,
      w: 68,
      h: 68,
      weight: 11,
      minT: 14,
      effect: "raiseGoals",
      duration: 7,
      speed: 0.92,
    },
    {
      key: "pu_roulette",
      kind: "powerup",
      name: "RULETKA",
      desc: "Zatrzymuje grę — losujesz życie, punkty albo modyfikator",
      pts: 0,
      w: 60,
      h: 60,
      weight: 10,
      minT: 12,
      effect: "roulette",
      duration: 0,
      speed: 0.9,
    },
  ];

  function mulberry(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const KNOWN_KEYS = new Set(CATALOG.map((c) => c.key));
  let disabled = [];

  function sanitizeDisabled(keys) {
    if (!Array.isArray(keys)) return [];
    const out = [];
    for (const raw of keys) {
      const key = String(raw || "").trim();
      if (!key || !KNOWN_KEYS.has(key) || out.includes(key)) continue;
      out.push(key);
    }
    return out;
  }
  function getDisabled() {
    return disabled.slice();
  }
  function setDisabled(keys) {
    disabled = sanitizeDisabled(keys);
    return getDisabled();
  }
  function isEnabled(key) {
    return !disabled.includes(key);
  }
  function toggle(key) {
    const d = getDisabled();
    const i = d.indexOf(key);
    if (i >= 0) d.splice(i, 1);
    else if (KNOWN_KEYS.has(key)) d.push(key);
    setDisabled(d);
    return isEnabled(key);
  }
  function enableAll() {
    setDisabled([]);
  }
  function disableKeys(keys) {
    setDisabled(keys);
  }

  /** Wspólny portret Pawła — jedno ładowanie dla gry i katalogu */
  let pawelHeadImage = null;
  let pawelHeadLoadDone = false;
  const pawelHeadReadyCbs = [];

  function onPawelHeadReady(fn) {
    if (pawelHeadLoadDone) fn(pawelHeadImage);
    else pawelHeadReadyCbs.push(fn);
  }
  function getPawelHeadImage() {
    return pawelHeadImage;
  }

  function finishPawelHeadLoad(img) {
    pawelHeadImage = img || null;
    pawelHeadLoadDone = true;
    const cbs = pawelHeadReadyCbs.splice(0);
    for (const fn of cbs) fn(pawelHeadImage);
  }

  function pawelHeadUrls() {
    const fromCatalog = /\/assets(\/|$)/.test(location.pathname);
    const rels = fromCatalog
      ? [
          "pawel-head.png",
          "pawel-head.jpg",
          "pawel-head.svg",
          "../assets/pawel-head.png",
          "../assets/pawel-head.jpg",
        ]
      : [
          "assets/pawel-head.png",
          "assets/pawel-head.jpg",
          "pawel-head.png",
          "pawel-head.jpg",
          "assets/pawel-head.svg",
          "pawel-head.svg",
        ];
    return rels.map((rel) => new URL(rel, document.baseURI).href);
  }

  function rasterizeSvgToBitmap(img, done) {
    const W = img.naturalWidth || 512;
    const H = img.naturalHeight || 512;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    c.getContext("2d").drawImage(img, 0, 0, W, H);
    const out = new Image();
    out.onload = () => done(out);
    out.onerror = () => done(img);
    try {
      out.src = c.toDataURL("image/png");
    } catch {
      done(img);
    }
  }

  function ensurePawelHeadLoaded() {
    if (pawelHeadLoadDone) return;
    if (ensurePawelHeadLoaded.started) return;
    ensurePawelHeadLoaded.started = true;
    const urls = pawelHeadUrls();
    let idx = 0;
    function tryNext() {
      if (idx >= urls.length) {
        finishPawelHeadLoad(null);
        return;
      }
      const url = urls[idx++];
      const img = new Image();
      img.onload = () => {
        if (!(img.naturalWidth > 0 && img.naturalHeight > 0)) {
          tryNext();
          return;
        }
        if (/\.svg(\?|$)/i.test(url))
          rasterizeSvgToBitmap(img, (bitmap) =>
            finishPawelHeadLoad(bitmap || img),
          );
        else finishPawelHeadLoad(img);
      };
      img.onerror = tryNext;
      img.src = url;
    }
    tryNext();
  }
  ensurePawelHeadLoaded();

  /** Tworzy silnik rysowania powiązany z kontekstem canvas gry */
  function createRenderer(ctx, drawLogo) {
    const noopLogo = (cx, cy, maxW, variant, maxH) => {
      ctx.font = `700 ${Math.min(14, maxW / 7)}px Rubik, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = variant === "white" ? "#fff" : "#394145";
      ctx.fillText(BRAND, cx, cy);
    };
    const logo = drawLogo || noopLogo;
    ensurePawelHeadLoaded();

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
    function fitText(str, x, y, maxW, size, color, opts = {}) {
      ctx.font = `${opts.weight || 900} ${size}px Rubik, system-ui, sans-serif`;
      const m = ctx.measureText(str).width;
      if (m > maxW) size = Math.max(6, (size * maxW) / m);
      text(str, x, y, size, color, opts);
    }

    const D = {};
    D.poster = (w, h, r) => {
      const c = POSTER_COLORS[Math.floor(r() * POSTER_COLORS.length)];
      fillRR(0, 0, w, h, 5, "#fff");
      fillRR(4, 4, w - 8, h - 8, 3, c);
      ctx.fillStyle = "rgba(255,255,255,.25)";
      ctx.fillRect(4, 4, w - 8, (h - 8) * 0.35);
      fitText(
        POSTER_WORDS[Math.floor(r() * POSTER_WORDS.length)],
        w / 2,
        h * 0.55,
        w - 14,
        16,
        "#fff",
      );
      ctx.fillStyle = "rgba(255,255,255,.7)";
      ctx.fillRect(10, h - 14, w - 20, 3);
      ctx.fillRect(14, h - 8, w - 28, 2);
    };
    D.super_umowa = (w, h, r, item) => {
      const glow = item ? 0.85 + 0.15 * Math.sin(item.age * 6) : 1;
      ctx.fillStyle = "rgba(15, 27, 61, .18)";
      fillRR(w * 0.08, h * 0.06, w * 0.9, h * 0.9, 4, "rgba(15, 27, 61, .16)");
      fillRR(w * 0.04, h * 0.03, w * 0.9, h * 0.9, 4, "#d6c49a");
      fillRR(0, 0, w * 0.92, h * 0.94, 4, "#f7f1e1");
      fillRR(0, 0, w * 0.92, h * 0.18, 4, "#0f766e");
      ctx.fillStyle = "#0f766e";
      ctx.fillRect(0, h * 0.12, w * 0.92, h * 0.08);
      ctx.shadowColor = "#fbbf24";
      ctx.shadowBlur = 10 * glow;
      fitText("SUPER", w * 0.46, h * 0.08, w * 0.8, 9, "#fde68a", {
        weight: 900,
      });
      ctx.shadowBlur = 0;
      fitText("UMOWA", w * 0.46, h * 0.155, w * 0.8, 11, "#fff", {
        weight: 900,
      });
      ctx.fillStyle = "#c4b48a";
      for (let i = 0; i < 5; i++)
        ctx.fillRect(
          w * 0.1,
          h * 0.28 + i * h * 0.07,
          w * (i === 3 ? 0.48 : 0.68),
          2.2,
        );
      ctx.strokeStyle = "#0f766e";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(w * 0.12, h * 0.72);
      ctx.lineTo(w * 0.5, h * 0.72);
      ctx.stroke();
      ctx.strokeStyle = "#1e3a8a";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(w * 0.14, h * 0.68);
      ctx.quadraticCurveTo(w * 0.22, h * 0.62, w * 0.28, h * 0.7);
      ctx.quadraticCurveTo(w * 0.36, h * 0.78, w * 0.46, h * 0.66);
      ctx.stroke();
      ctx.fillStyle = "#dc2626";
      ctx.beginPath();
      ctx.arc(w * 0.72, h * 0.78, w * 0.13, 0, 7);
      ctx.fill();
      ctx.strokeStyle = "#fde68a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(w * 0.72, h * 0.78, w * 0.1, 0, 7);
      ctx.stroke();
      fitText("OK", w * 0.72, h * 0.78, w * 0.18, 8, "#fff", { weight: 900 });
      ctx.fillStyle = `rgba(251, 191, 36, ${0.35 + 0.25 * glow})`;
      ctx.beginPath();
      ctx.arc(w * 0.16, h * 0.86, 3.2, 0, 7);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(w * 0.28, h * 0.86, 2.4, 0, 7);
      ctx.fill();
    };
    D.piwo = (w, h, r, item) => {
      const t = item ? item.age : 1.2;
      const foamPulse = 0.96 + 0.04 * Math.sin(t * 5);
      const mugX = w * 0.1;
      const mugW = w * 0.58;
      const mugTop = h * 0.3;
      const mugH = h * 0.64;
      const mugR = Math.min(7, mugW * 0.16);

      ctx.fillStyle = "rgba(24, 14, 6, .28)";
      ctx.beginPath();
      ctx.ellipse(w * 0.42, h * 0.95, w * 0.28, h * 0.05, 0, 0, 7);
      ctx.fill();

      ctx.strokeStyle = "#8aa3b4";
      ctx.lineWidth = Math.max(5, w * 0.1);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.ellipse(w * 0.76, h * 0.6, w * 0.16, h * 0.16, 0, -1.2, 1.2);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,.5)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(w * 0.74, h * 0.58, w * 0.11, h * 0.12, 0, -1.1, 0.2);
      ctx.stroke();

      const glass = ctx.createLinearGradient(mugX, 0, mugX + mugW, 0);
      glass.addColorStop(0, "#d7e6ef");
      glass.addColorStop(0.22, "#f4fafd");
      glass.addColorStop(0.55, "#c5d8e4");
      glass.addColorStop(1, "#9bb4c4");
      fillRR(mugX, mugTop, mugW, mugH, mugR, glass);
      ctx.strokeStyle = "rgba(90, 118, 136, .55)";
      ctx.lineWidth = 1.4;
      rrect(mugX, mugTop, mugW, mugH, mugR);
      ctx.stroke();

      const beerTop = mugTop + mugH * 0.1;
      const beer = ctx.createLinearGradient(0, beerTop, 0, mugTop + mugH);
      beer.addColorStop(0, "#ffe08a");
      beer.addColorStop(0.28, "#f5b942");
      beer.addColorStop(0.68, "#d97706");
      beer.addColorStop(1, "#92400e");
      ctx.save();
      rrect(mugX + 2, mugTop + 2, mugW - 4, mugH - 4, Math.max(2, mugR - 2));
      ctx.clip();
      ctx.fillStyle = beer;
      ctx.fillRect(mugX, beerTop, mugW, mugTop + mugH - beerTop);
      ctx.fillStyle = "rgba(255, 248, 220, .28)";
      [
        [0.24, 0.52, 1.8],
        [0.36, 0.66, 2.2],
        [0.5, 0.58, 1.5],
        [0.3, 0.78, 1.9],
        [0.54, 0.74, 1.4],
      ].forEach(([bx, by, br], i) => {
        const py = h * by - ((t * 10 + i * 7) % 14);
        if (py < beerTop + 6 || py > mugTop + mugH - 8) return;
        ctx.beginPath();
        ctx.arc(w * bx, py, br, 0, 7);
        ctx.fill();
      });
      ctx.restore();

      ctx.fillStyle = "rgba(255,255,255,.42)";
      ctx.fillRect(mugX + mugW * 0.14, mugTop + mugH * 0.28, mugW * 0.1, mugH * 0.48);

      const foam = [
        [mugX + mugW * 0.1, mugTop - 1, 8.2 * foamPulse, 6.6 * foamPulse, "#fff3d6"],
        [mugX + mugW * 0.4, mugTop - 6, 11.5 * foamPulse, 9.2 * foamPulse, "#fffaf0"],
        [mugX + mugW * 0.72, mugTop - 4, 10.2 * foamPulse, 8.2 * foamPulse, "#fff6e4"],
        [mugX + mugW * 0.96, mugTop + 1, 7.2 * foamPulse, 6.2 * foamPulse, "#fff3d6"],
        [mugX + mugW * 0.52, mugTop + 5, 12, 5.2, "#fffaf0"],
      ];
      foam.forEach(([x, y, rx, ry, color]) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, 0, 0, 7);
        ctx.fill();
      });
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.ellipse(mugX + mugW * 0.34, mugTop - 8, 5.4, 4.2, 0, 0, 7);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(mugX + mugW * 0.62, mugTop - 7, 4.2, 3.4, 0, 0, 7);
      ctx.fill();
      ctx.fillStyle = "#fff6e0";
      ctx.beginPath();
      ctx.ellipse(mugX - 1.5, mugTop + 9, 3.4, 5.6, 0.15, 0, 7);
      ctx.fill();
    };
    D.citylight = (w, h, r, item) => {
      fillRR(0, 0, w, h, 6, "#2b3350");
      const g = ctx.createLinearGradient(0, 0, 0, h);
      const c = POSTER_COLORS[Math.floor(r() * POSTER_COLORS.length)];
      g.addColorStop(0, "#ffffff");
      g.addColorStop(1, c);
      fillRR(5, 5, w - 10, h - 22, 3, g);
      ctx.fillStyle = "rgba(255,255,255,.5)";
      ctx.fillRect(9, 9, 5, h - 30);
      fitText("CITY", w / 2, h * 0.36, w - 14, 12, c, { weight: 900 });
      fitText("LIGHT", w / 2, h * 0.52, w - 14, 12, "#0f1b3d");
      ctx.fillStyle = "#1a2038";
      ctx.fillRect(w * 0.2, h - 14, w * 0.6, 14);
      if (item && item.glow) {
        ctx.fillStyle = `rgba(255,255,200,${0.25 + 0.2 * Math.sin(item.age * 8)})`;
        ctx.fillRect(5, 5, w - 10, h - 22);
      }
    };
    D.billboard = (w, h, r) => {
      const brand = r() < 0.3;
      const legH = h * 0.22;
      ctx.fillStyle = "#4a5068";
      ctx.fillRect(w * 0.2, h - legH, 6, legH);
      ctx.fillRect(w * 0.8 - 6, h - legH, 6, legH);
      fillRR(0, 0, w, h - legH, 4, "#e8ecf5");
      const c = brand
        ? "#ff7a00"
        : POSTER_COLORS[Math.floor(r() * POSTER_COLORS.length)];
      fillRR(4, 4, w - 8, h - legH - 8, 2, c);
      if (brand) {
        fillRR(8, 8, w - 16, (h - legH) * 0.52, 3, "#fff");
        logo(w / 2, (h - legH) * 0.34, w - 24, "default", (h - legH) * 0.38);
        fitText(
          "BILLBOARDY • CITYLIGHTY",
          w / 2,
          (h - legH) * 0.78,
          w - 22,
          8,
          "rgba(255,255,255,.9)",
          { weight: 700 },
        );
      } else {
        ctx.fillStyle = "rgba(255,255,255,.28)";
        ctx.beginPath();
        ctx.arc(w * 0.25, (h - legH) * 0.5, (h - legH) * 0.28, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.fillRect(w * 0.45, (h - legH) * 0.32, w * 0.42, 6);
        ctx.fillRect(w * 0.45, (h - legH) * 0.52, w * 0.32, 5);
        fitText(
          POSTER_WORDS[Math.floor(r() * POSTER_WORDS.length)],
          w * 0.66,
          (h - legH) * 0.75,
          w * 0.4,
          10,
          "#fff",
        );
      }
    };
    D.billboard_12m = (w, h, r) => {
      const faceH = Math.round(w / 2.1176);
      const yokeY = faceH;
      const cx = w / 2;

      ctx.fillStyle = "#5d6578";
      ctx.beginPath();
      ctx.moveTo(cx - 5, yokeY + 2);
      ctx.lineTo(cx + 5, yokeY + 2);
      ctx.lineTo(cx + 8, h - 5);
      ctx.lineTo(cx - 8, h - 5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.2)";
      ctx.fillRect(cx - 2, yokeY + 6, 2, h - yokeY - 14);
      ctx.fillStyle = "#3f4554";
      ctx.fillRect(cx - 11, h - 5, 22, 5);

      fillRR(w * 0.18, yokeY, w * 0.64, 4, 1, "#8b93a6");
      ctx.strokeStyle = "#7a8294";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(cx, yokeY + 14);
      ctx.lineTo(w * 0.2, yokeY + 1);
      ctx.moveTo(cx, yokeY + 14);
      ctx.lineTo(w * 0.8, yokeY + 1);
      ctx.stroke();

      fillRR(0, 0, w, faceH, 2, "#b8becc");
      const c = POSTER_COLORS[Math.floor(r() * POSTER_COLORS.length)];
      fillRR(3, 3, w - 6, faceH - 6, 1, c);
      ctx.fillStyle = "rgba(255,255,255,.22)";
      ctx.fillRect(7, 7, w * 0.36, faceH - 14);
      ctx.fillStyle = "#fff";
      ctx.fillRect(w * 0.48, faceH * 0.28, w * 0.42, 6);
      ctx.fillRect(w * 0.48, faceH * 0.46, w * 0.3, 4);
      fitText(
        POSTER_WORDS[Math.floor(r() * POSTER_WORDS.length)],
        w * 0.7,
        faceH * 0.72,
        w * 0.4,
        12,
        "#fff",
      );
    };
    D.format = (w, h, r) => {
      const c1 = POSTER_COLORS[Math.floor(r() * POSTER_COLORS.length)];
      const c2 = POSTER_COLORS[Math.floor(r() * POSTER_COLORS.length)];
      fillRR(0, 0, w, h, 3, "#1c2238");
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, c1);
      g.addColorStop(1, c2);
      fillRR(5, 5, w - 10, h - 10, 2, g);
      ctx.strokeStyle = "rgba(255,255,255,.18)";
      ctx.lineWidth = 1;
      for (let x = 5; x < w - 5; x += 12) {
        ctx.beginPath();
        ctx.moveTo(x, 5);
        ctx.lineTo(x, h - 5);
        ctx.stroke();
      }
      for (let y = 5; y < h - 5; y += 12) {
        ctx.beginPath();
        ctx.moveTo(5, y);
        ctx.lineTo(w - 5, y);
        ctx.stroke();
      }
      fitText("WIELKI FORMAT", w / 2, h * 0.45, w - 24, 20, "#fff", {
        stroke: "rgba(0,0,0,.3)",
        lw: 5,
      });
      fitText(
        "reklama na elewacji",
        w / 2,
        h * 0.72,
        w - 24,
        10,
        "rgba(255,255,255,.9)",
        { weight: 700 },
      );
      ctx.fillStyle = "#cfd6e6";
      [
        [8, 8],
        [w - 12, 8],
        [8, h - 12],
        [w - 12, h - 12],
      ].forEach(([x, y]) => ctx.fillRect(x, y, 4, 4));
    };
    D.paczkomat = (w, h, r) => {
      fillRR(0, 0, w, h, 5, "#ffcc00");
      fillRR(2, 2, w - 4, h - 4, 4, "#ffd633");
      const slotH = (h - 16) / 3.4;
      for (let row = 0; row < 3; row++) {
        const sy = 10 + row * slotH;
        fillRR(6, sy, w - 12, slotH - 4, 2, "#f5d020");
        ctx.fillStyle = "#c9a000";
        ctx.fillRect(w - 14, sy + 4, 4, slotH - 10);
        ctx.strokeStyle = "rgba(0,0,0,.12)";
        ctx.lineWidth = 1;
        ctx.strokeRect(6.5, sy + 0.5, w - 13, slotH - 5);
        ctx.fillStyle = "#e6b800";
      }
      fillRR(5, 5, w - 10, h * 0.28, 2, "#1a2038");
      const c = POSTER_COLORS[Math.floor(r() * POSTER_COLORS.length)];
      fillRR(7, 7, w - 14, h * 0.24, 2, c);
      fitText(
        POSTER_WORDS[Math.floor(r() * POSTER_WORDS.length)],
        w / 2,
        h * 0.17,
        w - 16,
        9,
        "#fff",
        { weight: 900 },
      );
      ctx.fillStyle = "rgba(255,255,255,.35)";
      ctx.fillRect(8, 8, 4, h * 0.2);
      fillRR(4, h - 14, w - 8, 10, 2, "#1a1a1a");
      fitText("PACZKOMAT", w / 2, h - 9, w - 12, 6, "#ffcc00", { weight: 900 });
    };
    D.dooh = (w, h, r, item) => {
      ctx.fillStyle = "#3a4060";
      ctx.fillRect(w * 0.46, h * 0.72, w * 0.08, h * 0.28);
      fillRR(0, 0, w, h * 0.72, 4, "#1c2238");
      fillRR(4, 4, w - 8, h * 0.64, 3, "#0a0e18");
      const c1 = POSTER_COLORS[Math.floor(r() * POSTER_COLORS.length)];
      const c2 = POSTER_COLORS[Math.floor(r() * POSTER_COLORS.length)];
      const pulse = item ? 0.55 + 0.45 * Math.sin(item.age * 5) : 0.75;
      ctx.globalAlpha = pulse;
      const g = ctx.createLinearGradient(0, 0, w, h * 0.55);
      g.addColorStop(0, c1);
      g.addColorStop(1, c2);
      fillRR(8, 8, w - 16, h * 0.48, 2, g);
      ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(0,0,0,.18)";
      for (let y = 8; y < h * 0.56; y += 3) ctx.fillRect(8, y, w - 16, 1);
      ctx.fillStyle = "rgba(255,255,255,.12)";
      for (let x = 10; x < w - 10; x += 6)
        for (let y = 10; y < h * 0.52; y += 6) {
          if (Math.floor((x + y) / 6 + (item?.age || 0) * 3) % 3 === 0)
            ctx.fillRect(x, y, 2, 2);
        }
      fitText("DOOH", w / 2, h * 0.34, w - 20, 16, "#fff", {
        stroke: "rgba(0,0,0,.45)",
        lw: 4,
      });
      fitText(
        "DIGITAL OOH",
        w / 2,
        h * 0.5,
        w - 20,
        7,
        "rgba(255,255,255,.92)",
        { weight: 700 },
      );
      if (item) {
        ctx.fillStyle = `rgba(100,200,255,${0.1 + 0.08 * Math.sin(item.age * 6)})`;
        fillRR(
          2,
          2,
          w - 4,
          h * 0.68,
          3,
          `rgba(100,200,255,${0.08 + 0.06 * Math.sin(item.age * 6)})`,
        );
      }
      ctx.fillStyle = "#6b7280";
      ctx.fillRect(w * 0.2, h * 0.72, w * 0.6, 3);
    };
    D.nowy_dostawca = (w, h, r, item) => {
      const glow = item ? 0.85 + 0.15 * Math.sin(item.age * 5) : 1;
      fillRR(w * 0.08, h * 0.62, w * 0.84, h * 0.34, 6, "#0f766e");
      fillRR(w * 0.22, h * 0.06, w * 0.56, h * 0.3, 10, "#fde68a");
      ctx.fillStyle = "#1c1e26";
      ctx.beginPath();
      ctx.arc(w * 0.38, h * 0.18, 2.6, 0, 7);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(w * 0.62, h * 0.18, 2.6, 0, 7);
      ctx.fill();
      ctx.strokeStyle = "#0f766e";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.24, 8, 0.2, Math.PI - 0.2);
      ctx.stroke();
      fillRR(w * 0.16, h * 0.34, w * 0.68, h * 0.36, 6, "#14b8a6");
      fillRR(w * 0.02, h * 0.46, w * 0.2, h * 0.16, 3, "#0f766e");
      fillRR(w * 0.78, h * 0.46, w * 0.2, h * 0.16, 3, "#0f766e");
      fillRR(w * 0.02, h * 0.48, w * 0.16, h * 0.1, 2, "#99f6e4");
      fillRR(w * 0.82, h * 0.48, w * 0.16, h * 0.1, 2, "#99f6e4");
      ctx.shadowColor = "#fbbf24";
      ctx.shadowBlur = 8 * glow;
      fillRR(w * 0.28, h * 0.66, w * 0.44, h * 0.16, 4, "#fde68a");
      ctx.shadowBlur = 0;
      fitText("NOWY", w / 2, h * 0.74, w * 0.4, 9, "#0f766e", { weight: 900 });
      fitText("DOSTAWCA", w / 2, h * 0.9, w - 8, 7, "#ecfdf5", { weight: 900 });
    };
    D.plus_500 = (w, h, r, item) => {
      const t = item ? item.age : 1.2;
      const pulse = 0.92 + 0.08 * Math.sin(t * 7);
      const cx = w / 2;
      const cy = h / 2;
      const rad = (Math.min(w, h) / 2) * pulse;
      ctx.shadowColor = "#fbbf24";
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, 7);
      ctx.fillStyle = "#f59e0b";
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(cx, cy, rad * 0.82, 0, 7);
      ctx.fillStyle = "#fde68a";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy, rad * 0.7, 0, 7);
      ctx.fillStyle = "#f59e0b";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.55)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, rad * 0.7, -0.8, 0.6);
      ctx.stroke();
      fitText("+500", cx, cy - 1, rad * 1.35, 16, "#fff", {
        weight: 900,
        stroke: "rgba(146,64,14,.55)",
        lw: 4,
      });
      fitText("PKT", cx, cy + rad * 0.38, rad * 0.7, 8, "#fff7ed", {
        weight: 900,
      });
      ctx.fillStyle = `rgba(255,255,255,${0.45 + 0.35 * Math.sin(t * 8)})`;
      [
        [0.18, 0.22, 2.2],
        [0.82, 0.18, 1.8],
        [0.86, 0.72, 2],
        [0.16, 0.78, 1.6],
      ].forEach(([sx, sy, sr]) => {
        ctx.beginPath();
        ctx.arc(w * sx, h * sy, sr, 0, 7);
        ctx.fill();
      });
    };
    D.nowe_billboardy = (w, h, r, item) => {
      const t = item ? item.age : 1.2;
      fillRR(0, 0, w, h, 6, "#1c2238");
      fillRR(4, 4, w - 8, h * 0.22, 4, "#0f766e");
      fitText("BAZA", w / 2, h * 0.15, w - 16, 11, "#ecfdf5", { weight: 900 });

      const c1 = POSTER_COLORS[Math.floor(r() * POSTER_COLORS.length)];
      const c2 = POSTER_COLORS[Math.floor(r() * POSTER_COLORS.length)];
      const boards = [
        [w * 0.08, h * 0.34, w * 0.4, h * 0.28, c1],
        [w * 0.52, h * 0.34, w * 0.4, h * 0.28, c2],
      ];
      boards.forEach(([bx, by, bw, bh, col]) => {
        ctx.fillStyle = "#4a5068";
        ctx.fillRect(bx + bw * 0.18, by + bh, 4, h * 0.08);
        ctx.fillRect(bx + bw * 0.72, by + bh, 4, h * 0.08);
        fillRR(bx, by, bw, bh, 2, "#e8ecf5");
        fillRR(bx + 3, by + 3, bw - 6, bh - 6, 1, col);
        ctx.fillStyle = "rgba(255,255,255,.28)";
        ctx.fillRect(bx + 6, by + 6, bw * 0.32, bh - 12);
      });

      const plusY = h * 0.78 + 1.5 * Math.sin(t * 6);
      fillRR(w * 0.18, plusY - 8, w * 0.64, 18, 4, "#22e07a");
      fitText("+ NOWE BB", w / 2, plusY + 1, w * 0.58, 9, "#052e16", {
        weight: 900,
      });
      ctx.fillStyle = `rgba(34, 224, 122, ${0.25 + 0.2 * Math.sin(t * 5)})`;
      ctx.beginPath();
      ctx.arc(w * 0.12, h * 0.16, 3, 0, 7);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(w * 0.88, h * 0.16, 3, 0, 7);
      ctx.fill();
    };
    D.broken = (w, h) => {
      const legH = h * 0.2;
      ctx.fillStyle = "#4a5068";
      ctx.fillRect(w * 0.2, h - legH, 6, legH);
      ctx.save();
      ctx.translate(w * 0.8, h - legH);
      ctx.rotate(0.6);
      ctx.fillRect(-3, 0, 6, legH);
      ctx.restore();
      fillRR(0, 0, w, h - legH, 3, "#9aa0b3");
      ctx.fillStyle = "#c7c2b1";
      ctx.fillRect(4, 4, w - 8, h - legH - 8);
      ctx.fillStyle = "#6d6a72";
      ctx.beginPath();
      ctx.moveTo(w * 0.55, 4);
      ctx.lineTo(w - 4, 4);
      ctx.lineTo(w - 4, h - legH - 4);
      ctx.lineTo(w * 0.7, h - legH - 4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#2b2b33";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w * 0.3, 6);
      ctx.lineTo(w * 0.42, h * 0.3);
      ctx.lineTo(w * 0.34, h * 0.5);
      ctx.lineTo(w * 0.5, h - legH - 6);
      ctx.stroke();
    };
    D.peel_poster = (w, h, r, item) => {
      const peel = item ? 0.78 + 0.08 * Math.sin(item.age * 3.2) : 0.82;
      const c = POSTER_COLORS[Math.floor(r() * POSTER_COLORS.length)];
      const word = POSTER_WORDS[Math.floor(r() * POSTER_WORDS.length)];
      const legH = h * 0.2;
      ctx.fillStyle = "#4a5068";
      ctx.fillRect(w * 0.18, h - legH, 6, legH);
      ctx.fillRect(w * 0.82 - 6, h - legH, 6, legH);
      fillRR(0, 0, w, h - legH, 4, "#c5c9d6");
      fillRR(5, 5, w - 10, h - legH - 10, 2, "#9aa0b3");
      fillRR(5, 5, w * 0.62, h - legH - 10, 2, c);
      ctx.fillStyle = "rgba(255,255,255,.28)";
      ctx.fillRect(8, 8, w * 0.28, (h - legH) * 0.35);
      fitText(word, w * 0.34, (h - legH) * 0.42, w * 0.5, 14, "#fff", {
        weight: 900,
      });

      ctx.save();
      ctx.translate(w * 0.58, 8);
      ctx.rotate(0.18 * peel);
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(w * 0.38, 0);
      ctx.lineTo(w * 0.38, (h - legH) * 0.72 * peel);
      ctx.quadraticCurveTo(
        w * 0.18,
        (h - legH) * 0.88 * peel,
        0,
        (h - legH) * 0.55 * peel,
      );
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.22)";
      ctx.beginPath();
      ctx.moveTo(4, 4);
      ctx.lineTo(w * 0.22, 6);
      ctx.lineTo(w * 0.18, (h - legH) * 0.28);
      ctx.lineTo(6, (h - legH) * 0.22);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(255,248,230,.9)";
      ctx.beginPath();
      ctx.moveTo(0, (h - legH) * 0.55 * peel);
      ctx.quadraticCurveTo(
        w * 0.16,
        (h - legH) * 0.72 * peel,
        w * 0.28,
        (h - legH) * 0.5 * peel,
      );
      ctx.quadraticCurveTo(
        w * 0.12,
        (h - legH) * 0.42 * peel,
        0,
        (h - legH) * 0.38 * peel,
      );
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      ctx.strokeStyle = "rgba(30, 20, 16, .45)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(w * 0.58, 8);
      ctx.quadraticCurveTo(w * 0.72, h * 0.28, w * 0.62, h * 0.48);
      ctx.stroke();

      fillRR(w * 0.06, h - legH - 16, w * 0.5, 13, 3, "rgba(127, 29, 29, .92)");
      fitText("ODKLEJA SIĘ", w * 0.31, h - legH - 9, w * 0.46, 7, "#fecaca", {
        weight: 900,
      });
    };
    D.dead_light = (w, h, r, item) => {
      const flicker = item
        ? Math.sin(item.age * 21) > 0.82
          ? 0.22
          : 0.04
        : 0.08;
      fillRR(0, 0, w, h, 6, "#1c2030");
      fillRR(3, 3, w - 6, h - 20, 4, "#12141c");
      const c = POSTER_COLORS[Math.floor(r() * POSTER_COLORS.length)];
      ctx.globalAlpha = 0.22 + flicker;
      fillRR(6, 6, w - 12, h - 28, 3, c);
      ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(0,0,0,.55)";
      ctx.fillRect(6, 6, w - 12, h - 28);
      ctx.fillStyle = "rgba(255,255,255,.06)";
      ctx.fillRect(8, 8, 4, h - 34);
      fitText("CITY", w / 2, h * 0.34, w - 14, 11, "#4b5563", { weight: 900 });
      fitText("LIGHT", w / 2, h * 0.48, w - 14, 11, "#374151");

      for (let i = 0; i < 3; i++) {
        const bx = w * 0.22 + i * w * 0.28;
        ctx.fillStyle = i === 1 && flicker > 0.15 ? "#fde68a" : "#2a2e3a";
        ctx.beginPath();
        ctx.arc(bx, 11, 3.2, 0, 7);
        ctx.fill();
        if (i !== 1 || flicker <= 0.15) {
          ctx.strokeStyle = "#6b7280";
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.moveTo(bx - 2.4, 8.6);
          ctx.lineTo(bx + 2.4, 13.4);
          ctx.stroke();
        }
      }

      ctx.strokeStyle = `rgba(250, 204, 21, ${0.15 + flicker})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(w * 0.72, h * 0.18);
      ctx.lineTo(w * 0.62, h * 0.32);
      ctx.lineTo(w * 0.7, h * 0.32);
      ctx.lineTo(w * 0.58, h * 0.48);
      ctx.stroke();

      ctx.fillStyle = "#111318";
      ctx.fillRect(w * 0.18, h - 14, w * 0.64, 14);
      fillRR(w * 0.08, h * 0.62, w * 0.84, 16, 3, "rgba(127, 29, 29, .92)");
      fitText("BRAK ŚWIATŁA", w / 2, h * 0.7, w * 0.78, 6, "#fecaca", {
        weight: 900,
      });
    };
    D.faktura = (w, h) => {
      fillRR(0, 0, w, h, 3, "#f4f6fb");
      ctx.fillStyle = "#d1d5db";
      ctx.fillRect(0, 0, w, 6);
      ctx.fillStyle = "#9ca3af";
      for (let y = 14; y < h - 10; y += 9)
        ctx.fillRect(8, y, w - (y % 18 === 0 ? 22 : 14), 3);
      fillRR(w * 0.08, h * 0.12, w * 0.84, h * 0.22, 2, "#fee2e2");
      fitText("FAKTURA", w / 2, h * 0.2, w - 12, 8, "#991b1b", { weight: 900 });
      ctx.save();
      ctx.translate(w / 2, h * 0.72);
      ctx.rotate(-0.18);
      ctx.strokeStyle = "#dc2626";
      ctx.lineWidth = 2;
      ctx.strokeRect(-w * 0.38, -h * 0.1, w * 0.76, h * 0.2);
      fitText("NIEZAPŁACONA", 0, 0, w * 0.72, 7, "#dc2626", { weight: 900 });
      ctx.restore();
      fitText("TERMIN!", w / 2, h * 0.48, w - 10, 7, "#374151", {
        weight: 700,
      });
    };
    D.klient = (w, h) => {
      fillRR(w * 0.22, h * 0.08, w * 0.56, h * 0.28, 8, "#fca5a5");
      ctx.fillStyle = "#1c1e26";
      ctx.beginPath();
      ctx.arc(w * 0.36, h * 0.2, 3, 0, 7);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(w * 0.64, h * 0.2, 3, 0, 7);
      ctx.fill();
      ctx.strokeStyle = "#991b1b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w * 0.32, h * 0.28);
      ctx.lineTo(w * 0.42, h * 0.26);
      ctx.moveTo(w * 0.58, h * 0.26);
      ctx.lineTo(w * 0.68, h * 0.28);
      ctx.stroke();
      fillRR(w * 0.18, h * 0.36, w * 0.64, h * 0.48, 6, "#3b82f6");
      fillRR(w * 0.04, h * 0.52, w * 0.18, h * 0.22, 3, "#1e40af");
      fillRR(w * 0.04, h * 0.52, w * 0.14, h * 0.16, 2, "#93c5fd");
      fitText("!!!", w * 0.78, h * 0.18, w * 0.28, 12, "#dc2626", {
        weight: 900,
      });
      fillRR(w * 0.68, h * 0.08, w * 0.28, h * 0.18, 4, "#fff");
      fitText("?!", w * 0.82, h * 0.17, w * 0.2, 9, "#dc2626", { weight: 900 });
      fitText("KLIENT", w / 2, h * 0.92, w - 8, 6, "#1e3a8a", { weight: 900 });
    };
    D.broken_format = (w, h, r) => {
      const c1 = POSTER_COLORS[Math.floor(r() * POSTER_COLORS.length)];
      fillRR(0, 0, w, h, 3, "#1c2238");
      fillRR(5, 5, w - 10, h - 10, 2, c1);
      ctx.strokeStyle = "rgba(255,255,255,.15)";
      ctx.lineWidth = 1;
      for (let x = 5; x < w - 5; x += 10) {
        ctx.beginPath();
        ctx.moveTo(x, 5);
        ctx.lineTo(x, h - 5);
        ctx.stroke();
      }
      for (let y = 5; y < h - 5; y += 10) {
        ctx.beginPath();
        ctx.moveTo(5, y);
        ctx.lineTo(w - 5, y);
        ctx.stroke();
      }
      ctx.fillStyle = "#6d6a72";
      ctx.beginPath();
      ctx.moveTo(w * 0.45, 5);
      ctx.lineTo(w - 5, 5);
      ctx.lineTo(w - 5, h * 0.55);
      ctx.lineTo(w * 0.62, h - 5);
      ctx.lineTo(w * 0.35, h - 5);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#2b2b33";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w * 0.28, 8);
      ctx.lineTo(w * 0.38, h * 0.35);
      ctx.lineTo(w * 0.32, h * 0.58);
      ctx.lineTo(w * 0.48, h - 8);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(w * 0.55, 12);
      ctx.lineTo(w * 0.62, h * 0.42);
      ctx.stroke();
      fitText("ZNISZCZONY", w * 0.38, h * 0.42, w * 0.62, 13, "#fff", {
        stroke: "rgba(0,0,0,.4)",
        lw: 4,
      });
      fitText(
        "WIELKI FORMAT",
        w * 0.38,
        h * 0.62,
        w * 0.55,
        9,
        "rgba(255,255,255,.9)",
        { weight: 700 },
      );
      fillRR(w * 0.04, h - 14, w * 0.28, 12, 2, "rgba(220,38,38,.9)");
      fitText("-2 ŻYCIA", w * 0.18, h - 8, w * 0.24, 6, "#fff", {
        weight: 900,
      });
    };
    D.power = (w, h, r, item) => {
      const legH = h * 0.2;
      ctx.fillStyle = "#4a5068";
      ctx.fillRect(w * 0.15, h - legH, 8, legH);
      ctx.fillRect(w * 0.85 - 8, h - legH, 8, legH);
      fillRR(0, 0, w, h - legH, 6, "#fff");
      const g = ctx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, "#ff7a00");
      g.addColorStop(1, "#ffb703");
      fillRR(5, 5, w - 10, h - legH - 10, 4, g);
      fillRR(12, 12, w - 24, (h - legH) * 0.48, 4, "#fff");
      logo(w / 2, (h - legH) * 0.36, w - 36, "default", (h - legH) * 0.34);
      fitText(
        "BILLBOARD POWER  •  2x PUNKTY",
        w / 2,
        (h - legH) * 0.74,
        w - 30,
        10,
        "#0f1b3d",
        { weight: 900 },
      );
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle =
          (Math.floor((item?.age || 0) * 6) + i) % 2 ? "#fff" : "#ffd166";
        ctx.beginPath();
        ctx.arc(14 + (i * (w - 28)) / 5, -4, 3, 0, 7);
        ctx.fill();
      }
    };
    D.glow = (w, h, r, item) => {
      item = item || { glow: true, age: 0 };
      item.glow = true;
      D.citylight(w, h, r, item);
      fitText("2x", w / 2, h * 0.7, w - 16, 20, "#ff7a00", {
        stroke: "#fff",
        lw: 4,
      });
    };
    D.mega = (w, h, r) => {
      D.format(w, h, r);
      fillRR(w * 0.5 - 44, h * 0.5 - 14, 88, 28, 6, "rgba(15,27,61,.85)");
      text("+2000", w / 2, h * 0.5 + 1, 18, "#ffd166");
    };
    D.bus = (w, h) => {
      ctx.fillStyle = "#1c1e26";
      [w * 0.2, w * 0.8].forEach((x) => {
        ctx.beginPath();
        ctx.arc(x, h - 9, 11, 0, 7);
        ctx.fill();
      });
      fillRR(0, 0, w, h - 14, 10, "#ff7a00");
      const g = ctx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, "#ffb703");
      g.addColorStop(1, "#ff4d00");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, h * 0.55);
      ctx.lineTo(w, h * 0.3);
      ctx.lineTo(w, h - 14);
      ctx.lineTo(0, h - 14);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#9fd8ff";
      for (let i = 0; i < 5; i++)
        fillRR(
          10 + (i * (w - 20)) / 5,
          8,
          (w - 20) / 5 - 6,
          h * 0.32,
          3,
          "#a9dcff",
        );
      fillRR(8, h * 0.52, w - 16, h * 0.34, 4, "#fff");
      logo(w / 2, h * 0.69, w - 28, "default", h * 0.22);
    };

    function drawHeartIcon(cx, cy, s, color) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(cx, cy + s * 0.35);
      ctx.bezierCurveTo(cx, cy, cx - s * 0.5, cy, cx - s * 0.5, cy + s * 0.3);
      ctx.bezierCurveTo(
        cx - s * 0.5,
        cy + s * 0.6,
        cx,
        cy + s * 0.8,
        cx,
        cy + s,
      );
      ctx.bezierCurveTo(
        cx,
        cy + s * 0.8,
        cx + s * 0.5,
        cy + s * 0.6,
        cx + s * 0.5,
        cy + s * 0.3,
      );
      ctx.bezierCurveTo(cx + s * 0.5, cy, cx, cy, cx, cy + s * 0.35);
      ctx.fill();
    }

    function puBubble(w, h, c1, c2, label) {
      const g = ctx.createRadialGradient(
        w * 0.35,
        h * 0.3,
        2,
        w / 2,
        h / 2,
        w * 0.55,
      );
      g.addColorStop(0, c1);
      g.addColorStop(1, c2);
      fillRR(2, 2, w - 4, h - 4, 14, g);
      ctx.strokeStyle = "rgba(255,255,255,.55)";
      ctx.lineWidth = 2;
      rrect(2, 2, w - 4, h - 4, 14);
      ctx.stroke();
      fitText(label, w / 2, h - 9, w - 10, 7, "#fff", {
        weight: 900,
        stroke: "rgba(0,0,0,.35)",
        lw: 3,
      });
    }

    D.zurek = (w, h, r, item) => {
      const pulse = item ? 0.82 + 0.18 * Math.sin(item.age * 4.2) : 1;
      ctx.fillStyle = "rgba(12,10,6,.32)";
      ctx.beginPath();
      ctx.ellipse(w / 2, h * 0.86, w * 0.4, h * 0.1, 0, 0, 7);
      ctx.fill();

      ctx.fillStyle = "#e6dcc4";
      ctx.beginPath();
      ctx.ellipse(w / 2, h * 0.56, w * 0.48, h * 0.36, 0, 0, 7);
      ctx.fill();
      ctx.strokeStyle = "#8a7a58";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(w / 2, h * 0.56, w * 0.48, h * 0.36, 0, 0, 7);
      ctx.stroke();
      ctx.strokeStyle = "#cfc3a6";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(w / 2, h * 0.56, w * 0.42, h * 0.3, 0, 0, 7);
      ctx.stroke();

      const soup = ctx.createRadialGradient(
        w * 0.38,
        h * 0.46,
        4,
        w / 2,
        h * 0.58,
        w * 0.34,
      );
      soup.addColorStop(0, "#c4c24a");
      soup.addColorStop(0.35, "#7a6a24");
      soup.addColorStop(0.75, "#4a3e14");
      soup.addColorStop(1, "#241c0a");
      ctx.fillStyle = soup;
      ctx.beginPath();
      ctx.ellipse(w / 2, h * 0.57, w * 0.36, h * 0.24, 0, 0, 7);
      ctx.fill();

      ctx.fillStyle = "rgba(58, 120, 48, .82)";
      ctx.beginPath();
      ctx.ellipse(w * 0.34, h * 0.52, 10, 6, 0.45, 0, 7);
      ctx.fill();
      ctx.fillStyle = "rgba(32, 86, 70, .78)";
      ctx.beginPath();
      ctx.ellipse(w * 0.66, h * 0.62, 8, 5, -0.5, 0, 7);
      ctx.fill();
      ctx.fillStyle = "rgba(110, 80, 28, .55)";
      ctx.beginPath();
      ctx.ellipse(w * 0.52, h * 0.5, 7, 4, 0.2, 0, 7);
      ctx.fill();

      ctx.fillStyle = "rgba(230, 230, 150, .5)";
      [
        [0.28, 0.52, 3.2],
        [0.72, 0.54, 2.6],
        [0.46, 0.66, 3],
        [0.6, 0.48, 2.2],
      ].forEach(([bx, by, br]) => {
        ctx.beginPath();
        ctx.arc(w * bx, h * by, br, 0, 7);
        ctx.fill();
      });

      ctx.strokeStyle = "rgba(70, 48, 24, .7)";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(w * 0.12, h * 0.42);
      ctx.lineTo(w * 0.22, h * 0.52);
      ctx.lineTo(w * 0.16, h * 0.66);
      ctx.stroke();

      ctx.fillStyle = "#b8b0a0";
      ctx.save();
      ctx.translate(w * 0.78, h * 0.34);
      ctx.rotate(-0.7);
      fillRR(-3, 0, 7, h * 0.34, 3, "#cfc8b8");
      fillRR(-7, -6, 14, 10, 5, "#ddd6c6");
      ctx.restore();

      ctx.strokeStyle = `rgba(170, 190, 50, ${0.35 + 0.3 * pulse})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w * 0.22, h * 0.16);
      ctx.quadraticCurveTo(w * 0.16, h * 0.04, w * 0.28, 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(w * 0.74, h * 0.14);
      ctx.quadraticCurveTo(w * 0.82, h * 0.02, w * 0.7, 1);
      ctx.stroke();

      const flyT = item ? item.age : 1;
      [
        [0.18, 0.18, 7],
        [0.84, 0.16, 5.5],
        [0.7, 0.28, 6.2],
        [0.32, 0.08, 8.1],
        [0.58, 0.12, 6.8],
        [0.08, 0.32, 4.9],
        [0.92, 0.34, 7.4],
        [0.46, 0.22, 9.2],
      ].forEach(([fx, fy, fa]) => {
        const px = w * fx + Math.sin(flyT * fa) * 5;
        const py = h * fy + Math.cos(flyT * (fa + 1.3)) * 3.5;
        ctx.fillStyle = "#16140f";
        ctx.beginPath();
        ctx.arc(px, py, 2.1, 0, 7);
        ctx.fill();
        ctx.fillStyle = "rgba(220,220,220,.55)";
        ctx.beginPath();
        ctx.ellipse(px - 2.8, py - 0.5, 3, 1.3, -0.4, 0, 7);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(px + 2.8, py - 0.5, 3, 1.3, 0.4, 0, 7);
        ctx.fill();
      });

      fitText("ŻUREK", w / 2, h * 0.56, w * 0.62, 16, "#f4edd0", {
        weight: 900,
        stroke: "rgba(24,16,4,.75)",
        lw: 4,
      });
      ctx.fillStyle = "rgba(48, 110, 42, .55)";
      ctx.beginPath();
      ctx.ellipse(w * 0.3, h * 0.64, 9, 4.5, 0.3, 0, 7);
      ctx.fill();
      ctx.fillStyle = "rgba(28, 70, 48, .5)";
      ctx.beginPath();
      ctx.ellipse(w * 0.68, h * 0.48, 7, 3.5, -0.4, 0, 7);
      ctx.fill();
    };

    D.wrong_miniboard = (w, h, r, item) => {
      const pulse = item ? 0.82 + 0.18 * Math.sin(item.age * 5.2) : 1;
      const streets = ["DŁUGA", "KRÓTKA", "GŁÓWNA", "BOCZNA", "NOWA", "STARA"];
      const sold = streets[Math.floor(r() * streets.length)];
      let placed = streets[Math.floor(r() * streets.length)];
      if (placed === sold)
        placed = streets[(streets.indexOf(sold) + 1) % streets.length];

      ctx.fillStyle = "rgba(12, 8, 6, .28)";
      ctx.beginPath();
      ctx.ellipse(w * 0.58, h * 0.94, w * 0.34, h * 0.07, 0, 0, 7);
      ctx.fill();

      function streetSign(cx, top, name, soldHere) {
        ctx.fillStyle = "#4a5068";
        ctx.fillRect(cx - 2, top + 16, 4, h * 0.22);
        fillRR(cx - 22, top, 44, 18, 3, soldHere ? "#14532d" : "#7f1d1d");
        fillRR(cx - 20, top + 2, 40, 14, 2, soldHere ? "#166534" : "#991b1b");
        fitText(soldHere ? "SPRZEDAŻ" : "STAWIAMY", cx, top + 5, 38, 5, "#fff", {
          weight: 800,
        });
        fitText("UL. " + name, cx, top + 12, 38, 6, "#fde68a", { weight: 900 });
      }
      streetSign(w * 0.22, 2, sold, true);
      streetSign(w * 0.82, 2, placed, false);

      ctx.strokeStyle = `rgba(248, 113, 113, ${0.7 + 0.25 * pulse})`;
      ctx.lineWidth = 2.4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(w * 0.34, 22);
      ctx.quadraticCurveTo(w * 0.52, 10, w * 0.7, 22);
      ctx.stroke();
      ctx.fillStyle = "#f87171";
      ctx.beginPath();
      ctx.moveTo(w * 0.72, 22);
      ctx.lineTo(w * 0.64, 17);
      ctx.lineTo(w * 0.66, 26);
      ctx.closePath();
      ctx.fill();

      ctx.save();
      ctx.translate(w * 0.58, h * 0.58);
      ctx.rotate(0.08);
      const bw = w * 0.72,
        bh = h * 0.52;
      ctx.fillStyle = "#4a5068";
      ctx.fillRect(-bw * 0.28, bh * 0.32, 5, bh * 0.42);
      ctx.fillRect(bw * 0.22, bh * 0.32, 5, bh * 0.42);
      fillRR(-bw / 2, -bh / 2, bw, bh * 0.72, 4, "#e8ecf5");
      fillRR(-bw / 2 + 4, -bh / 2 + 4, bw - 8, bh * 0.72 - 8, 3, "#fb5607");
      fillRR(-bw / 2 + 8, -bh / 2 + 8, bw - 16, bh * 0.28, 3, "#fff");
      fitText("MINIBOARD", 0, -bh * 0.22, bw - 20, 9, "#0f1b3d", {
        weight: 900,
      });
      fitText("NIE TU!", 0, bh * 0.02, bw - 18, 12, "#fff", {
        weight: 900,
        stroke: "rgba(0,0,0,.35)",
        lw: 3,
      });
      ctx.restore();

      ctx.strokeStyle = `rgba(220, 38, 38, ${0.85 + 0.15 * pulse})`;
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(w * 0.28, h * 0.38);
      ctx.lineTo(w * 0.9, h * 0.82);
      ctx.moveTo(w * 0.9, h * 0.38);
      ctx.lineTo(w * 0.28, h * 0.82);
      ctx.stroke();

      fillRR(w * 0.04, h * 0.78, w * 0.44, 16, 4, "rgba(127, 29, 29, .92)");
      fitText("ZŁA ULICA", w * 0.26, h * 0.86, w * 0.4, 8, "#fecaca", {
        weight: 900,
      });
      ctx.fillStyle = `rgba(255, 180, 70, ${0.35 + 0.3 * pulse})`;
      ctx.beginPath();
      ctx.arc(w * 0.82, h * 0.7, 5.5, 0, 7);
      ctx.fill();
      ctx.fillStyle = "#dc2626";
      ctx.beginPath();
      ctx.arc(w * 0.82, h * 0.7, 3.2, 0, 7);
      ctx.fill();
    };

    D.late_report = (w, h, r, item) => {
      const pulse = item ? 0.82 + 0.18 * Math.sin(item.age * 8.5) : 1;
      const ring = item ? Math.sin(item.age * 16) * 2.4 : 0;
      const day = 10 + Math.floor(r() * 18);

      ctx.fillStyle = "rgba(16, 8, 22, .3)";
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.94, w * 0.38, h * 0.07, 0, 0, 7);
      ctx.fill();

      fillRR(w * 0.04, h * 0.06, w * 0.6, h * 0.8, 4, "#1e1b4b");
      fillRR(w * 0.06, h * 0.08, w * 0.56, h * 0.76, 3, "#f8fafc");
      fillRR(w * 0.06, h * 0.08, w * 0.56, h * 0.18, 3, "#4c1d95");
      fitText("RAPORT", w * 0.34, h * 0.17, w * 0.48, 10, "#fce7f3", {
        weight: 900,
      });
      ctx.fillStyle = "#cbd5e1";
      for (let i = 0; i < 5; i++)
        ctx.fillRect(
          w * 0.12,
          h * 0.32 + i * h * 0.075,
          w * (i === 3 ? 0.28 : 0.4),
          2.6,
        );
      fillRR(w * 0.12, h * 0.3, w * 0.18, h * 0.07, 2, "#e2e8f0");
      fitText(day + ".09", w * 0.21, h * 0.335, w * 0.16, 6, "#64748b", {
        weight: 800,
      });

      ctx.save();
      ctx.translate(w * 0.34, h * 0.62);
      ctx.rotate(-0.2);
      ctx.strokeStyle = "#dc2626";
      ctx.lineWidth = 2.2;
      ctx.strokeRect(-w * 0.22, -h * 0.08, w * 0.44, h * 0.16);
      fitText("PO TERMINIE", 0, 0, w * 0.4, 7, "#dc2626", { weight: 900 });
      ctx.restore();

      ctx.save();
      ctx.translate(w * 0.78 + ring, h * 0.5);
      fillRR(-w * 0.15, -h * 0.24, w * 0.3, h * 0.48, 7, "#111827");
      fillRR(-w * 0.12, -h * 0.2, w * 0.24, h * 0.34, 4, "#fce7f3");
      ctx.fillStyle = "#be185d";
      ctx.beginPath();
      ctx.arc(-w * 0.045, -h * 0.08, 2.3, 0, 7);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(w * 0.045, -h * 0.08, 2.3, 0, 7);
      ctx.fill();
      ctx.strokeStyle = "#9f1239";
      ctx.lineWidth = 1.8;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-w * 0.08, -h * 0.14);
      ctx.lineTo(-w * 0.02, -h * 0.11);
      ctx.moveTo(w * 0.08, -h * 0.14);
      ctx.lineTo(w * 0.02, -h * 0.11);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-6, 10);
      ctx.quadraticCurveTo(0, 3, 6, 10);
      ctx.stroke();
      fillRR(-w * 0.05, h * 0.16, w * 0.1, 3, 1.5, "#6b7280");
      ctx.restore();

      ctx.strokeStyle = `rgba(244, 114, 182, ${0.35 + 0.5 * pulse})`;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      for (let i = 1; i <= 3; i++) {
        ctx.beginPath();
        ctx.arc(w * 0.78 + ring, h * 0.38, 7 + i * 6 + pulse * 2, -1.05, 0.35);
        ctx.stroke();
      }

      fillRR(w * 0.62, h * 0.08, w * 0.34, h * 0.2, 5, "#fff");
      fitText("?!?!", w * 0.79, h * 0.18, w * 0.28, 11, "#be185d", {
        weight: 900,
      });

      fillRR(w * 0.06, h * 0.8, w * 0.56, 14, 4, "rgba(127, 29, 29, .94)");
      fitText("BRAK RAPORTU", w * 0.34, h * 0.87, w * 0.5, 7, "#fecaca", {
        weight: 900,
      });
    };

    D.pu_heart = (w, h, r, item) => {
      puBubble(w, h, "#ff6b8a", "#d7263d", "+1 ŻYCIE");
      drawHeartIcon(w / 2, h * 0.42, h * 0.22, "#fff");
      ctx.fillStyle = "rgba(255,255,255,.35)";
      ctx.beginPath();
      ctx.arc(w * 0.28, h * 0.26, 4, 0, 7);
      ctx.fill();
    };
    D.pu_slowfall = (w, h) => {
      puBubble(w, h, "#5eead4", "#0891b2", "WOLNIEJ");
      ctx.fillStyle = "#fff";
      ctx.font = `900 ${h * 0.34}px Rubik, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("▼", w / 2, h * 0.38);
      ctx.globalAlpha = 0.45;
      ctx.fillText("▼", w / 2 - 10, h * 0.52);
      ctx.fillText("▼", w / 2 + 10, h * 0.52);
      ctx.globalAlpha = 1;
    };
    D.pu_magnet = (w, h) => {
      puBubble(w, h, "#a78bfa", "#7c3aed", "ZASIĘG");
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(w / 2, h * 0.38, w * 0.22, Math.PI, 0);
      ctx.stroke();
      ctx.fillStyle = "#ffd166";
      ctx.fillRect(w * 0.32, h * 0.36, w * 0.12, h * 0.1);
      ctx.fillRect(w * 0.56, h * 0.36, w * 0.12, h * 0.1);
      ctx.strokeStyle = "rgba(255,255,255,.5)";
      ctx.lineWidth = 2;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(w / 2 + i * 14, h * 0.52);
        ctx.lineTo(w / 2 + i * 22, h * 0.62);
        ctx.stroke();
      }
    };
    D.pu_mini = (w, h) => {
      puBubble(w, h, "#fcd34d", "#f59e0b", "MINI");
      fillRR(w * 0.28, h * 0.48, w * 0.44, h * 0.22, 3, "#f4f6fb");
      fillRR(w * 0.3, h * 0.5, w * 0.28, h * 0.12, 2, "#0f1b3d");
      ctx.fillStyle = "#1c1e26";
      ctx.beginPath();
      ctx.arc(w * 0.36, h * 0.72, 4, 0, 7);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(w * 0.64, h * 0.72, 4, 0, 7);
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w * 0.2, h * 0.46);
      ctx.lineTo(w * 0.8, h * 0.46);
      ctx.moveTo(w * 0.2, h * 0.74);
      ctx.lineTo(w * 0.8, h * 0.74);
      ctx.stroke();
    };

    D.pu_pawel = (w, h) => {
      const head = pawelHeadImage;
      if (head && head.complete && head.naturalWidth > 0) {
        ctx.drawImage(head, 0, 0, w, h);
      } else {
        fitText("…", w / 2, h / 2, w, 20, "rgba(255,255,255,.85)", {
          weight: 900,
          stroke: "rgba(0,0,0,.5)",
          lw: 4,
        });
      }
    };
    D.pu_roulette = (w, h) => {
      puBubble(w, h, "#ffd166", "#c026d3", "RULETKA");
      const cx = w / 2,
        cy = h * 0.4,
        rad = w * 0.22;
      const cols = [
        "#22e07a",
        "#ffd166",
        "#ff6b8a",
        "#4cc9f0",
        "#ff4d5e",
        "#fb5607",
      ];
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(
          cx,
          cy,
          rad,
          (i * Math.PI) / 3 - 0.5,
          ((i + 1) * Math.PI) / 3 - 0.5,
        );
        ctx.closePath();
        ctx.fillStyle = cols[i];
        ctx.fill();
      }
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, 7);
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.moveTo(cx, cy - rad);
      ctx.lineTo(cx - 5, cy - rad - 9);
      ctx.lineTo(cx + 5, cy - rad - 9);
      ctx.closePath();
      ctx.fill();
    };

    const ITEMS = {};
    for (const meta of CATALOG) {
      ITEMS[meta.key] = { ...meta, draw: D[meta.key] };
    }

    function renderPreview(key, seed, boxW, boxH) {
      const def = ITEMS[key];
      if (!def) return;
      const scale = Math.min(boxW / def.w, boxH / def.h, 2.5);
      const w = def.w * scale,
        h = def.h * scale;
      const ox = (boxW - w) / 2,
        oy = (boxH - h) / 2;
      const r = mulberry(seed || 42);
      const item = { age: 1.2, glow: key === "glow" };
      ctx.save();
      ctx.translate(ox, oy);
      if (def.kind === "bad") {
        ctx.setLineDash([5, 4]);
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(255,77,94,.85)";
        ctx.strokeRect(-4, -4, w + 8, h + 8);
        ctx.setLineDash([]);
      }
      if (def.kind === "special") {
        ctx.shadowColor = "#ffd166";
        ctx.shadowBlur = 14;
      }
      if (def.kind === "powerup" && key !== "pu_pawel") {
        ctx.shadowColor = "#4cc9f0";
        ctx.shadowBlur = 16;
        fillRR(-3, -3, w + 6, h + 6, 10, "rgba(76,201,240,.22)");
        ctx.shadowBlur = 0;
      }
      ctx.scale(scale, scale);
      def.draw(def.w, def.h, r, item);
      ctx.restore();
    }

    return { ITEMS, renderPreview, D };
  }

  return {
    CATALOG,
    BRAND,
    getDisabled,
    setDisabled,
    isEnabled,
    toggle,
    enableAll,
    disableKeys,
    createRenderer,
    mulberry,
    onPawelHeadReady,
    getPawelHeadImage,
    ensurePawelHeadLoaded,
  };
})();
