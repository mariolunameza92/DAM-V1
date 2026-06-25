// DAM tab sections + filter bar.
// Exports: buildFaceHero, buildKPIs, buildStorageSection, buildStructureSection,
//          buildActivitySection, buildQualitySection, buildFaceDetailSection, filterDAM

import { M, RAMP, sparkHTML, fmt } from './analytics-data.js';
import { svgDonut, svgLine, hbarListHTML } from './analytics-charts.js';
import { alertItem } from '../../components/atoms/alert-item.js';
import { cardHead, statRow, statRows, legendItem, gaugeBar, bigNumber, anBadge } from './analytics-helpers.js';

export function buildFaceHero(faces) {
  const maxP      = Math.max(...faces.top.map(f => f.photos), 1);
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

export function buildKPIs(total, period) {
  const mult = { '7d':[.05,47,23], '30d':[.18,183,94], '3m':[.62,521,276], 'all':[1,847,418] };
  const [um, pv, dl] = mult[period] || mult['30d'];
  const kpis = [
    { key:'total',       cls:'kc-blue',  icon:'folder_open',    label:'Archivos totales',  val: total,                  delta:'+12%', up:true },
    { key:'uploads',     cls:'kc-green', icon:'cloud_upload',   label:'Subidas este mes',  val: Math.round(total * um), delta:'+8%',  up:true },
    { key:'portalViews', cls:'kc-amber', icon:'captive_portal', label:'Vistas portales',   val: pv,                     delta:'+24%', up:true },
    { key:'downloads',   cls:'kc-rose',  icon:'download',       label:'Descargas',         val: dl,                     delta:'+5%',  up:true },
  ];
  return `<div class="an-kpi-grid">${kpis.map(k => `
    <div class="an-kpi ${k.cls}">
      <div class="an-kpi-top">
        <div class="an-kpi-icon"><span class="msi">${k.icon}</span></div>
        <span class="an-kpi-delta${k.up ? ' up' : ' down'}">${k.delta}</span>
      </div>
      <div class="an-kpi-value">${fmt(k.val)}</div>
      <div class="an-kpi-label">${k.label}</div>
      <div class="an-sparkline">${sparkHTML(k.key, period)}</div>
    </div>`).join('')}</div>`;
}

export function buildStorageSection() {
  const s       = M.storage;
  const usedPct = (s.usedTB / s.totalTB * 100).toFixed(0);
  const freePct = (100 - +usedPct).toFixed(0);
  const growthDiff = (s.growthData[s.growthData.length - 1] - s.growthData[0]).toFixed(2);

  const donutSegs  = [
    { value: s.usedTB,             color: 'var(--viz-1)' },
    { value: s.totalTB - s.usedTB, color: 'var(--viz-6)' },
  ];
  const typeLegend = s.types.map(t => legendItem(t.color, t.ext, `${t.gb} TB`, `${t.pct}%`)).join('');
  const growthSVG  = svgLine(s.growthData, s.growthLabels, { w: 320, h: 90, color: 'var(--viz-2)' });
  const typeDonut  = svgDonut(s.types.map(t => ({ value: t.pct, color: t.color })), { size: 100, sw: 14 });

  return `
    <div class="an-grid-2">
      <div class="an-card">
        ${cardHead('database', 'Almacenamiento', `${usedPct}% usado`)}
        <div class="an-donut-wrap">
          <div class="an-donut-center">
            ${svgDonut(donutSegs, { size: 110, sw: 18 })}
            <div class="an-donut-lbl-inner">
              <span class="an-donut-lbl-val">${s.usedTB}</span>
              <span class="an-donut-lbl-sub">de ${s.totalTB} TB</span>
            </div>
          </div>
          <div style="flex:1;display:flex;flex-direction:column;gap:var(--space-3)">
            ${statRows(
              statRow('storage',     'Usado',             `${s.usedTB} TB`,                          usedPct + '%') +
              statRow('cloud',       'Disponible',        `${(s.totalTB - s.usedTB).toFixed(1)} TB`, freePct + '%') +
              statRow('schedule',    'Proyección',        s.projectionDate,                           'al ritmo actual') +
              statRow('description', 'Promedio/archivo',  `${s.avgFileMB} MB`)
            )}
          </div>
        </div>
      </div>

      <div class="an-card">
        ${cardHead('show_chart', 'Crecimiento acumulado', 'últimos 9 meses')}
        ${bigNumber(`+${growthDiff} TB`, 'almacenamiento añadido en el período', anBadge('warn', 'Al ritmo actual: +0.3 TB/mes'))}
        <div class="an-line-wrap">${growthSVG}</div>
      </div>
    </div>

    <div class="an-card an-mb-4">
      ${cardHead('photo_library', 'Distribución por tipo', `${s.types.length} formatos`)}
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

export function buildStructureSection() {
  const s      = M.structure;
  const maxGB  = Math.max(...s.heavyFolders.map(f => f.gb));
  const heavyItems = s.heavyFolders.map(f => ({ name: f.name, val: f.gb, label: `${f.gb} GB` }));
  const heavyList  = hbarListHTML(heavyItems, maxGB, (it, i) => RAMP[i] || 'var(--text-secondary)');
  const nestDonut  = svgDonut(s.nesting.map(n => ({ value: n.pct, color: n.color })), { size: 90, sw: 13 });
  const nestLegend = s.nesting.map(n => legendItem(n.color, n.label, `${n.pct}%`)).join('');

  return `
    <div class="an-grid-2">
      <div class="an-card">
        ${cardHead('folder_open', 'Carpetas más pesadas', 'por GB')}
        ${heavyList}
      </div>

      <div class="an-card">
        ${cardHead('account_tree', 'Calidad de estructura')}
        <div class="an-alerts">
          ${alertItem('content_copy', 'Archivos duplicados', 'Detectados por reconocimiento facial + hash', s.duplicates)}
          ${alertItem('cloud_off',    'Assets huérfanos',    'Nunca descargados ni vinculados',             s.orphans)}
          ${alertItem('label_off',    'Sin tags',            'Calidad de catalogación baja',                s.noTags)}
          ${alertItem('info',         'Sin metadata',        'EXIF o campos vacíos',                        s.noMeta)}
        </div>
        <div style="margin-top:var(--space-5)">
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:var(--space-3);font-weight:500">Profundidad de carpetas</div>
          <div class="an-donut-wrap">
            <div class="an-donut-center">${nestDonut}</div>
            <div class="an-donut-legend">${nestLegend}</div>
          </div>
        </div>
      </div>
    </div>`;
}

export function buildActivitySection() {
  const a          = M.activity;
  const totalUsers = a.active + a.inactive + a.guests;
  const activePct  = ((a.active / totalUsers) * 100).toFixed(0);
  const userSegs   = [
    { value: a.active,   color: 'var(--viz-1)' },
    { value: a.inactive, color: 'var(--viz-4)' },
    { value: a.guests,   color: 'var(--viz-6)' },
  ];

  const maxUpl   = Math.max(...a.topUploaders.map(u => u.uploads));
  const maxAct   = Math.max(...a.actions.map(ac => ac.n));
  const uplItems = a.topUploaders.map(u => ({ name: u.name, val: u.uploads, label: fmt(u.uploads) }));
  const uplList  = hbarListHTML(uplItems, maxUpl, (it, i) => RAMP[i] || 'var(--text-muted)');
  const actItems = a.actions.map(ac => ({ name: ac.label, val: ac.n, label: fmt(ac.n), color: ac.color }));
  const actList  = hbarListHTML(actItems, maxAct, it => it.color);

  const heatMax  = Math.max(...a.heatData.flat());
  const heatHdrs = a.heatHours.map(h => `<span class="an-heatmap-hdr">${h}</span>`).join('');
  const heatCols = a.heatHours.length;
  const heatRows = a.heatDays.map((day, di) => {
    const cells = a.heatData[di].map((v, ci) => {
      const op    = v === 0 ? 0 : 0.08 + (v / heatMax) * 0.82;
      const delay = ((di * heatCols + ci) * 0.018).toFixed(3);
      return `<div class="an-heatmap-cell" style="background:color-mix(in srgb, var(--dataviz-ink) ${(op * 100).toFixed(0)}%, transparent);animation-delay:${delay}s${v >= heatMax * 0.8 ? ';outline:1px solid color-mix(in srgb, var(--dataviz-ink) 35%, transparent)' : ''}"></div>`;
    }).join('');
    return `<div class="an-heatmap-row"><span class="an-heatmap-row-lbl">${day}</span>${cells}</div>`;
  }).join('');

  return `
    <div class="an-grid-3">
      <div class="an-card">
        ${cardHead('group', 'Usuarios', `${totalUsers} total`)}
        <div class="an-donut-wrap">
          <div class="an-donut-center">
            ${svgDonut(userSegs, { size: 100, sw: 14 })}
            <div class="an-donut-lbl-inner">
              <span class="an-donut-lbl-val">${totalUsers}</span>
            </div>
          </div>
          <div class="an-donut-legend">
            ${legendItem('var(--text-strong)',     'Activos',   a.active)}
            ${legendItem('var(--text-faint)',      'Inactivos', a.inactive)}
            ${legendItem('var(--surface-neutral)', 'Invitados', a.guests)}
          </div>
        </div>
        <div style="margin-top:var(--space-4)">
          ${gaugeBar('Actividad', `${activePct}% activos`, activePct)}
        </div>
      </div>

      <div class="an-card">
        ${cardHead('cloud_upload', 'Top subidas', 'por usuario')}
        ${uplList}
      </div>

      <div class="an-card">
        ${cardHead('bar_chart', 'Acciones', 'por tipo')}
        ${actList}
      </div>
    </div>

    <div class="an-card an-mb-4">
      ${cardHead('calendar_view_week', 'Pico de actividad', 'hora × día')}
      <div class="an-heatmap-outer">
        <div class="an-heatmap-hdrs">${heatHdrs}</div>
        <div class="an-heatmap-body">${heatRows}</div>
        <div style="margin-top:var(--space-3);display:flex;align-items:center;gap:8px">
          <span style="font-size:9px;color:var(--text-faint)">Menos</span>
          ${[0.08,0.25,0.45,0.65,0.85].map(op =>
            `<div style="width:14px;height:14px;border-radius:3px;background:color-mix(in srgb, var(--dataviz-ink) ${op * 100}%, transparent)"></div>`
          ).join('')}
          <span style="font-size:9px;color:var(--text-faint)">Más</span>
        </div>
      </div>
    </div>`;
}

export function buildQualitySection() {
  const q       = M.quality;
  const total   = q.processed + q.pending;
  const procPct = ((q.processed / total) * 100).toFixed(0);
  const procSegs = [
    { value: q.processed, color: 'var(--text-title)' },
    { value: q.pending,   color: 'var(--border-subtle)' },
  ];
  const matchLine = svgLine([72, 75, 78, 80, 83, 85, 87.4], null, { w: 200, h: 60, color: 'var(--text-body)', showDots: false });
  const totalDel  = q.deletions.reduce((s, d) => s + d.n, 0);
  const delRows   = q.deletions.map(d => alertItem('delete_forever', d.folder, d.date, `${d.n} arch.`)).join('');

  return `
    <div class="an-grid-2">
      <div class="an-card">
        ${cardHead('ar_on_you', 'Procesamiento facial', `${procPct}% completado`)}
        <div class="an-donut-wrap">
          <div class="an-donut-center">
            ${svgDonut(procSegs, { size: 110, sw: 18 })}
            <div class="an-donut-lbl-inner">
              <span class="an-donut-lbl-val" style="font-size:15px">${fmt(q.processed)}</span>
              <span class="an-donut-lbl-sub">procesados</span>
            </div>
          </div>
          <div style="flex:1;display:flex;flex-direction:column;gap:var(--space-3)">
            ${statRows(
              statRow('check_circle',    'Procesados', fmt(q.processed)) +
              statRow('hourglass_empty', 'Pendientes', fmt(q.pending))
            )}
            <div>
              <div style="display:flex;justify-content:space-between;margin-bottom:5px">
                <span style="font-size:10px;color:var(--text-muted)">Tasa de match facial</span>
                <span style="font-family:var(--font-mono);font-size:11px;color:var(--success);font-weight:600">${q.matchRate}%</span>
              </div>
              <div class="an-line-wrap" style="height:60px">${matchLine}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="an-card">
        ${cardHead('delete_sweep', 'Eliminaciones recientes', 'monitoreo')}
        <div class="an-alerts">${delRows}</div>
        ${anBadge('danger', `${totalDel} archivos eliminados este mes`, 'warning', 'margin-top:var(--space-4)')}
      </div>
    </div>`;
}

export function buildFaceDetailSection(faces) {
  const items = faces.all.map(f => {
    const av = f.selfieUrl
      ? `<img class="an-fdi-avatar" src="${f.selfieUrl}" alt="" loading="lazy">`
      : `<div class="an-fdi-ph"><span class="msi">person</span></div>`;
    const nm = f.unnamed ? 'Sin identificar' : f.displayName;
    return `<div class="an-fdi">${av}<div class="an-fdi-info"><div class="an-fdi-name${f.unnamed ? ' un' : ''}">${nm}</div><span class="an-fdi-count">${f.photos}</span><span class="an-fdi-sub">${f.photos === 1 ? 'foto' : 'fotos'}</span></div></div>`;
  }).join('');
  return `<div class="an-card an-mb-4">
    ${cardHead('grid_view', 'Detalle por Face ID', `${faces.all.length} personas`)}
    <div class="an-faces-detail-grid">${items}</div>
  </div>`;
}

export function filterDAM(period) {
  const periods = [
    { key:'7d', lbl:'7 días' }, { key:'30d', lbl:'30 días' },
    { key:'3m', lbl:'3 meses' }, { key:'all', lbl:'Todo' },
  ].map(p => `<button class="an-pill${period === p.key ? ' active' : ''}" data-period="${p.key}">${p.lbl}</button>`).join('');
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
