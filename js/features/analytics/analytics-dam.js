// DAM tab sections + filter bar.
// Exports: buildFaceHero, buildKPIs, buildStorageSection, buildStructureSection,
//          buildActivitySection, buildQualitySection, buildFaceDetailSection, filterDAM

import { M, RAMP, sparkHTML, fmt } from './analytics-data.js';
import { svgDonut, svgLine, hbarListHTML } from './analytics-charts.js';

export function buildFaceHero(faces) {
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

export function buildKPIs(total, period) {
  const mult = { '7d':[.05,47,23], '30d':[.18,183,94], '3m':[.62,521,276], 'all':[1,847,418] };
  const [um, pv, dl] = mult[period] || mult['30d'];
  const kpis = [
    { key:'total',       cls:'kc-blue',   icon:'folder_open',    label:'Archivos totales',   val: total,                    delta:'+12%', up:true  },
    { key:'uploads',     cls:'kc-green',  icon:'cloud_upload',   label:'Subidas este mes',    val: Math.round(total * um),   delta:'+8%',  up:true  },
    { key:'portalViews', cls:'kc-amber',  icon:'captive_portal', label:'Vistas portales',     val: pv,                       delta:'+24%', up:true  },
    { key:'downloads',   cls:'kc-rose',   icon:'download',       label:'Descargas',           val: dl,                       delta:'+5%',  up:true  },
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
  const s = M.storage;
  const usedPct = (s.usedTB / s.totalTB * 100).toFixed(0);
  const freePct = (100 - +usedPct).toFixed(0);

  const donutSegs = [
    { value: s.usedTB,             color: 'var(--viz-1)' },
    { value: s.totalTB - s.usedTB, color: 'var(--viz-6)' },
  ];

  const typeLegend = s.types.map(t =>
    `<div class="an-leg-item">
      <div class="an-leg-dot" style="background:${t.color}"></div>
      <span class="an-leg-name">${t.ext}</span>
      <span class="an-leg-val">${t.gb} TB</span>
      <span class="an-leg-pct">${t.pct}%</span>
    </div>`
  ).join('');

  const growthSVG = svgLine(s.growthData, s.growthLabels, { w: 320, h: 90, color: 'var(--viz-2)' });

  const typeSegs = s.types.map(t => ({ value: t.pct, color: t.color }));
  const typeDonut = svgDonut(typeSegs, { size: 100, sw: 14 });

  return `
    <div class="an-grid-2">
      <div class="an-card">
        <div class="an-card-head">
          <span class="an-card-title"><span class="msi">database</span>Almacenamiento</span>
          <span class="an-card-badge">${usedPct}% usado</span>
        </div>
        <div class="an-donut-wrap">
          <div class="an-donut-center">
            ${svgDonut(donutSegs, { size: 110, sw: 18 })}
            <div class="an-donut-lbl-inner">
              <span class="an-donut-lbl-val">${s.usedTB}</span>
              <span class="an-donut-lbl-sub">de ${s.totalTB} TB</span>
            </div>
          </div>
          <div style="flex:1;display:flex;flex-direction:column;gap:var(--space-3)">
            <div class="an-stat-rows">
              <div class="an-stat-row">
                <span class="an-stat-row-lbl"><span class="msi">storage</span>Usado</span>
                <div class="an-stat-row-right"><span class="an-stat-row-val">${s.usedTB} TB</span><span class="an-stat-row-sub">${usedPct}%</span></div>
              </div>
              <div class="an-stat-row">
                <span class="an-stat-row-lbl"><span class="msi">cloud</span>Disponible</span>
                <div class="an-stat-row-right"><span class="an-stat-row-val">${(s.totalTB - s.usedTB).toFixed(1)} TB</span><span class="an-stat-row-sub">${freePct}%</span></div>
              </div>
              <div class="an-stat-row">
                <span class="an-stat-row-lbl"><span class="msi">schedule</span>Proyección</span>
                <div class="an-stat-row-right"><span class="an-stat-row-val">${s.projectionDate}</span><span class="an-stat-row-sub">al ritmo actual</span></div>
              </div>
              <div class="an-stat-row">
                <span class="an-stat-row-lbl"><span class="msi">description</span>Promedio/archivo</span>
                <div class="an-stat-row-right"><span class="an-stat-row-val">${s.avgFileMB} MB</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="an-card">
        <div class="an-card-head">
          <span class="an-card-title"><span class="msi">show_chart</span>Crecimiento acumulado</span>
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
        <span class="an-card-title"><span class="msi">photo_library</span>Distribución por tipo</span>
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

export function buildStructureSection() {
  const s = M.structure;
  const maxGB = Math.max(...s.heavyFolders.map(f => f.gb));

  const heavyItems = s.heavyFolders.map(f => ({ name: f.name, val: f.gb, label: `${f.gb} GB` }));
  const heavyList  = hbarListHTML(heavyItems, maxGB, (it, i) => RAMP[i] || 'var(--text-secondary)');

  const nestDonut = svgDonut(s.nesting.map(n => ({ value: n.pct, color: n.color })), { size: 90, sw: 13 });
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
          <span class="an-card-title"><span class="msi">folder_open</span>Carpetas más pesadas</span>
          <span class="an-card-badge">por GB</span>
        </div>
        ${heavyList}
      </div>

      <div class="an-card">
        <div class="an-card-head">
          <span class="an-card-title"><span class="msi">account_tree</span>Calidad de estructura</span>
        </div>
        <div class="an-alerts">
          <div class="an-alert-item">
            <div class="an-alert-icon warn"><span class="msi">content_copy</span></div>
            <div class="an-alert-body"><div class="an-alert-title">Archivos duplicados</div><div class="an-alert-sub">Detectados por reconocimiento facial + hash</div></div>
            <span class="an-alert-val">${s.duplicates}</span>
          </div>
          <div class="an-alert-item">
            <div class="an-alert-icon warn"><span class="msi">cloud_off</span></div>
            <div class="an-alert-body"><div class="an-alert-title">Assets huérfanos</div><div class="an-alert-sub">Nunca descargados ni vinculados</div></div>
            <span class="an-alert-val">${s.orphans}</span>
          </div>
          <div class="an-alert-item">
            <div class="an-alert-icon warn"><span class="msi">label_off</span></div>
            <div class="an-alert-body"><div class="an-alert-title">Sin tags</div><div class="an-alert-sub">Calidad de catalogación baja</div></div>
            <span class="an-alert-val">${s.noTags}</span>
          </div>
          <div class="an-alert-item">
            <div class="an-alert-icon warn"><span class="msi">info</span></div>
            <div class="an-alert-body"><div class="an-alert-title">Sin metadata</div><div class="an-alert-sub">EXIF o campos vacíos</div></div>
            <span class="an-alert-val">${s.noMeta}</span>
          </div>
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
  const a = M.activity;
  const totalUsers = a.active + a.inactive + a.guests;
  const userSegs = [
    { value: a.active,   color: 'var(--viz-1)' },
    { value: a.inactive, color: 'var(--viz-4)' },
    { value: a.guests,   color: 'var(--viz-6)' },
  ];
  const maxUpl = Math.max(...a.topUploaders.map(u => u.uploads));
  const maxAct = Math.max(...a.actions.map(ac => ac.n));

  const uplItems = a.topUploaders.map(u => ({ name: u.name, val: u.uploads, label: fmt(u.uploads) }));
  const uplList  = hbarListHTML(uplItems, maxUpl, (it, i) => RAMP[i] || 'var(--text-muted)');

  const actItems = a.actions.map(ac => ({ name: ac.label, val: ac.n, label: fmt(ac.n), color: ac.color }));
  const actList  = hbarListHTML(actItems, maxAct, it => it.color);

  // Heatmap
  const heatMax = Math.max(...a.heatData.flat());
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
        <div class="an-card-head">
          <span class="an-card-title"><span class="msi">group</span>Usuarios</span>
          <span class="an-card-badge">${totalUsers} total</span>
        </div>
        <div class="an-donut-wrap">
          <div class="an-donut-center">
            ${svgDonut(userSegs, { size: 100, sw: 14 })}
            <div class="an-donut-lbl-inner">
              <span class="an-donut-lbl-val">${totalUsers}</span>
            </div>
          </div>
          <div class="an-donut-legend">
            <div class="an-leg-item"><div class="an-leg-dot" style="background:var(--text-strong)"></div><span class="an-leg-name">Activos</span><span class="an-leg-val">${a.active}</span></div>
            <div class="an-leg-item"><div class="an-leg-dot" style="background:var(--text-faint)"></div><span class="an-leg-name">Inactivos</span><span class="an-leg-val">${a.inactive}</span></div>
            <div class="an-leg-item"><div class="an-leg-dot" style="background:var(--surface-neutral)"></div><span class="an-leg-name">Invitados</span><span class="an-leg-val">${a.guests}</span></div>
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
          <span class="an-card-title"><span class="msi">cloud_upload</span>Top subidas</span>
          <span class="an-card-badge">por usuario</span>
        </div>
        ${uplList}
      </div>

      <div class="an-card">
        <div class="an-card-head">
          <span class="an-card-title"><span class="msi">bar_chart</span>Acciones</span>
          <span class="an-card-badge">por tipo</span>
        </div>
        ${actList}
      </div>
    </div>

    <div class="an-card an-mb-4">
      <div class="an-card-head">
        <span class="an-card-title"><span class="msi">calendar_view_week</span>Pico de actividad</span>
        <span class="an-card-badge">hora × día</span>
      </div>
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
  const q = M.quality;
  const total = q.processed + q.pending;
  const procSegs = [
    { value: q.processed, color: 'var(--text-title)' },
    { value: q.pending,   color: 'var(--border-subtle)' },
  ];
  const matchLine = svgLine([72, 75, 78, 80, 83, 85, 87.4], null, { w: 200, h: 60, color: 'var(--text-body)', showDots: false });
  const delRows = q.deletions.map(d =>
    `<div class="an-alert-item">
      <div class="an-alert-icon danger"><span class="msi">delete_forever</span></div>
      <div class="an-alert-body"><div class="an-alert-title">${d.folder}</div><div class="an-alert-sub">${d.date}</div></div>
      <span class="an-alert-val">${d.n} arch.</span>
    </div>`
  ).join('');

  return `
    <div class="an-grid-2">
      <div class="an-card">
        <div class="an-card-head">
          <span class="an-card-title"><span class="msi">ar_on_you</span>Procesamiento facial</span>
          <span class="an-card-badge">${((q.processed/total)*100).toFixed(0)}% completado</span>
        </div>
        <div class="an-donut-wrap">
          <div class="an-donut-center">
            ${svgDonut(procSegs, { size: 110, sw: 18 })}
            <div class="an-donut-lbl-inner">
              <span class="an-donut-lbl-val" style="font-size:15px">${fmt(q.processed)}</span>
              <span class="an-donut-lbl-sub">procesados</span>
            </div>
          </div>
          <div style="flex:1;display:flex;flex-direction:column;gap:var(--space-3)">
            <div class="an-stat-rows">
              <div class="an-stat-row">
                <span class="an-stat-row-lbl"><span class="msi">check_circle</span>Procesados</span>
                <div class="an-stat-row-right"><span class="an-stat-row-val">${fmt(q.processed)}</span></div>
              </div>
              <div class="an-stat-row">
                <span class="an-stat-row-lbl"><span class="msi">hourglass_empty</span>Pendientes</span>
                <div class="an-stat-row-right"><span class="an-stat-row-val">${fmt(q.pending)}</span></div>
              </div>
            </div>
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
        <div class="an-card-head">
          <span class="an-card-title"><span class="msi">delete_sweep</span>Eliminaciones recientes</span>
          <span class="an-card-badge">monitoreo</span>
        </div>
        <div class="an-alerts">${delRows}</div>
        <div class="an-badge danger" style="margin-top:var(--space-4)"><span class="msi">warning</span> ${q.deletions.reduce((s,d)=>s+d.n,0)} archivos eliminados este mes</div>
      </div>
    </div>`;
}

export function buildFaceDetailSection(faces) {
  const items = faces.all.map(f => {
    const av = f.selfieUrl
      ? `<img class="an-fdi-avatar" src="${f.selfieUrl}" alt="" loading="lazy">`
      : `<div class="an-fdi-ph"><span class="msi">person</span></div>`;
    const nm = f.unnamed ? 'Sin identificar' : f.displayName;
    return `<div class="an-fdi">${av}<div class="an-fdi-info"><div class="an-fdi-name${f.unnamed?' un':''}">${nm}</div><span class="an-fdi-count">${f.photos}</span><span class="an-fdi-sub">${f.photos===1?'foto':'fotos'}</span></div></div>`;
  }).join('');
  return `<div class="an-card an-mb-4">
    <div class="an-card-head">
      <span class="an-card-title"><span class="msi">grid_view</span>Detalle por Face ID</span>
      <span class="an-card-badge">${faces.all.length} personas</span>
    </div>
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
