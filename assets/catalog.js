(() => {
  'use strict';

  const FI = window.BBC_FallingItems;
  const GS = window.BBC_GameSettings;
  const ADMIN = !!(GS && typeof GS.readDebugMode === 'function' && GS.readDebugMode());
  const SECTIONS = [
    { kind: 'good', title: 'ŁAP — reklamy i elementy kampanii', hint: 'zielone' },
    { kind: 'bad', title: 'UNIKAJ — przeszkody', hint: 'czerwone' },
    { kind: 'special', title: 'BONUSY specjalne', hint: 'złote' },
    { kind: 'powerup', title: 'POWER-UPY', hint: 'niebieskie' },
  ];

  document.body.classList.toggle('debug-mode', ADMIN);
  if (GS && typeof GS.setWritable === 'function') GS.setWritable(ADMIN);

  const sub = document.getElementById('catalog-sub');
  if (sub) {
    sub.innerHTML = ADMIN
      ? 'Podgląd wszystkich elementów. Przełącznik <b>W grze / Wyłączone</b> zapisuje się na serwerze i dotyczy wszystkich graczy.'
      : 'Podgląd wszystkich elementów z nazwami i ID. Lista włączonych w grze jest wspólna i pochodzi z serwera.';
  }

  let logoImg = null;

  function persistDisabled() {
    if (!ADMIN || !GS || typeof GS.saveDisabled !== 'function') return;
    GS.saveDisabled(FI.getDisabled());
  }

  function loadLogo() {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => { logoImg = img; resolve(); };
      img.onerror = () => {
        img.onerror = () => resolve();
        img.src = 'https://www.znajdzreklame.pl/logo.svg';
      };
      img.src = '../logo.svg';
    });
  }

  function makeDrawLogo(ctx) {
    return (cx, cy, maxW, variant, maxH) => {
      if (!logoImg) return;
      const aspect = logoImg.naturalWidth / logoImg.naturalHeight || 8;
      let w = maxW, h = w / aspect;
      if (maxH && h > maxH) { h = maxH; w = h * aspect; }
      ctx.drawImage(logoImg, cx - w / 2, cy - h / 2, w, h);
    };
  }

  function renderCardCanvas(canvas, key, seed) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const eng = FI.createRenderer(ctx, makeDrawLogo(ctx));
    eng.renderPreview(key, seed, canvas.width, canvas.height);
  }

  function metaLine(item) {
    const parts = [`${item.w}×${item.h}px`, `waga ${item.weight}`];
    if (item.effect) parts.push(`efekt: ${item.effect}`);
    if (item.duration) parts.push(`${item.duration}s`);
    if (item.pts) parts.push(`${item.pts > 0 ? '+' : ''}${item.pts} pkt`);
    if (item.minT) parts.push(`od ${item.minT}s`);
    if (item.speed) parts.push(`prędkość ×${item.speed}`);
    if (item.mover) parts.push('przejeżdża');
    if (item.wobble) parts.push('chwiejny');
    if (item.livesLost) parts.push(`−${item.livesLost} życia`);
    if (item.effect) parts.push(item.effect);
    return parts.join(' • ');
  }

  function updateStats() {
    const total = FI.CATALOG.length;
    const off = FI.getDisabled().length;
    document.getElementById('stats').textContent = `${total - off} / ${total} włączonych w grze`;
    const json = document.getElementById('disabled-json');
    if (json) json.textContent = JSON.stringify(FI.getDisabled());
  }

  function render(filter = '') {
    const q = filter.trim().toLowerCase();
    const host = document.getElementById('sections');
    host.innerHTML = '';

    for (const sec of SECTIONS) {
      const items = FI.CATALOG.filter((c) => {
        if (c.kind !== sec.kind) return false;
        if (!q) return true;
        return [c.key, c.name, c.desc, c.kind].join(' ').toLowerCase().includes(q);
      });

      const section = document.createElement('section');
      section.className = 'section';
      section.innerHTML = `
        <div class="section-head ${sec.kind}">
          <h2>${sec.title}</h2>
          <span class="badge">${items.length} pozycji • ${sec.hint}</span>
        </div>`;

      const grid = document.createElement('div');
      grid.className = 'grid';

      if (!items.length) {
        grid.innerHTML = '<div class="empty">Brak wyników w tej kategorii.</div>';
      } else {
        for (const item of items) {
          const enabled = FI.isEnabled(item.key);
          const card = document.createElement('article');
          card.className = 'card' + (enabled ? '' : ' off');
          card.dataset.key = item.key;
          const toggleHtml = ADMIN
            ? `<div class="toggle-row">
                <span class="toggle-label ${enabled ? '' : 'off'}">${enabled ? 'W grze' : 'Wyłączone'}</span>
                <label class="switch" title="Włącz / wyłącz w rozgrywce">
                  <input type="checkbox" ${enabled ? 'checked' : ''} data-key="${item.key}">
                  <span class="slider"></span>
                </label>
              </div>`
            : `<div class="toggle-row readonly">
                <span class="toggle-label ${enabled ? '' : 'off'}">${enabled ? 'W grze' : 'Wyłączone'}</span>
              </div>`;
          card.innerHTML = `
            <div class="preview-wrap">
              <span class="kind-tag kind-${item.kind}">${item.kind}</span>
              <canvas width="240" height="140"></canvas>
            </div>
            <div class="card-body">
              <h3 class="card-title">${item.name}</h3>
              <div class="card-id">ID: ${item.key}</div>
              <p class="card-desc">${item.desc}</p>
              <div class="meta"><span>${metaLine(item)}</span></div>
              ${toggleHtml}
            </div>`;
          grid.appendChild(card);
          const cv = card.querySelector('canvas');
          renderCardCanvas(cv, item.key, item.key.split('').reduce((a, c) => a + c.charCodeAt(0), 0));
        }
      }

      section.appendChild(grid);
      host.appendChild(section);
    }

    if (ADMIN) {
      host.querySelectorAll('.switch input').forEach((inp) => {
        inp.addEventListener('change', () => {
          FI.toggle(inp.dataset.key);
          persistDisabled();
          render(document.getElementById('search').value);
          updateStats();
        });
      });
    }

    updateStats();
  }

  document.getElementById('search').addEventListener('input', (e) => render(e.target.value));

  const btnAll = document.getElementById('btn-all');
  const btnNone = document.getElementById('btn-none');
  const btnReset = document.getElementById('btn-reset');
  if (ADMIN && btnAll && btnNone && btnReset) {
    btnAll.addEventListener('click', () => {
      FI.enableAll();
      persistDisabled();
      render(document.getElementById('search').value);
    });
    btnNone.addEventListener('click', () => {
      FI.disableKeys(FI.CATALOG.map((c) => c.key));
      persistDisabled();
      render(document.getElementById('search').value);
    });
    btnReset.addEventListener('click', () => {
      FI.enableAll();
      persistDisabled();
      render(document.getElementById('search').value);
    });
  }

  Promise.resolve()
    .then(() => loadLogo())
    .then(() => (GS && typeof GS.hydrateFromServer === 'function' ? GS.hydrateFromServer() : null))
    .catch((err) => console.warn('catalog hydrate', err))
    .then(() => {
      render();
      FI.onPawelHeadReady(() => render(document.getElementById('search').value));
    });
})();
