// Exports: renderAnalytics()
import { getFaces } from '../../faces.js';
import { uploadedAssets, userUploadedAssets, getPortals } from '../../session.js';
import { FOLDERS_DATA } from '../../data.js';
import { FOLDER_IMAGES_EVENTS } from '../../events-registry.js';

let _tab    = 'dam';
let _period = '30d';
let _gid    = 0;  // gradient ID counter

// ── Mock data (static mockup) ─────────────────────────────────────────────

const M = {
  storage: {
    usedTB: 2.4, totalTB: 5.0, projectionDate: 'ago 2027',
    avgFileMB: 8.4,
    types: [
      { ext: 'JPG',   pct: 62, gb: 1.49, color: 'var(--g950)' },
      { ext: 'RAW',   pct: 18, gb: 0.43, color: 'var(--g700)' },
      { ext: 'PNG',   pct: 10, gb: 0.24, color: 'var(--g500)' },
      { ext: 'VIDEO', pct:  6, gb: 0.14, color: 'var(--g400)' },
      { ext: 'TIFF',  pct:  3, gb: 0.07, color: 'var(--g300)' },
      { ext: 'PDF',   pct:  1, gb: 0.02, color: 'var(--g200)' },
    ],
    growthData:   [0.30, 0.50, 0.78, 1.05, 1.28, 1.55, 1.80, 2.10, 2.40],
    growthLabels: ['Oct','Nov','Dic','Ene','Feb','Mar','Abr','May','Jun'],
  },
  structure: {
    heavyFolders: [
      { name: 'Lima 42K 2026',    gb: 420 },
      { name: 'Wings for Life',   gb: 310 },
      { name: 'Rimac Bienestar',  gb: 280 },
      { name: 'Color Run 2026',   gb: 195 },
      { name: 'Trail Perú',       gb: 142 },
    ],
    duplicates: 247, orphans: 183, noTags: 629, noMeta: 412,
    nesting: [
      { label: 'Superficial (1-2)',  pct: 45, color: 'var(--g300)' },
      { label: 'Medio (3-4)',        pct: 38, color: 'var(--g600)' },
      { label: 'Profundo (5+)',      pct: 17, color: 'var(--g950)' },
    ],
  },
  activity: {
    active: 24, inactive: 8, guests: 12,
    topUploaders: [
      { name: 'María L.',  uploads: 1840 },
      { name: 'Carlos V.', uploads: 1420 },
      { name: 'Ana R.',    uploads:  980 },
      { name: 'Luis P.',   uploads:  760 },
      { name: 'Sofía M.',  uploads:  540 },
    ],
    actions: [
      { label: 'Subidas',       n: 5820, color: 'var(--g950)' },
      { label: 'Descargas',     n: 3940, color: 'var(--g700)' },
      { label: 'Movimientos',   n: 1280, color: 'var(--g500)' },
      { label: 'Ediciones',     n:  720, color: 'var(--g400)' },
      { label: 'Eliminaciones', n:  184, color: 'var(--g300)' },
    ],
    heatDays:  ['Lu','Ma','Mi','Ju','Vi','Sá','Do'],
    heatHours: ['8am','10am','12pm','2pm','4pm','6pm'],
    heatData: [
      [2,4,8,6,5,3],
      [3,7,9,8,6,2],
      [2,5,10,9,7,3],
      [4,8,10,9,6,2],
      [3,6,8,7,4,1],
      [1,2,4,3,2,1],
      [1,1,2,1,1,0],
    ],
  },
  quality: {
    processed: 8420, pending: 1240, matchRate: 87.4,
    deletions: [
      { folder: 'Lima 42K 2025',  n: 48, date: 'Jun 12' },
      { folder: 'Wings for Life', n: 31, date: 'Jun 10' },
      { folder: 'Rimac Press',    n: 17, date: 'Jun 8'  },
    ],
  },
  portales: {
    active: 14, expired: 8, draft: 5,
    masters: 4, regulars: 23,
    avgAgeDays: 18,
    byFolder: [
      { name: 'Lima 42K 2026',   count: 6 },
      { name: 'Rimac Bienestar', count: 4 },
      { name: 'Wings for Life',  count: 5 },
      { name: 'Color Run 2026',  count: 3 },
      { name: 'Trail Perú',      count: 3 },
      { name: 'Otros',           count: 6 },
    ],
    topViews: [
      { title: 'Lima 42K 2026',      views: 1840, dl: 420,  cvr: 22.8 },
      { title: 'Rimac Bienestar',    views: 1240, dl: 310,  cvr: 25.0 },
      { title: 'Wings for Life',     views:  980, dl: 187,  cvr: 19.1 },
      { title: 'Color Run 2026',     views:  720, dl: 143,  cvr: 19.9 },
      { title: 'Trail Perú',         views:  460, dl:  82,  cvr: 17.8 },
    ],
    engagement: {
      avgTime: '3:42',
      assetsPerSession: 8.4,
      mobile: 62, desktop: 38,
      sources: [
        { label: 'Link directo', pct: 54, color: 'var(--g800)' },
        { label: 'QR',           pct: 31, color: 'var(--g500)' },
        { label: 'Otros',        pct: 15, color: 'var(--g300)' },
      ],
      radarAxes:   ['Vistas','Conversión','Tiempo','Assets/ses.','Retorno'],
      radarValues: [0.85, 0.72, 0.65, 0.80, 0.45],
    },
    viewsOverTime:   [180, 320, 580, 740, 920, 1050, 1240, 1580, 1840],
    viewsLabels:     ['Oct','Nov','Dic','Ene','Feb','Mar','Abr','May','Jun'],
    inactive: 3,
    security: {
      withPwd: 18, public: 9, failed: 24,
      expiring: [
        { title: 'Lima 42K VIP',     expires: 'Jun 18' },
        { title: 'Rimac Press Kit',  expires: 'Jun 20' },
        { title: 'Color Run Media',  expires: 'Jun 22' },
      ],
    },
  },
};

// ── Live data helpers ─────────────────────────────────────────────────────

function _faceStats() {
  const faces = getFaces();
  const identified = faces.filter(f => !f.unnamed).length;
  const unnamed    = faces.filter(f =>  f.unnamed).length;
  const all = faces.map(f => ({ ...f, photos: f.appearances?.photos || 0 }))
    .sort((a, b) => b.photos - a.photos);
  return { total: faces.length, identified, unnamed, top: all.slice(0, 6), all };
}

function _totalFiles() {
  const demo = Object.values(uploadedAssets).reduce((s, a) => s + a.length, 0);
  const user = Object.values(userUploadedAssets).reduce((s, a) => s + a.length, 0);
  return demo + user;
}

const SPARKS = {
  total:       { '7d':[55,72,48,90,65,88,100], '30d':[40,58,52,71,65,83,100], '3m':[30,45,60,55,72,85,100], 'all':[20,35,50,65,72,88,100] },
  uploads:     { '7d':[30,80,45,95,55,70,100], '30d':[45,60,38,82,70,90,100], '3m':[25,50,70,45,85,75,100], 'all':[15,30,55,68,72,85,100] },
  portalViews: { '7d':[60,40,75,55,85,65,100], '30d':[50,65,45,78,60,88,100], '3m':[35,55,65,50,80,75,100], 'all':[20,40,55,70,65,85,100] },
  downloads:   { '7d':[50,70,35,85,60,75,100], '30d':[40,55,65,70,75,85,100], '3m':[30,45,60,72,68,90,100], 'all':[25,38,55,65,75,85,100] },
};

function _sparkHTML(key) {
  const vals = SPARKS[key]?.[_period] || SPARKS[key]?.['30d'];
  return vals.map((h, i) =>
    `<div class="an-spark-bar${i === vals.length - 1 ? ' last' : ''}" style="height:${h}%"></div>`
  ).join('');
}

function _fmt(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0','') + 'M';
  if (n >= 1000)    return (n / 1000).toFixed(1).replace('.0','') + 'K';
  return String(n);
}

// ── SVG chart generators ──────────────────────────────────────────────────

function _svgDonut(segments, opts = {}) {
  const { size = 120, sw = 16 } = opts;
  const r  = (size - sw) / 2;
  const cx = size / 2, cy = size / 2;
  const C  = 2 * Math.PI * r;
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  let acc = 0;
  const circles = segments.map(seg => {
    const pct   = seg.value / total;
    const dash  = Math.max(0, pct * C - 1.5);
    const start = -90 + (acc / total) * 360;
    acc += seg.value;
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
      style="stroke:${seg.color}" stroke-width="${sw}"
      stroke-dasharray="${dash.toFixed(2)} ${(C - dash + 1.5).toFixed(2)}"
      transform="rotate(${start.toFixed(2)} ${cx} ${cy})"
      stroke-linecap="butt"/>`;
  });
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" style="stroke:var(--g100)" stroke-width="${sw}"/>
    ${circles.join('\n    ')}
  </svg>`;
}

function _svgLine(data, labels, opts = {}) {
  const { w = 320, h = 80, color = 'var(--g800)', showDots = true } = opts;
  const pl = 4, pr = 4, pt = 10, pb = labels ? 20 : 8;
  const W = w - pl - pr, H = h - pt - pb;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const n = data.length;
  const xp = i => pl + (i / (n - 1)) * W;
  const yp = v => pt + H - ((v - min) / range) * H;

  const pathD = data.map((v, i) => {
    if (i === 0) return `M ${xp(0).toFixed(1)} ${yp(v).toFixed(1)}`;
    const cpx = ((xp(i) + xp(i-1)) / 2).toFixed(1);
    return `C ${cpx} ${yp(data[i-1]).toFixed(1)}, ${cpx} ${yp(v).toFixed(1)}, ${xp(i).toFixed(1)} ${yp(v).toFixed(1)}`;
  }).join(' ');

  const gid = `alg${++_gid}`;
  const areaD = `${pathD} L ${xp(n-1).toFixed(1)} ${(pt+H).toFixed(1)} L ${xp(0).toFixed(1)} ${(pt+H).toFixed(1)} Z`;
  const dots = showDots ? data.map((v, i) =>
    `<circle cx="${xp(i).toFixed(1)}" cy="${yp(v).toFixed(1)}" r="2.5" fill="${color}" opacity=".8"/>`
  ).join('') : '';
  const lblEl = labels ? labels.map((l, i) => {
    if (i % Math.ceil(n / 7) !== 0 && i !== n - 1) return '';
    const anchor = i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle';
    return `<text x="${xp(i).toFixed(1)}" y="${h - 4}" text-anchor="${anchor}" font-size="8" fill="var(--g400)" font-family="sans-serif">${l}</text>`;
  }).join('') : '';

  return `<svg width="100%" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${color}" stop-opacity=".25"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <path d="${areaD}" fill="url(#${gid})"/>
    <path d="${pathD}" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    ${dots}
    ${lblEl}
  </svg>`;
}

function _svgRadar(axes, values, opts = {}) {
  const { size = 160, levels = 4, color = 'var(--g700)' } = opts;
  const cx = size / 2, cy = size / 2;
  const r  = size / 2 - 22;
  const n  = axes.length;
  const ang = i => (Math.PI * 2 * i / n) - Math.PI / 2;

  const grids = Array.from({ length: levels }, (_, lv) => {
    const rf = r * (lv + 1) / levels;
    const pts = Array.from({ length: n }, (_, i) =>
      `${(cx + rf * Math.cos(ang(i))).toFixed(1)},${(cy + rf * Math.sin(ang(i))).toFixed(1)}`
    ).join(' ');
    return `<polygon points="${pts}" fill="none" stroke="var(--g200)" stroke-width="1"/>`;
  });

  const axLines = Array.from({ length: n }, (_, i) =>
    `<line x1="${cx}" y1="${cy}" x2="${(cx + r * Math.cos(ang(i))).toFixed(1)}" y2="${(cy + r * Math.sin(ang(i))).toFixed(1)}" stroke="var(--g200)" stroke-width="1"/>`
  );

  const dataPts = values.map((v, i) => {
    const rf = r * v;
    return `${(cx + rf * Math.cos(ang(i))).toFixed(1)},${(cy + rf * Math.sin(ang(i))).toFixed(1)}`;
  }).join(' ');

  const lblDist = r + 14;
  const lbls = axes.map((ax, i) => {
    const lx = cx + lblDist * Math.cos(ang(i));
    const ly = cy + lblDist * Math.sin(ang(i));
    const anchor = Math.cos(ang(i)) > 0.15 ? 'start' : Math.cos(ang(i)) < -0.15 ? 'end' : 'middle';
    return `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="${anchor}" dominant-baseline="middle" font-size="8" fill="var(--g500)" font-family="sans-serif">${ax}</text>`;
  });

  const dotPts = values.map((v, i) => {
    const rf = r * v;
    return `<circle cx="${(cx + rf * Math.cos(ang(i))).toFixed(1)}" cy="${(cy + rf * Math.sin(ang(i))).toFixed(1)}" r="3" fill="${color}"/>`;
  });

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    ${grids.join('\n    ')}
    ${axLines.join('\n    ')}
    <polygon points="${dataPts}" fill="${color}" fill-opacity=".15" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>
    ${dotPts.join('\n    ')}
    ${lbls.join('\n    ')}
  </svg>`;
}

// ── Shared builders ───────────────────────────────────────────────────────

function _hbarListHTML(items, maxVal, colorFn) {
  return `<div class="an-hbar-list">${items.map((it, i) => {
    const pct  = Math.max(4, (it.val / maxVal) * 100);
    const fill = colorFn ? colorFn(it, i) : 'var(--g800)';
    return `<div class="an-hbar-item">
      <div class="an-hbar-top">
        <span class="an-hbar-name">${it.name}</span>
        <span class="an-hbar-val">${it.label}</span>
      </div>
      <div class="an-hbar-track">
        <div class="an-hbar-fill" style="width:${pct.toFixed(1)}%;background:${fill}"></div>
      </div>
    </div>`;
  }).join('')}</div>`;
}

// ── DAM Tab sections ──────────────────────────────────────────────────────

function _buildFaceHero(faces) {
  const maxP   = Math.max(...faces.top.map(f => f.photos), 1);
  const gridItems = faces.top.map(f => {
    const av = f.selfieUrl
      ? `<img class="an-fhg-avatar" src="${f.selfieUrl}" alt="" loading="lazy">`
      : `<div class="an-fhg-ph"><span class="msi">person</span></div>`;
    const nm = f.unnamed ? 'Sin ID' : (f.displayName || '').split(' ')[0];
    return `<div class="an-fhg-item">${av}<span class="an-fhg-name">${nm}</span><span class="an-fhg-cnt">${f.photos}f</span></div>`;
  }).join('');

  const bars = faces.top.slice(0, 5).map(f => {
    const pct = maxP > 0 ? (f.photos / maxP) * 100 : 0;
    const nm  = f.unnamed ? 'Sin identificar' : f.displayName;
    return `<div class="an-fhb-row">
      <span class="an-fhb-name">${nm}</span>
      <div class="an-fhb-track"><div class="an-fhb-fill" style="width:${pct.toFixed(1)}%"></div></div>
      <span class="an-fhb-cnt">${f.photos}</span>
    </div>`;
  }).join('');

  const matchPct = faces.total > 0 ? ((faces.identified / faces.total) * 100).toFixed(1) : '0';

  return `<div class="an-face-hero">
    <div class="an-face-hero-left">
      <div class="an-fh-eyebrow"><span class="msi">ar_on_you</span>Face IDs</div>
      <div class="an-fh-big">${faces.total}</div>
      <div class="an-fh-stats">
        <div class="an-fh-stat">
          <span class="an-fh-stat-val">${faces.identified}</span>
          <span class="an-fh-stat-lbl">Identificados</span>
        </div>
        <div class="an-fh-div"></div>
        <div class="an-fh-stat">
          <span class="an-fh-stat-val">${faces.unnamed}</span>
          <span class="an-fh-stat-lbl">Sin nombre</span>
        </div>
      </div>
      <div class="an-fh-match">
        <div class="an-fh-match-row">
          <span class="an-fh-match-lbl">Tasa identificación</span>
          <span class="an-fh-match-val">${matchPct}%</span>
        </div>
        <div class="an-fh-bar"><div class="an-fh-bar-fill" style="width:${matchPct}%"></div></div>
      </div>
    </div>
    <div class="an-face-hero-right">
      <div class="an-fh-grid">${gridItems}</div>
      <div class="an-fh-bars">${bars}</div>
    </div>
  </div>`;
}

function _buildKPIs(total) {
  const mult = { '7d':[.05,47,23], '30d':[.18,183,94], '3m':[.62,521,276], 'all':[1,847,418] };
  const [um, pv, dl] = mult[_period] || mult['30d'];
  const kpis = [
    { key:'total',       cls:'kc-blue',   icon:'folder_open',    label:'Archivos totales',   val: total,                    delta:'+12%', up:true  },
    { key:'uploads',     cls:'kc-green',  icon:'cloud_upload',   label:'Subidas este mes',    val: Math.round(total * um),   delta:'+8%',  up:true  },
    { key:'portalViews', cls:'kc-amber',  icon:'captive_portal', label:'Vistas portales',     val: pv,                       delta:'+24%', up:true  },
    { key:'downloads',   cls:'kc-rose',   icon:'download',       label:'Descargas',           val: dl,                       delta:'+5%',  up:true  },
  ];
  return `<div class="an-kpi-grid">${kpis.map(k => `
    <div class="an-kpi ${k.cls}">
      <div class="an-kpi-top">
        <div class="an-kpi-icon"><span class="msi xs">${k.icon}</span></div>
        <span class="an-kpi-delta${k.up ? ' up' : ' down'}">${k.delta}</span>
      </div>
      <div class="an-kpi-value">${_fmt(k.val)}</div>
      <div class="an-kpi-label">${k.label}</div>
      <div class="an-sparkline">${_sparkHTML(k.key)}</div>
    </div>`).join('')}</div>`;
}

function _buildStorageSection() {
  const s = M.storage;
  const usedPct = (s.usedTB / s.totalTB * 100).toFixed(0);
  const freePct = (100 - +usedPct).toFixed(0);

  const donutSegs = [
    { value: s.usedTB,             color: 'var(--g900)' },
    { value: s.totalTB - s.usedTB, color: 'var(--g100)' },
  ];

  const typeLegend = s.types.map(t =>
    `<div class="an-leg-item">
      <div class="an-leg-dot" style="background:${t.color}"></div>
      <span class="an-leg-name">${t.ext}</span>
      <span class="an-leg-val">${t.gb} TB</span>
      <span class="an-leg-pct">${t.pct}%</span>
    </div>`
  ).join('');

  const growthSVG = _svgLine(s.growthData, s.growthLabels, { w: 320, h: 90, color: '#3b6fd4' });

  const typeSegs = s.types.map(t => ({ value: t.pct, color: t.color }));
  const typeDonut = _svgDonut(typeSegs, { size: 100, sw: 14 });

  return `
    <div class="an-grid-2">
      <div class="an-card">
        <div class="an-card-head">
          <span class="an-card-title"><span class="msi xs">database</span>Almacenamiento</span>
          <span class="an-card-badge">${usedPct}% usado</span>
        </div>
        <div class="an-donut-wrap">
          <div class="an-donut-center">
            ${_svgDonut(donutSegs, { size: 110, sw: 18 })}
            <div class="an-donut-lbl-inner">
              <span class="an-donut-lbl-val">${s.usedTB}</span>
              <span class="an-donut-lbl-sub">de ${s.totalTB} TB</span>
            </div>
          </div>
          <div style="flex:1;display:flex;flex-direction:column;gap:var(--space-3)">
            <div class="an-stat-rows">
              <div class="an-stat-row">
                <span class="an-stat-row-lbl"><span class="msi sm">storage</span>Usado</span>
                <div class="an-stat-row-right"><span class="an-stat-row-val">${s.usedTB} TB</span><span class="an-stat-row-sub">${usedPct}%</span></div>
              </div>
              <div class="an-stat-row">
                <span class="an-stat-row-lbl"><span class="msi sm">cloud</span>Disponible</span>
                <div class="an-stat-row-right"><span class="an-stat-row-val">${(s.totalTB - s.usedTB).toFixed(1)} TB</span><span class="an-stat-row-sub">${freePct}%</span></div>
              </div>
              <div class="an-stat-row">
                <span class="an-stat-row-lbl"><span class="msi sm">schedule</span>Proyección</span>
                <div class="an-stat-row-right"><span class="an-stat-row-val">${s.projectionDate}</span><span class="an-stat-row-sub">al ritmo actual</span></div>
              </div>
              <div class="an-stat-row">
                <span class="an-stat-row-lbl"><span class="msi sm">description</span>Promedio/archivo</span>
                <div class="an-stat-row-right"><span class="an-stat-row-val">${s.avgFileMB} MB</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="an-card">
        <div class="an-card-head">
          <span class="an-card-title"><span class="msi xs">show_chart</span>Crecimiento acumulado</span>
          <span class="an-card-badge">últimos 9 meses</span>
        </div>
        <div class="an-big">
          <span class="an-big-val">+${(s.growthData[s.growthData.length-1] - s.growthData[0]).toFixed(2)} TB</span>
          <span class="an-big-lbl">almacenamiento añadido en el período</span>
          <span class="an-badge warn">Al ritmo actual: +0.3 TB/mes</span>
        </div>
        <div class="an-line-wrap">${growthSVG}</div>
      </div>
    </div>

    <div class="an-card an-mb-4">
      <div class="an-card-head">
        <span class="an-card-title"><span class="msi xs">photo_library</span>Distribución por tipo</span>
        <span class="an-card-badge">${s.types.length} formatos</span>
      </div>
      <div class="an-donut-wrap">
        <div class="an-donut-center">
          ${typeDonut}
          <div class="an-donut-lbl-inner">
            <span class="an-donut-lbl-val" style="font-size:13px">tipos</span>
          </div>
        </div>
        <div class="an-donut-legend">${typeLegend}</div>
      </div>
    </div>`;
}

function _buildStructureSection() {
  const s = M.structure;
  const maxGB = Math.max(...s.heavyFolders.map(f => f.gb));

  const heavyItems = s.heavyFolders.map(f => ({ name: f.name, val: f.gb, label: `${f.gb} GB` }));
  const heavyList  = _hbarListHTML(heavyItems, maxGB, (it, i) => `var(--g${[950,800,700,600,500][i] || 600})`);

  const nestDonut = _svgDonut(s.nesting.map(n => ({ value: n.pct, color: n.color })), { size: 90, sw: 13 });
  const nestLegend = s.nesting.map(n =>
    `<div class="an-leg-item">
      <div class="an-leg-dot" style="background:${n.color}"></div>
      <span class="an-leg-name">${n.label}</span>
      <span class="an-leg-val">${n.pct}%</span>
    </div>`
  ).join('');

  return `
    <div class="an-grid-2">
      <div class="an-card">
        <div class="an-card-head">
          <span class="an-card-title"><span class="msi xs">folder_open</span>Carpetas más pesadas</span>
          <span class="an-card-badge">por GB</span>
        </div>
        ${heavyList}
      </div>

      <div class="an-card">
        <div class="an-card-head">
          <span class="an-card-title"><span class="msi xs">account_tree</span>Calidad de estructura</span>
        </div>
        <div class="an-alerts">
          <div class="an-alert-item">
            <div class="an-alert-icon warn"><span class="msi sm">content_copy</span></div>
            <div class="an-alert-body"><div class="an-alert-title">Archivos duplicados</div><div class="an-alert-sub">Detectados por reconocimiento facial + hash</div></div>
            <span class="an-alert-val">${s.duplicates}</span>
          </div>
          <div class="an-alert-item">
            <div class="an-alert-icon info"><span class="msi sm">cloud_off</span></div>
            <div class="an-alert-body"><div class="an-alert-title">Assets huérfanos</div><div class="an-alert-sub">Nunca descargados ni vinculados</div></div>
            <span class="an-alert-val">${s.orphans}</span>
          </div>
          <div class="an-alert-item">
            <div class="an-alert-icon danger"><span class="msi sm">label_off</span></div>
            <div class="an-alert-body"><div class="an-alert-title">Sin tags</div><div class="an-alert-sub">Calidad de catalogación baja</div></div>
            <span class="an-alert-val">${s.noTags}</span>
          </div>
          <div class="an-alert-item">
            <div class="an-alert-icon warn"><span class="msi sm">info</span></div>
            <div class="an-alert-body"><div class="an-alert-title">Sin metadata</div><div class="an-alert-sub">EXIF o campos vacíos</div></div>
            <span class="an-alert-val">${s.noMeta}</span>
          </div>
        </div>
        <div style="margin-top:var(--space-5)">
          <div style="font-size:11px;color:var(--g500);margin-bottom:var(--space-3);font-weight:500">Profundidad de carpetas</div>
          <div class="an-donut-wrap">
            <div class="an-donut-center">${nestDonut}</div>
            <div class="an-donut-legend">${nestLegend}</div>
          </div>
        </div>
      </div>
    </div>`;
}

function _buildActivitySection() {
  const a = M.activity;
  const totalUsers = a.active + a.inactive + a.guests;
  const userSegs = [
    { value: a.active,   color: 'var(--g950)' },
    { value: a.inactive, color: 'var(--g400)' },
    { value: a.guests,   color: 'var(--g200)' },
  ];
  const maxUpl = Math.max(...a.topUploaders.map(u => u.uploads));
  const maxAct = Math.max(...a.actions.map(ac => ac.n));

  const uplItems = a.topUploaders.map(u => ({ name: u.name, val: u.uploads, label: _fmt(u.uploads) }));
  const uplList  = _hbarListHTML(uplItems, maxUpl, (it, i) => `var(--g${[950,800,700,600,500][i] || 500})`);

  const actItems = a.actions.map(ac => ({ name: ac.label, val: ac.n, label: _fmt(ac.n), color: ac.color }));
  const actList  = _hbarListHTML(actItems, maxAct, it => it.color);

  // Heatmap
  const heatMax = Math.max(...a.heatData.flat());
  const heatHdrs = a.heatHours.map(h => `<span class="an-heatmap-hdr">${h}</span>`).join('');
  const heatRows = a.heatDays.map((day, di) => {
    const cells = a.heatData[di].map(v => {
      const op  = v === 0 ? 0 : 0.08 + (v / heatMax) * 0.82;
      return `<div class="an-heatmap-cell" style="background:rgba(34,37,47,${op.toFixed(2)});${v >= heatMax * 0.8 ? 'outline:1px solid rgba(34,37,47,.35)' : ''}"></div>`;
    }).join('');
    return `<div class="an-heatmap-row"><span class="an-heatmap-row-lbl">${day}</span>${cells}</div>`;
  }).join('');

  return `
    <div class="an-grid-3">
      <div class="an-card">
        <div class="an-card-head">
          <span class="an-card-title"><span class="msi xs">group</span>Usuarios</span>
          <span class="an-card-badge">${totalUsers} total</span>
        </div>
        <div class="an-donut-wrap">
          <div class="an-donut-center">
            ${_svgDonut(userSegs, { size: 100, sw: 14 })}
            <div class="an-donut-lbl-inner">
              <span class="an-donut-lbl-val">${totalUsers}</span>
            </div>
          </div>
          <div class="an-donut-legend">
            <div class="an-leg-item"><div class="an-leg-dot" style="background:var(--g950)"></div><span class="an-leg-name">Activos</span><span class="an-leg-val">${a.active}</span></div>
            <div class="an-leg-item"><div class="an-leg-dot" style="background:var(--g400)"></div><span class="an-leg-name">Inactivos</span><span class="an-leg-val">${a.inactive}</span></div>
            <div class="an-leg-item"><div class="an-leg-dot" style="background:var(--g200)"></div><span class="an-leg-name">Invitados</span><span class="an-leg-val">${a.guests}</span></div>
          </div>
        </div>
        <div style="margin-top:var(--space-4)">
          <div class="an-gauge-wrap">
            <div class="an-gauge-labels"><span class="an-gauge-lbl">Actividad</span><span class="an-gauge-lbl">${((a.active/totalUsers)*100).toFixed(0)}% activos</span></div>
            <div class="an-gauge"><div class="an-gauge-fill" style="width:${((a.active/totalUsers)*100).toFixed(0)}%"></div></div>
          </div>
        </div>
      </div>

      <div class="an-card">
        <div class="an-card-head">
          <span class="an-card-title"><span class="msi xs">cloud_upload</span>Top subidas</span>
          <span class="an-card-badge">por usuario</span>
        </div>
        ${uplList}
      </div>

      <div class="an-card">
        <div class="an-card-head">
          <span class="an-card-title"><span class="msi xs">bar_chart</span>Acciones</span>
          <span class="an-card-badge">por tipo</span>
        </div>
        ${actList}
      </div>
    </div>

    <div class="an-card an-mb-4">
      <div class="an-card-head">
        <span class="an-card-title"><span class="msi xs">calendar_view_week</span>Pico de actividad</span>
        <span class="an-card-badge">hora × día</span>
      </div>
      <div class="an-heatmap-outer">
        <div class="an-heatmap-hdrs">${heatHdrs}</div>
        <div class="an-heatmap-body">${heatRows}</div>
        <div style="margin-top:var(--space-3);display:flex;align-items:center;gap:8px">
          <span style="font-size:9px;color:var(--g400)">Menos</span>
          ${[0.08,0.25,0.45,0.65,0.85].map(op =>
            `<div style="width:14px;height:14px;border-radius:3px;background:rgba(34,37,47,${op})"></div>`
          ).join('')}
          <span style="font-size:9px;color:var(--g400)">Más</span>
        </div>
      </div>
    </div>`;
}

function _buildQualitySection() {
  const q = M.quality;
  const total = q.processed + q.pending;
  const procSegs = [
    { value: q.processed, color: 'var(--g900)' },
    { value: q.pending,   color: 'var(--g100)' },
  ];
  const matchLine = _svgLine([72, 75, 78, 80, 83, 85, 87.4], null, { w: 200, h: 60, color: 'var(--g700)', showDots: false });
  const delRows = q.deletions.map(d =>
    `<div class="an-alert-item">
      <div class="an-alert-icon danger"><span class="msi sm">delete_forever</span></div>
      <div class="an-alert-body"><div class="an-alert-title">${d.folder}</div><div class="an-alert-sub">${d.date}</div></div>
      <span class="an-alert-val">${d.n} arch.</span>
    </div>`
  ).join('');

  return `
    <div class="an-grid-2">
      <div class="an-card">
        <div class="an-card-head">
          <span class="an-card-title"><span class="msi xs">ar_on_you</span>Procesamiento facial</span>
          <span class="an-card-badge">${((q.processed/total)*100).toFixed(0)}% completado</span>
        </div>
        <div class="an-donut-wrap">
          <div class="an-donut-center">
            ${_svgDonut(procSegs, { size: 110, sw: 18 })}
            <div class="an-donut-lbl-inner">
              <span class="an-donut-lbl-val" style="font-size:15px">${_fmt(q.processed)}</span>
              <span class="an-donut-lbl-sub">procesados</span>
            </div>
          </div>
          <div style="flex:1;display:flex;flex-direction:column;gap:var(--space-3)">
            <div class="an-stat-rows">
              <div class="an-stat-row">
                <span class="an-stat-row-lbl"><span class="msi sm">check_circle</span>Procesados</span>
                <div class="an-stat-row-right"><span class="an-stat-row-val">${_fmt(q.processed)}</span></div>
              </div>
              <div class="an-stat-row">
                <span class="an-stat-row-lbl"><span class="msi sm">hourglass_empty</span>Pendientes</span>
                <div class="an-stat-row-right"><span class="an-stat-row-val">${_fmt(q.pending)}</span></div>
              </div>
            </div>
            <div>
              <div style="display:flex;justify-content:space-between;margin-bottom:5px">
                <span style="font-size:10px;color:var(--g500)">Tasa de match facial</span>
                <span style="font-family:var(--font-mono);font-size:11px;color:#0a9461;font-weight:600">${q.matchRate}%</span>
              </div>
              <div class="an-line-wrap" style="height:60px">${matchLine}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="an-card">
        <div class="an-card-head">
          <span class="an-card-title"><span class="msi xs">delete_sweep</span>Eliminaciones recientes</span>
          <span class="an-card-badge">monitoreo</span>
        </div>
        <div class="an-alerts">${delRows}</div>
        <div class="an-badge danger" style="margin-top:var(--space-4)"><span class="msi sm" style="font-size:11px">warning</span> ${q.deletions.reduce((s,d)=>s+d.n,0)} archivos eliminados este mes</div>
      </div>
    </div>`;
}

function _buildFaceDetailSection(faces) {
  const items = faces.all.map(f => {
    const av = f.selfieUrl
      ? `<img class="an-fdi-avatar" src="${f.selfieUrl}" alt="" loading="lazy">`
      : `<div class="an-fdi-ph"><span class="msi xs">person</span></div>`;
    const nm = f.unnamed ? 'Sin identificar' : f.displayName;
    return `<div class="an-fdi">${av}<div class="an-fdi-info"><div class="an-fdi-name${f.unnamed?' un':''}">${nm}</div><span class="an-fdi-count">${f.photos}</span><span class="an-fdi-sub">${f.photos===1?'foto':'fotos'}</span></div></div>`;
  }).join('');
  return `<div class="an-card an-mb-4">
    <div class="an-card-head">
      <span class="an-card-title"><span class="msi xs">grid_view</span>Detalle por Face ID</span>
      <span class="an-card-badge">${faces.all.length} personas</span>
    </div>
    <div class="an-faces-detail-grid">${items}</div>
  </div>`;
}

// ── Portales Tab sections ─────────────────────────────────────────────────

function _buildPortalInventory() {
  const p = M.portales;
  const total = p.active + p.expired + p.draft;
  const statusSegs = [
    { value: p.active,  color: 'var(--g950)' },
    { value: p.expired, color: 'var(--g400)' },
    { value: p.draft,   color: 'var(--g200)' },
  ];
  const masterRatio = ((p.masters / (p.masters + p.regulars)) * 100).toFixed(0);

  const byFolderItems = p.byFolder.map(f => ({ name: f.name, val: f.count, label: `${f.count}` }));
  const maxF = Math.max(...p.byFolder.map(f => f.count));
  const byFolderList = _hbarListHTML(byFolderItems, maxF, (it, i) => `var(--g${[950,800,700,600,500,400][i] || 500})`);

  return `
    <div class="an-grid-1-2">
      <div class="an-card">
        <div class="an-card-head">
          <span class="an-card-title"><span class="msi xs">captive_portal</span>Estado de portales</span>
          <span class="an-card-badge">${total} total</span>
        </div>
        <div class="an-donut-wrap">
          <div class="an-donut-center">
            ${_svgDonut(statusSegs, { size: 100, sw: 14 })}
            <div class="an-donut-lbl-inner">
              <span class="an-donut-lbl-val">${total}</span>
            </div>
          </div>
          <div class="an-donut-legend">
            <div class="an-leg-item"><div class="an-leg-dot" style="background:var(--g950)"></div><span class="an-leg-name">Activos</span><span class="an-leg-val">${p.active}</span></div>
            <div class="an-leg-item"><div class="an-leg-dot" style="background:var(--g400)"></div><span class="an-leg-name">Expirados</span><span class="an-leg-val">${p.expired}</span></div>
            <div class="an-leg-item"><div class="an-leg-dot" style="background:var(--g200)"></div><span class="an-leg-name">Borrador</span><span class="an-leg-val">${p.draft}</span></div>
          </div>
        </div>
        <div class="an-mini-grid" style="grid-template-columns:1fr 1fr;margin-top:var(--space-5)">
          <div class="an-mini violet">
            <span class="an-mini-val">${p.masters}</span>
            <span class="an-mini-lbl">Masters</span>
          </div>
          <div class="an-mini gray">
            <span class="an-mini-val">${p.regulars}</span>
            <span class="an-mini-lbl">Regulares</span>
          </div>
        </div>
        <div style="margin-top:var(--space-4)">
          <div class="an-gauge-wrap">
            <div class="an-gauge-labels"><span class="an-gauge-lbl">Ratio masters</span><span class="an-gauge-lbl">${masterRatio}%</span></div>
            <div class="an-gauge"><div class="an-gauge-fill warm" style="width:${masterRatio}%"></div></div>
          </div>
        </div>
        <div class="an-stat-rows" style="margin-top:var(--space-3)">
          <div class="an-stat-row">
            <span class="an-stat-row-lbl"><span class="msi sm">schedule</span>Antigüedad promedio</span>
            <div class="an-stat-row-right"><span class="an-stat-row-val">${p.avgAgeDays} días</span></div>
          </div>
        </div>
      </div>

      <div class="an-card">
        <div class="an-card-head">
          <span class="an-card-title"><span class="msi xs">folder_special</span>Portales por carpeta</span>
          <span class="an-card-badge">${p.byFolder.length} eventos</span>
        </div>
        ${byFolderList}
      </div>
    </div>`;
}

function _buildEngagementSection() {
  const e = M.portales.engagement;
  const radarSVG = _svgRadar(e.radarAxes, e.radarValues, { size: 170, color: '#3b6fd4' });
  const radarLegend = e.radarAxes.map((ax, i) =>
    `<div class="an-radar-leg-item">
      <div class="an-radar-dot" style="background:var(--g700)"></div>
      <span class="an-radar-leg-name">${ax}</span>
      <span class="an-radar-leg-val">${(e.radarValues[i] * 100).toFixed(0)}%</span>
    </div>`
  ).join('');

  const srcItems = e.sources.map(s => ({ name: s.label, val: s.pct, label: `${s.pct}%`, color: s.color }));
  const srcList  = _hbarListHTML(srcItems, 100, it => it.color);

  const convRows = M.portales.topViews.map(p => {
    const cvrClass = p.cvr >= 23 ? 'hi' : p.cvr >= 19 ? 'mid' : 'lo';
    return `<div class="an-conv-row">
      <span class="an-conv-name">${p.title}</span>
      <span class="an-conv-num">${_fmt(p.views)}</span>
      <span class="an-conv-num">${_fmt(p.dl)}</span>
      <span class="an-conv-badge ${cvrClass}">${p.cvr}%</span>
    </div>`;
  }).join('');

  const viewsSVG = _svgLine(M.portales.viewsOverTime, M.portales.viewsLabels, { w: 320, h: 80, color: 'var(--g700)' });

  return `
    <div class="an-grid-2">
      <div class="an-card">
        <div class="an-card-head">
          <span class="an-card-title"><span class="msi xs">radar</span>Radar de engagement</span>
          <span class="an-card-badge">portales activos</span>
        </div>
        <div class="an-radar-wrap">
          ${radarSVG}
          <div class="an-radar-legend">${radarLegend}</div>
        </div>
        <div class="an-mini-grid" style="margin-top:var(--space-5)">
          <div class="an-mini blue">
            <span class="an-mini-val">${e.avgTime}</span>
            <span class="an-mini-lbl">Tiempo prom.</span>
          </div>
          <div class="an-mini green">
            <span class="an-mini-val">${e.assetsPerSession}</span>
            <span class="an-mini-lbl">Assets/sesión</span>
          </div>
          <div class="an-mini amber">
            <span class="an-mini-val">${M.portales.inactive}</span>
            <span class="an-mini-lbl">Sin actividad</span>
          </div>
        </div>
      </div>

      <div class="an-card">
        <div class="an-card-head">
          <span class="an-card-title"><span class="msi xs">devices</span>Acceso por dispositivo</span>
        </div>
        <div class="an-split-bar" style="margin-bottom:var(--space-2)">
          <div class="an-split-seg" style="width:${e.mobile}%;background:var(--g800)"></div>
          <div class="an-split-seg" style="width:${e.desktop}%;background:var(--g400)"></div>
        </div>
        <div class="an-split-legend" style="margin-bottom:var(--space-5)">
          <div class="an-split-leg-item"><div class="an-split-dot" style="background:var(--g800)"></div><span class="an-split-leg-lbl">Móvil</span> <span class="an-split-leg-val">&nbsp;${e.mobile}%</span></div>
          <div class="an-split-leg-item"><div class="an-split-dot" style="background:var(--g400)"></div><span class="an-split-leg-lbl">Desktop</span><span class="an-split-leg-val">&nbsp;${e.desktop}%</span></div>
        </div>
        <div class="an-card-head" style="margin-bottom:12px;margin-top:var(--space-2)">
          <span class="an-card-title" style="font-size:12px;color:var(--g600)"><span class="msi xs">link</span>Origen de tráfico</span>
        </div>
        ${srcList}
      </div>
    </div>

    <div class="an-card an-mb-4">
      <div class="an-card-head">
        <span class="an-card-title"><span class="msi xs">show_chart</span>Vistas totales en el tiempo</span>
        <span class="an-card-badge">últimos 9 meses</span>
      </div>
      <div class="an-big" style="margin-bottom:var(--space-3)">
        <span class="an-big-val">${_fmt(M.portales.viewsOverTime[M.portales.viewsOverTime.length-1])}</span>
        <span class="an-big-lbl">vistas acumuladas en todos los portales</span>
      </div>
      <div class="an-line-wrap">${viewsSVG}</div>
    </div>

    <div class="an-card an-mb-4">
      <div class="an-card-head">
        <span class="an-card-title"><span class="msi xs">leaderboard</span>Conversión por portal</span>
        <span class="an-card-badge">vista → descarga</span>
      </div>
      <div class="an-conv-hdr">
        <span class="an-conv-hdr-cell">Portal</span>
        <span class="an-conv-hdr-cell">Vistas</span>
        <span class="an-conv-hdr-cell">Descargas</span>
        <span class="an-conv-hdr-cell">Conv.</span>
      </div>
      <div class="an-conv-rows">${convRows}</div>
    </div>`;
}

function _buildSecuritySection() {
  const sec = M.portales.security;
  const totalP = sec.withPwd + sec.public;
  const pwdSegs = [
    { value: sec.withPwd, color: 'var(--g900)' },
    { value: sec.public,  color: 'var(--g200)' },
  ];
  const expiryRows = sec.expiring.map(p =>
    `<div class="an-expiry-item">
      <span class="an-expiry-name">${p.title}</span>
      <span class="an-expiry-date"><span class="msi sm" style="font-size:11px">event</span> ${p.expires}</span>
    </div>`
  ).join('');

  return `
    <div class="an-grid-2">
      <div class="an-card">
        <div class="an-card-head">
          <span class="an-card-title"><span class="msi xs">lock</span>Acceso y seguridad</span>
          <span class="an-card-badge">${totalP} portales</span>
        </div>
        <div class="an-donut-wrap">
          <div class="an-donut-center">
            ${_svgDonut(pwdSegs, { size: 100, sw: 14 })}
            <div class="an-donut-lbl-inner">
              <span class="an-donut-lbl-val">${sec.withPwd}</span>
              <span class="an-donut-lbl-sub">con pwd</span>
            </div>
          </div>
          <div class="an-donut-legend">
            <div class="an-leg-item"><div class="an-leg-dot" style="background:var(--g900)"></div><span class="an-leg-name">Con contraseña</span><span class="an-leg-val">${sec.withPwd}</span><span class="an-leg-pct">${((sec.withPwd/totalP)*100).toFixed(0)}%</span></div>
            <div class="an-leg-item"><div class="an-leg-dot" style="background:var(--g200)"></div><span class="an-leg-name">Públicos</span><span class="an-leg-val">${sec.public}</span><span class="an-leg-pct">${((sec.public/totalP)*100).toFixed(0)}%</span></div>
          </div>
        </div>
        <div class="an-mini-grid" style="grid-template-columns:1fr 1fr;margin-top:var(--space-5)">
          <div class="an-mini rose">
            <span class="an-mini-val">${sec.failed}</span>
            <span class="an-mini-lbl">Accesos fallidos</span>
          </div>
          <div class="an-mini amber">
            <span class="an-mini-val">${sec.expiring.length}</span>
            <span class="an-mini-lbl">Expiran pronto</span>
          </div>
        </div>
      </div>

      <div class="an-card">
        <div class="an-card-head">
          <span class="an-card-title"><span class="msi xs">event_busy</span>Portales por vencer</span>
          <span class="an-card-badge">próximos 7 días</span>
        </div>
        <div class="an-expiry-list">${expiryRows}</div>
        <div style="margin-top:var(--space-5)">
          <div class="an-badge warn"><span class="msi sm" style="font-size:11px">notifications</span> ${sec.expiring.length} portales expiran esta semana — oportunidad comercial</div>
        </div>
      </div>
    </div>`;
}

// ── Filter bars ───────────────────────────────────────────────────────────

function _filterDAM() {
  const periods = [
    { key:'7d', lbl:'7 días' }, { key:'30d', lbl:'30 días' },
    { key:'3m', lbl:'3 meses' }, { key:'all', lbl:'Todo' },
  ].map(p => `<button class="an-pill${_period === p.key ? ' active' : ''}" data-period="${p.key}">${p.lbl}</button>`).join('');
  return `<div class="an-filter">
    <span class="an-filter-label">Periodo</span>
    ${periods}
    <div class="an-filter-sep"></div>
    <span class="an-filter-label">Carpeta</span>
    <select class="an-filter-select">
      <option>Todas las carpetas</option>
      <option>Lima 42K 2026</option>
      <option>Wings for Life</option>
      <option>Rimac Bienestar</option>
    </select>
    <span class="an-filter-spacer"></span>
    <span class="an-updated"><span class="an-dot"></span>Actualizado hoy</span>
  </div>`;
}

function _filterPortales() {
  const periods = [
    { key:'7d', lbl:'7 días' }, { key:'30d', lbl:'30 días' },
    { key:'3m', lbl:'3 meses' }, { key:'all', lbl:'Todo' },
  ].map(p => `<button class="an-pill${_period === p.key ? ' active' : ''}" data-period="${p.key}">${p.lbl}</button>`).join('');
  return `<div class="an-filter">
    <span class="an-filter-label">Periodo</span>
    ${periods}
    <div class="an-filter-sep"></div>
    <span class="an-filter-label">Portal</span>
    <select class="an-filter-select">
      <option>Todos los portales</option>
      <option>Lima 42K 2026</option>
      <option>Rimac Bienestar</option>
      <option>Wings for Life</option>
    </select>
    <span class="an-filter-spacer"></span>
    <span class="an-updated"><span class="an-dot"></span>Actualizado hoy</span>
  </div>`;
}

// ── Full HTML build ───────────────────────────────────────────────────────

function _buildHTML() {
  const faces = _faceStats();
  const total = _totalFiles();

  const tabs = `<div class="tabs">
    <div class="tab${_tab === 'dam' ? ' active' : ''}" data-tab="dam">DAM — Assets</div>
    <div class="tab${_tab === 'portales' ? ' active' : ''}" data-tab="portales">Portales</div>
  </div>`;

  let content = '';

  if (_tab === 'dam') {
    content = `
      ${_filterDAM()}
      <div class="an-section-lbl no-top"><span class="msi xs">ar_on_you</span>Face IDs — reconocimiento facial</div>
      ${_buildFaceHero(faces)}
      <div class="an-section-lbl"><span class="msi xs">timeline</span>KPIs del período</div>
      ${_buildKPIs(total)}
      <div class="an-section-lbl"><span class="msi xs">database</span>Storage y volumen</div>
      ${_buildStorageSection()}
      <div class="an-section-lbl"><span class="msi xs">account_tree</span>Estructura y contenido</div>
      ${_buildStructureSection()}
      <div class="an-section-lbl"><span class="msi xs">group</span>Actividad de usuarios</div>
      ${_buildActivitySection()}
      <div class="an-section-lbl"><span class="msi xs">memory</span>Calidad y procesamiento</div>
      ${_buildQualitySection()}
      <div class="an-section-lbl"><span class="msi xs">grid_view</span>Detalle Face IDs</div>
      ${_buildFaceDetailSection(faces)}`;
  } else {
    content = `
      ${_filterPortales()}
      <div class="an-section-lbl no-top"><span class="msi xs">captive_portal</span>Inventario de portales</div>
      ${_buildPortalInventory()}
      <div class="an-section-lbl"><span class="msi xs">insights</span>Engagement</div>
      ${_buildEngagementSection()}
      <div class="an-section-lbl"><span class="msi xs">lock</span>Acceso y seguridad</div>
      ${_buildSecuritySection()}`;
  }

  return `<div class="an-wrap">${tabs}${content}</div>`;
}

// ── Events ────────────────────────────────────────────────────────────────

function _bindEvents(sec) {
  sec.querySelectorAll('.tab[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      _tab = btn.dataset.tab;
      renderAnalytics();
    });
  });
  sec.querySelectorAll('.an-pill[data-period]').forEach(btn => {
    btn.addEventListener('click', () => {
      _period = btn.dataset.period;
      renderAnalytics();
    });
  });
}

// ── Export ────────────────────────────────────────────────────────────────

export function renderAnalytics() {
  const sec = document.getElementById('sec-analytics');
  if (!sec) return;
  sec.innerHTML = _buildHTML();
  _bindEvents(sec);
}
