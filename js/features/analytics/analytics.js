// Exports: renderAnalytics()
import { FOLDERS_DATA } from '../../data.js';
import { FOLDER_IMAGES_EVENTS } from '../../events-registry.js';
import { uploadedAssets, userUploadedAssets, getPortals } from '../../session.js';
import { getFaces } from '../../faces.js';

let _period = '30d';

// ── Sparkline data (deterministic per KPI per period) ────────────────────────
const SPARKS = {
  total:       { '7d': [55,72,48,90,65,88,100], '30d': [40,58,52,71,65,83,100], '3m': [30,45,60,55,72,85,100], 'all': [20,35,50,65,72,88,100] },
  uploads:     { '7d': [30,80,45,95,55,70,100], '30d': [45,60,38,82,70,90,100], '3m': [25,50,70,45,85,75,100], 'all': [15,30,55,68,72,85,100] },
  portalViews: { '7d': [60,40,75,55,85,65,100], '30d': [50,65,45,78,60,88,100], '3m': [35,55,65,50,80,75,100], 'all': [20,40,55,70,65,85,100] },
  downloads:   { '7d': [50,70,35,85,60,75,100], '30d': [40,55,65,70,75,85,100], '3m': [30,45,60,72,68,90,100], 'all': [25,38,55,65,75,85,100] },
};

// ── Data helpers ─────────────────────────────────────────────────────────────

function _totalFiles() {
  const demo = Object.values(uploadedAssets).reduce((s, a) => s + a.length, 0);
  const user = Object.values(userUploadedAssets).reduce((s, a) => s + a.length, 0);
  return demo + user;
}

function _folderStats() {
  const extra = {};
  for (const [id, arr] of Object.entries(userUploadedAssets)) {
    extra[id] = (extra[id] || 0) + arr.length;
  }
  return FOLDERS_DATA
    .map(f => ({ name: f.name, count: (parseInt(f.count) || 0) + (extra[f.id] || 0) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

function _typeStats() {
  const counts = {};
  // Count demo image extensions
  for (const urls of Object.values(FOLDER_IMAGES_EVENTS)) {
    for (const url of urls) {
      const ext = url.split('.').pop().toUpperCase().replace('JPEG', 'JPG');
      counts[ext] = (counts[ext] || 0) + 1;
    }
  }
  // Count user-uploaded extensions
  const allUploads = [...Object.values(uploadedAssets).flat(), ...Object.values(userUploadedAssets).flat()];
  for (const a of allUploads) {
    const ext = (a.ext || '').toUpperCase().replace('JPEG', 'JPG');
    if (ext) counts[ext] = (counts[ext] || 0) + 1;
  }
  // Fill in missing types with a proportional baseline so the chart is useful
  const total = Object.values(counts).reduce((s, v) => s + v, 0) || 60;
  const base = { JPG: .78, PNG: .12, TIFF: .06, RAW: .03, PDF: .01 };
  for (const [ext, frac] of Object.entries(base)) {
    if (!counts[ext]) counts[ext] = Math.max(1, Math.round(total * frac));
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([ext, count]) => ({ ext, count }));
}

function _portalStats() {
  const portals = getPortals();
  if (!portals.length) {
    return [
      { title: 'Lima 42K 2026',        views: 247 },
      { title: 'Rimac Bienestar Fest',  views: 183 },
      { title: 'Wings for Life 2026',   views: 127 },
      { title: 'Color Run 2026',        views: 94  },
    ];
  }
  return portals.map(p => {
    let h = 0;
    for (let i = 0; i < p.title.length; i++) h = (h * 31 + p.title.charCodeAt(i)) >>> 0;
    return { title: p.title, views: 50 + (h % 280) };
  }).sort((a, b) => b.views - a.views).slice(0, 5);
}

function _faceStats() {
  const faces = getFaces();
  const identified = faces.filter(f => !f.unnamed).length;
  const unnamed    = faces.filter(f => f.unnamed).length;
  const all = faces.map(f => ({ ...f, photos: f.appearances?.photos || 0 }))
    .sort((a, b) => b.photos - a.photos);
  return { total: faces.length, identified, unnamed, top: all.slice(0, 6), all };
}

function _kpiValues(total) {
  const multipliers = { '7d': [.05, 47, 23], '30d': [.18, 183, 94], '3m': [.62, 521, 276], 'all': [1, 847, 418] };
  const [um, pv, dl] = multipliers[_period] || multipliers['30d'];
  return {
    total,
    uploads:     Math.max(1, Math.round(total * um)),
    portalViews: pv,
    downloads:   dl,
  };
}

const UPLOAD_LABELS = {
  '7d': 'Subidas esta semana', '30d': 'Subidas este mes',
  '3m': 'Subidas este trimestre', 'all': 'Subidas totales',
};

// ── Render helpers ────────────────────────────────────────────────────────────

function _fmt(n) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'K';
  return String(n);
}

function _sparkHTML(key) {
  const vals = SPARKS[key]?.[_period] || SPARKS[key]?.['30d'];
  return vals.map((h, i) =>
    `<div class="an-spark-bar${i === vals.length - 1 ? ' last' : ''}" style="height:${h}%"></div>`
  ).join('');
}

const TYPE_COLOR = { JPG: 'rb-blue', JPEG: 'rb-blue', PNG: 'rb-green', TIFF: 'rb-yellow', RAW: 'rb-purple', PDF: 'rb-teal', GIF: 'rb-orange' };

function _rankRowHTML(pos, name, pct, countStr) {
  return `
    <div class="an-rank-row">
      <span class="an-rank-pos">${String(pos).padStart(2,'0')}</span>
      <div class="an-rank-body">
        <span class="an-rank-name">${name}</span>
        <div class="an-rank-bar-wrap">
          <div class="an-rank-bar ${pct._color}" style="width:${Math.max(3, pct._w)}%"></div>
        </div>
      </div>
      <span class="an-rank-count">${countStr}</span>
    </div>`;
}

function _faceRowHTML(pos, face, maxPhotos) {
  const pct = maxPhotos > 0 ? (face.photos / maxPhotos) * 100 : 0;
  const avatar = face.selfieUrl
    ? `<img class="an-face-avatar" src="${face.selfieUrl}" alt="" loading="lazy">`
    : `<div class="an-face-avatar-ph"><span class="msi">person</span></div>`;
  const nameHtml = face.unnamed
    ? `<span class="an-rank-name-un">Sin identificar</span>`
    : `<span class="an-rank-name">${face.displayName}</span>`;
  return `
    <div class="an-face-row">
      <span class="an-rank-pos">${String(pos).padStart(2,'0')}</span>
      ${avatar}
      <div class="an-rank-body">
        ${nameHtml}
        <div class="an-rank-bar-wrap">
          <div class="an-rank-bar rb-green" style="width:${Math.max(3, pct)}%"></div>
        </div>
      </div>
      <span class="an-rank-count">${face.photos}<span style="font-size:9px;color:var(--g700);margin-left:2px">f</span></span>
    </div>`;
}

function _fdiHTML(face) {
  const avatar = face.selfieUrl
    ? `<img class="an-fdi-avatar" src="${face.selfieUrl}" alt="" loading="lazy">`
    : `<div class="an-fdi-ph"><span class="msi xs">person</span></div>`;
  const nameClass = face.unnamed ? 'an-fdi-name un' : 'an-fdi-name';
  const name = face.unnamed ? 'Sin identificar' : face.displayName;
  return `
    <div class="an-fdi">
      ${avatar}
      <div class="an-fdi-info">
        <div class="${nameClass}">${name}</div>
        <span class="an-fdi-count">${face.photos}</span><span class="an-fdi-sub">${face.photos === 1 ? 'foto' : 'fotos'}</span>
      </div>
    </div>`;
}

// ── Full HTML build ───────────────────────────────────────────────────────────

function _buildHTML() {
  const total   = _totalFiles();
  const kpis    = _kpiValues(total);
  const folders = _folderStats();
  const types   = _typeStats();
  const portals = _portalStats();
  const faces   = _faceStats();

  const maxFolder  = Math.max(...folders.map(f => f.count), 1);
  const maxType    = Math.max(...types.map(t => t.count), 1);
  const maxPortal  = Math.max(...portals.map(p => p.views), 1);
  const maxFaceP   = Math.max(...faces.top.map(f => f.photos), 1);

  // ── Filter bar
  const pills = [
    { key: '7d', label: '7 días' }, { key: '30d', label: '30 días' },
    { key: '3m', label: '3 meses' }, { key: 'all', label: 'Todo' },
  ].map(p => `<button class="an-pill${_period === p.key ? ' active' : ''}" data-period="${p.key}">${p.label}</button>`).join('');

  const filterHTML = `
    <div class="an-filter">
      <span class="an-filter-label">Periodo</span>
      ${pills}
      <span class="an-filter-spacer"></span>
      <span class="an-updated"><span class="an-dot"></span>Actualizado hoy</span>
    </div>`;

  // ── KPI cards
  const kpiDefs = [
    { key: 'total',       color: 'kc-blue',   icon: 'folder_open',    label: 'Archivos totales',              val: kpis.total,       delta: '+12%', up: true },
    { key: 'uploads',     color: 'kc-green',  icon: 'cloud_upload',   label: UPLOAD_LABELS[_period],          val: kpis.uploads,     delta: '+8%',  up: true },
    { key: 'portalViews', color: 'kc-yellow', icon: 'captive_portal', label: 'Vistas portales',               val: kpis.portalViews, delta: '+24%', up: true },
    { key: 'downloads',   color: 'kc-purple', icon: 'download',       label: 'Descargas',                     val: kpis.downloads,   delta: '+5%',  up: true },
  ];

  const kpiGrid = `<div class="an-kpi-grid">${kpiDefs.map(k => `
    <div class="an-kpi ${k.color}">
      <div class="an-kpi-top">
        <div class="an-kpi-icon"><span class="msi xs">${k.icon}</span></div>
        <span class="an-kpi-delta ${k.up ? 'up' : 'down'}">${k.delta}</span>
      </div>
      <div class="an-kpi-value">${_fmt(k.val)}</div>
      <div class="an-kpi-label">${k.label}</div>
      <div class="an-sparkline">${_sparkHTML(k.key)}</div>
    </div>`).join('')}</div>`;

  // ── Top carpetas
  const foldersRows = folders.map((f, i) =>
    _rankRowHTML(i + 1, f.name, { _color: 'rb-blue', _w: (f.count / maxFolder) * 100 }, f.count)
  ).join('');

  const foldersCard = `
    <div class="an-card">
      <div class="an-card-head">
        <span class="an-card-title"><span class="msi xs">folder</span>Top carpetas</span>
        <span class="an-card-badge">${folders.length} carpetas</span>
      </div>
      <div class="an-rank-list">${foldersRows}</div>
    </div>`;

  // ── Tipos de archivo
  const typesRows = types.map((t, i) =>
    _rankRowHTML(i + 1, t.ext, { _color: TYPE_COLOR[t.ext] || 'rb-blue', _w: (t.count / maxType) * 100 }, t.count)
  ).join('');

  const typesCard = `
    <div class="an-card">
      <div class="an-card-head">
        <span class="an-card-title"><span class="msi xs">photo_library</span>Tipos de archivo</span>
        <span class="an-card-badge">${types.length} formatos</span>
      </div>
      <div class="an-rank-list">${typesRows}</div>
    </div>`;

  // ── Top portales
  const portalsRows = portals.map((p, i) =>
    _rankRowHTML(i + 1, p.title, { _color: 'rb-purple', _w: (p.views / maxPortal) * 100 }, `${_fmt(p.views)} vistas`)
  ).join('');

  const portalsCard = `
    <div class="an-card">
      <div class="an-card-head">
        <span class="an-card-title"><span class="msi xs">captive_portal</span>Top portales</span>
        <span class="an-card-badge">${portals.length} portales</span>
      </div>
      <div class="an-rank-list">${portalsRows}</div>
    </div>`;

  // ── Face IDs
  const faceRows = faces.top.map((f, i) => _faceRowHTML(i + 1, f, maxFaceP)).join('');

  const faceCard = `
    <div class="an-card">
      <div class="an-card-head">
        <span class="an-card-title"><span class="msi xs">ar_on_you</span>Face IDs</span>
        <span class="an-card-badge">${faces.total} registros</span>
      </div>
      <div class="an-face-summary">
        <div class="an-face-stat">
          <span class="an-face-stat-val">${faces.identified}</span>
          <span class="an-face-stat-lbl">Identificados</span>
        </div>
        <div class="an-face-div"></div>
        <div class="an-face-stat">
          <span class="an-face-stat-val">${faces.unnamed}</span>
          <span class="an-face-stat-lbl">Sin nombre</span>
        </div>
        <div class="an-face-div"></div>
        <div class="an-face-stat">
          <span class="an-face-stat-val">${faces.total}</span>
          <span class="an-face-stat-lbl">Total</span>
        </div>
      </div>
      <div class="an-rank-list">${faceRows}</div>
    </div>`;

  // ── Faces detail (full width)
  const faceDetailItems = faces.all.map(f => _fdiHTML(f)).join('');

  const facesDetailCard = `
    <div class="an-card" style="margin-bottom:0">
      <div class="an-card-head">
        <span class="an-card-title"><span class="msi xs">grid_view</span>Fotos por Face ID</span>
        <span class="an-card-badge">${faces.all.length} personas</span>
      </div>
      <div class="an-faces-detail-grid">${faceDetailItems}</div>
    </div>`;

  return `
    <div class="an-wrap">
      ${filterHTML}
      <div class="an-section-lbl"><span class="msi xs">timeline</span>Actividad del periodo</div>
      ${kpiGrid}
      <div class="an-section-lbl"><span class="msi xs">leaderboard</span>Rankings</div>
      <div class="an-rankings">${foldersCard}${typesCard}</div>
      <div class="an-rankings">${portalsCard}${faceCard}</div>
      <div class="an-section-lbl"><span class="msi xs">bar_chart</span>Variantes de visualización</div>
      ${_buildVariants(folders)}
      <div class="an-section-lbl"><span class="msi xs">ar_on_you</span>Detalle Face IDs</div>
      ${facesDetailCard}
    </div>`;
}

// ── Variants A·B·C·D ─────────────────────────────────────────────────────────

function _buildVariants(folders) {
  const max  = Math.max(...folders.map(f => f.count), 1);
  const UNITS = 8; // segments/dots
  const rows  = folders.slice(0, 5);

  /* A — Cápsulas */
  const vA = rows.map((f, i) => `
    <div class="an-rank-row">
      <span class="an-rank-pos">${String(i+1).padStart(2,'0')}</span>
      <div class="an-rank-body">
        <span class="an-rank-name">${f.name}</span>
        <div class="an-bar-a">
          <div class="an-bar-a-fill" style="width:${Math.max(4,Math.round((f.count/max)*100))}%;animation-delay:${.05+i*.05}s"></div>
        </div>
      </div>
      <span class="an-rank-count">${f.count}</span>
    </div>`).join('');

  /* B — Bloques */
  const vB = rows.map((f, i) => {
    const filled = Math.max(1, Math.round((f.count / max) * UNITS));
    const blocks = Array.from({length: UNITS}, (_, j) =>
      `<span class="an-bb${j < filled ? ' on' : ''}"></span>`).join('');
    return `
    <div class="an-rank-row">
      <span class="an-rank-pos">${String(i+1).padStart(2,'0')}</span>
      <div class="an-rank-body">
        <span class="an-rank-name">${f.name}</span>
        <div class="an-bar-b">${blocks}</div>
      </div>
      <span class="an-rank-count">${f.count}</span>
    </div>`;
  }).join('');

  /* C — Puntos */
  const vC = rows.map((f, i) => {
    const filled = Math.max(1, Math.round((f.count / max) * UNITS));
    const dots = Array.from({length: UNITS}, (_, j) =>
      `<span class="an-bc${j < filled ? ' on' : ''}"></span>`).join('');
    return `
    <div class="an-rank-row">
      <span class="an-rank-pos">${String(i+1).padStart(2,'0')}</span>
      <div class="an-rank-body">
        <span class="an-rank-name">${f.name}</span>
        <div class="an-bar-c">${dots}</div>
      </div>
      <span class="an-rank-count">${f.count}</span>
    </div>`;
  }).join('');

  /* D — Fila rellena (número prominente) */
  const vD = rows.map((f, i) => {
    const pct = Math.max(4, Math.round((f.count / max) * 100));
    return `
    <div class="an-vd-row">
      <div class="an-vd-bg" style="width:${pct}%;animation-delay:${.05+i*.05}s"></div>
      <span class="an-vd-pos">${String(i+1).padStart(2,'0')}</span>
      <span class="an-vd-name">${f.name}</span>
      <span class="an-vd-count">${f.count}</span>
    </div>`;
  }).join('');

  const card = (tag, label, body) => `
    <div class="an-card">
      <div class="an-card-head">
        <span class="an-card-title"><span class="msi xs">folder</span>Top carpetas</span>
        <span class="an-v-tag">${tag} — ${label}</span>
      </div>
      ${body}
    </div>`;

  return `
    <div class="an-v-grid">
      ${card('A', 'Cápsulas',     `<div class="an-rank-list">${vA}</div>`)}
      ${card('B', 'Bloques',      `<div class="an-rank-list">${vB}</div>`)}
      ${card('C', 'Puntos',       `<div class="an-rank-list">${vC}</div>`)}
      ${card('D', 'Fila rellena', `<div class="an-v-d-list">${vD}</div>`)}
    </div>`;
}

// ── Events ────────────────────────────────────────────────────────────────────

function _bindEvents(sec) {
  sec.querySelectorAll('.an-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      _period = btn.dataset.period;
      renderAnalytics();
    });
  });
}

// ── Export ────────────────────────────────────────────────────────────────────

export function renderAnalytics() {
  const sec = document.getElementById('sec-analytics');
  if (!sec) return;
  sec.innerHTML = _buildHTML();
  _bindEvents(sec);
}
