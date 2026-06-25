// Portales tab sections + filter bar.
// Exports: buildPortalInventory, buildEngagementSection, buildSecuritySection, filterPortales

import { M, RAMP, fmt } from './analytics-data.js';
import { svgDonut, svgLine, svgRadar, hbarListHTML } from './analytics-charts.js';

export function buildPortalInventory() {
  const p = M.portales;
  const total = p.active + p.expired + p.draft;
  const statusSegs = [
    { value: p.active,  color: 'var(--text-strong)' },
    { value: p.expired, color: 'var(--text-faint)' },
    { value: p.draft,   color: 'var(--surface-neutral)' },
  ];
  const masterRatio = ((p.masters / (p.masters + p.regulars)) * 100).toFixed(0);

  const byFolderItems = p.byFolder.map(f => ({ name: f.name, val: f.count, label: `${f.count}` }));
  const maxF = Math.max(...p.byFolder.map(f => f.count));
  const byFolderList = hbarListHTML(byFolderItems, maxF, (it, i) => RAMP[i] || 'var(--text-muted)');

  return `
    <div class="an-grid-1-2">
      <div class="an-card">
        <div class="an-card-head">
          <span class="an-card-title"><span class="msi">captive_portal</span>Estado de portales</span>
          <span class="an-card-badge">${total} total</span>
        </div>
        <div class="an-donut-wrap">
          <div class="an-donut-center">
            ${svgDonut(statusSegs, { size: 100, sw: 14 })}
            <div class="an-donut-lbl-inner">
              <span class="an-donut-lbl-val">${total}</span>
            </div>
          </div>
          <div class="an-donut-legend">
            <div class="an-leg-item"><div class="an-leg-dot" style="background:var(--text-strong)"></div><span class="an-leg-name">Activos</span><span class="an-leg-val">${p.active}</span></div>
            <div class="an-leg-item"><div class="an-leg-dot" style="background:var(--text-faint)"></div><span class="an-leg-name">Expirados</span><span class="an-leg-val">${p.expired}</span></div>
            <div class="an-leg-item"><div class="an-leg-dot" style="background:var(--surface-neutral)"></div><span class="an-leg-name">Borrador</span><span class="an-leg-val">${p.draft}</span></div>
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
            <span class="an-stat-row-lbl"><span class="msi">schedule</span>Antigüedad promedio</span>
            <div class="an-stat-row-right"><span class="an-stat-row-val">${p.avgAgeDays} días</span></div>
          </div>
        </div>
      </div>

      <div class="an-card">
        <div class="an-card-head">
          <span class="an-card-title"><span class="msi">folder_special</span>Portales por carpeta</span>
          <span class="an-card-badge">${p.byFolder.length} eventos</span>
        </div>
        ${byFolderList}
      </div>
    </div>`;
}

export function buildEngagementSection() {
  const e = M.portales.engagement;
  const radarSVG = svgRadar(e.radarAxes, e.radarValues, { size: 170, color: 'var(--text-body)' });
  const radarLegend = e.radarAxes.map((ax, i) =>
    `<div class="an-radar-leg-item">
      <div class="an-radar-dot" style="background:var(--text-body)"></div>
      <span class="an-radar-leg-name">${ax}</span>
      <span class="an-radar-leg-val">${(e.radarValues[i] * 100).toFixed(0)}%</span>
    </div>`
  ).join('');

  const srcItems = e.sources.map(s => ({ name: s.label, val: s.pct, label: `${s.pct}%`, color: s.color }));
  const srcList  = hbarListHTML(srcItems, 100, it => it.color);

  const convRows = M.portales.topViews.map(p => {
    const cvrClass = p.cvr >= 23 ? 'hi' : p.cvr >= 19 ? 'mid' : 'lo';
    return `<div class="an-conv-row">
      <span class="an-conv-name">${p.title}</span>
      <span class="an-conv-num">${fmt(p.views)}</span>
      <span class="an-conv-num">${fmt(p.dl)}</span>
      <span class="an-conv-badge ${cvrClass}">${p.cvr}%</span>
    </div>`;
  }).join('');

  const viewsSVG = svgLine(M.portales.viewsOverTime, M.portales.viewsLabels, { w: 320, h: 80, color: 'var(--text-body)' });

  return `
    <div class="an-grid-2">
      <div class="an-card">
        <div class="an-card-head">
          <span class="an-card-title"><span class="msi">radar</span>Radar de engagement</span>
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
          <span class="an-card-title"><span class="msi">devices</span>Acceso por dispositivo</span>
        </div>
        <div class="an-split-bar" style="margin-bottom:var(--space-2)">
          <div class="an-split-seg" style="width:${e.mobile}%;background:var(--text)"></div>
          <div class="an-split-seg" style="width:${e.desktop}%;background:var(--text-faint)"></div>
        </div>
        <div class="an-split-legend" style="margin-bottom:var(--space-5)">
          <div class="an-split-leg-item"><div class="an-split-dot" style="background:var(--text)"></div><span class="an-split-leg-lbl">Móvil</span> <span class="an-split-leg-val">&nbsp;${e.mobile}%</span></div>
          <div class="an-split-leg-item"><div class="an-split-dot" style="background:var(--text-faint)"></div><span class="an-split-leg-lbl">Desktop</span><span class="an-split-leg-val">&nbsp;${e.desktop}%</span></div>
        </div>
        <div class="an-card-head" style="margin-bottom:12px;margin-top:var(--space-2)">
          <span class="an-card-title" style="font-size:12px;color:var(--text-secondary)"><span class="msi">link</span>Origen de tráfico</span>
        </div>
        ${srcList}
      </div>
    </div>

    <div class="an-card an-mb-4">
      <div class="an-card-head">
        <span class="an-card-title"><span class="msi">show_chart</span>Vistas totales en el tiempo</span>
        <span class="an-card-badge">últimos 9 meses</span>
      </div>
      <div class="an-big" style="margin-bottom:var(--space-3)">
        <span class="an-big-val">${fmt(M.portales.viewsOverTime[M.portales.viewsOverTime.length-1])}</span>
        <span class="an-big-lbl">vistas acumuladas en todos los portales</span>
      </div>
      <div class="an-line-wrap">${viewsSVG}</div>
    </div>

    <div class="an-card an-mb-4">
      <div class="an-card-head">
        <span class="an-card-title"><span class="msi">leaderboard</span>Conversión por portal</span>
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

export function buildSecuritySection() {
  const sec = M.portales.security;
  const totalP = sec.withPwd + sec.public;
  const pwdSegs = [
    { value: sec.withPwd, color: 'var(--text-title)' },
    { value: sec.public,  color: 'var(--surface-neutral)' },
  ];
  const expiryRows = sec.expiring.map(p =>
    `<div class="an-expiry-item">
      <span class="an-expiry-name">${p.title}</span>
      <span class="an-expiry-date"><span class="msi">event</span> ${p.expires}</span>
    </div>`
  ).join('');

  return `
    <div class="an-grid-2">
      <div class="an-card">
        <div class="an-card-head">
          <span class="an-card-title"><span class="msi">lock</span>Acceso y seguridad</span>
          <span class="an-card-badge">${totalP} portales</span>
        </div>
        <div class="an-donut-wrap">
          <div class="an-donut-center">
            ${svgDonut(pwdSegs, { size: 100, sw: 14 })}
            <div class="an-donut-lbl-inner">
              <span class="an-donut-lbl-val">${sec.withPwd}</span>
              <span class="an-donut-lbl-sub">con pwd</span>
            </div>
          </div>
          <div class="an-donut-legend">
            <div class="an-leg-item"><div class="an-leg-dot" style="background:var(--text-title)"></div><span class="an-leg-name">Con contraseña</span><span class="an-leg-val">${sec.withPwd}</span><span class="an-leg-pct">${((sec.withPwd/totalP)*100).toFixed(0)}%</span></div>
            <div class="an-leg-item"><div class="an-leg-dot" style="background:var(--surface-neutral)"></div><span class="an-leg-name">Públicos</span><span class="an-leg-val">${sec.public}</span><span class="an-leg-pct">${((sec.public/totalP)*100).toFixed(0)}%</span></div>
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
          <span class="an-card-title"><span class="msi">event_busy</span>Portales por vencer</span>
          <span class="an-card-badge">próximos 7 días</span>
        </div>
        <div class="an-expiry-list">${expiryRows}</div>
        <div style="margin-top:var(--space-5)">
          <div class="an-badge warn"><span class="msi">notifications</span> ${sec.expiring.length} portales expiran esta semana — oportunidad comercial</div>
        </div>
      </div>
    </div>`;
}

export function filterPortales(period) {
  const periods = [
    { key:'7d', lbl:'7 días' }, { key:'30d', lbl:'30 días' },
    { key:'3m', lbl:'3 meses' }, { key:'all', lbl:'Todo' },
  ].map(p => `<button class="an-pill${period === p.key ? ' active' : ''}" data-period="${p.key}">${p.lbl}</button>`).join('');
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
