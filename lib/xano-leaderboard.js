/* Klient API Xano — tablica wyników i ustawienia (Ads Catcher) */
(() => {
  'use strict';

  const XANO = {
    baseUrl: 'https://xeow-pqh4-ha4j.f2.xano.io/api:gra-ads-catcher:v1',
    limit: 10,
  };
  const VISITOR_KEY = 'bbcatch.vid.v1';

  function normalizeEntry(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const name = String(raw.name ?? raw.player_name ?? '').trim().toUpperCase().slice(0, 12);
    const score = Math.round(Number(raw.score));
    if (!name || !Number.isFinite(score) || score <= 0) return null;
    return { name, score, date: raw.date ?? raw.created_at ?? null };
  }

  function normalizeBoard(data) {
    const list = Array.isArray(data)
      ? data
      : (Array.isArray(data?.board) ? data.board : (Array.isArray(data?.items) ? data.items : []));
    return list.map(normalizeEntry).filter(Boolean);
  }

  function fallbackUuid() {
    const bytes = new Uint8Array(16);
    if (crypto.getRandomValues) crypto.getRandomValues(bytes);
    else for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  function getVisitorId() {
    try {
      const existing = localStorage.getItem(VISITOR_KEY);
      if (existing && existing.length >= 8 && existing.length <= 64) return existing;
      const id = (crypto.randomUUID && crypto.randomUUID()) || fallbackUuid();
      localStorage.setItem(VISITOR_KEY, id);
      return id;
    } catch {
      return 'anon';
    }
  }

  function hash32(str, seed) {
    let h = seed >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(16).padStart(8, '0');
  }

  function hashSignals(str) {
    return hash32(str, 0x811c9dc5)
      + hash32(str, 0xabcdef01)
      + hash32(str, 0x12345678)
      + hash32(str.split('').reverse().join(''), 0x811c9dc5);
  }

  function canvasHash() {
    try {
      const c = document.createElement('canvas');
      c.width = 240;
      c.height = 60;
      const ctx = c.getContext('2d');
      if (!ctx) return 'no-2d';
      ctx.textBaseline = 'top';
      ctx.font = '16px "Arial", "Helvetica", sans-serif';
      ctx.fillStyle = '#f60';
      ctx.fillRect(12, 8, 90, 36);
      ctx.fillStyle = '#069';
      ctx.fillText('AdsCatcher🧠', 4, 6);
      ctx.strokeStyle = '#0a0';
      ctx.beginPath();
      ctx.arc(180, 28, 18, 0, Math.PI * 2);
      ctx.stroke();
      return hash32(c.toDataURL(), 0xcafebabe);
    } catch {
      return 'canvas-err';
    }
  }

  function webglHash() {
    try {
      const c = document.createElement('canvas');
      const gl = c.getContext('webgl') || c.getContext('experimental-webgl');
      if (!gl) return 'no-webgl';
      const dbg = gl.getExtension('WEBGL_debug_renderer_info');
      const vendor = dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR);
      const renderer = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
      return `${vendor || ''}~${renderer || ''}`;
    } catch {
      return 'webgl-err';
    }
  }

  function collectFingerprint() {
    const nav = navigator || {};
    const scr = screen || {};
    let tz = '';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch { /* ignore */ }
    const signals = [
      nav.userAgent || '',
      nav.platform || '',
      nav.language || '',
      (nav.languages || []).join(','),
      String(nav.hardwareConcurrency || 0),
      String(nav.deviceMemory || 0),
      String(nav.maxTouchPoints || 0),
      String(scr.width || 0) + 'x' + String(scr.height || 0) + 'x' + String(scr.availWidth || 0),
      String(scr.colorDepth || 0),
      String(window.devicePixelRatio || 1),
      tz,
      String(new Date().getTimezoneOffset()),
      canvasHash(),
      webglHash(),
    ].join('|');
    return hashSignals(signals);
  }

  function collectIdentity() {
    return {
      visitor_id: getVisitorId(),
      fingerprint: collectFingerprint(),
    };
  }

  async function fetchBoard() {
    const res = await fetch(`${XANO.baseUrl}/leaderboard?limit=${XANO.limit}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`leaderboard GET ${res.status}`);
    const data = await res.json();
    return normalizeBoard(data);
  }

  async function submitScore(playerName, score) {
    const identity = collectIdentity();
    const res = await fetch(`${XANO.baseUrl}/leaderboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        player_name: playerName,
        score: Math.round(score),
        visitor_id: identity.visitor_id,
        fingerprint: identity.fingerprint,
      }),
    });
    if (!res.ok) throw new Error(`leaderboard POST ${res.status}`);
    const data = await res.json();
    const board = normalizeBoard(data);
    const rank = Number(data?.rank);
    return { board, rank: Number.isFinite(rank) ? rank : -1 };
  }

  async function fetchSettings() {
    const res = await fetch(`${XANO.baseUrl}/settings`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`settings GET ${res.status}`);
    return res.json();
  }

  async function saveSettings(payload) {
    const res = await fetch(`${XANO.baseUrl}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`settings POST ${res.status}`);
    return res.json();
  }

  window.BBC_XanoLeaderboard = {
    fetchBoard, submitScore, normalizeBoard,
    fetchSettings, saveSettings,
    config: XANO,
  };
})();
