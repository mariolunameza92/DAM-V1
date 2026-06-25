// Portales tab sections + filter bar.
// Exports: buildPortalInventory, buildEngagementSection, buildSecuritySection, filterPortales

import { M, RAMP, fmt } from './analytics-data.js';
import { svgDonut, svgLine, svgRadar, hbarListHTML } from './analytics-charts.js';
import { cardHead, legendItem, miniStat, miniGrid, gaugeBar, statRow, statRows, bigNumber, convRow, expiryItem, radarLegItem, anBadge } from './analytics-helpers.js';

export function buildPortalInventory() {
  const p     = M.portales;
  const total = p.active + p.expired + p.draft;
  const statusSegs = [
    { value: p.active,  color: 'var(--text-strong)' },
    { value: p.expired, color: 'var(--text-faint)' },
    { value: p.draft,   color: 'var(--surface-neutral)' },
  ];
  const masterRatio   = ((p.masters / (p.masters + p.regulars)) * 100).toFixed(0);
  const byFolderItems = p.byFolder.map(f => ({ name: f.name, val: f.count, label: `${f.count}` }));
  const maxF          = Math.max(...p.byFolder.map(f => f.count));
  const byFolderList  = hbarListHTML(byFolderItems, maxF, (it, i) => RAMP[i] || 'var(--text-muted)');

  return `
    <div class="an-grid-1-2">
      <div class="an-card">
        ${cardHead('captive_portal', 'Estado de portales', `${total} total`)}
        <div class="an-donut-wrap">
          <div class="an-donut-center">
            ${svgDonut(statusSegs, { size: 100, sw: 14 })}
            <div class="an-donut-lbl-inner">
              <span class="an-donut-lbl-val">${total}</span>
            </div>
          </div>
          <div class="an-donut-legend">
            ${legendItem('var(--text-strong)',     'Activos',   p.active)}
            ${legendItem('var(--text-faint)',      'Expirados', p.expired)}
            ${legendItem('var(--surface-neutral)', 'Borrador',  p.draft)}
          </div>
        </div>
        ${miniGrid(2,
          miniStat('violet', p.masters,  'Masters') +
          miniStat('gray',   p.regulars, 'Regulares'),
          'margin-top:var(--space-5)'
        )}
        <div style="margin-top:var(--space-4)">
          ${gaugeBar('Ratio masters', `${masterRatio}%`, masterRatio, 'warm')}
        </div>
        ${statRows(statRow('schedule', 'Antigüedad promedio', `${p.avgAgeDays} días`), 'margin-top:var(--space-3)')}
      </div>

      <div class="an-card">
        ${cardHead('folder_special', 'Portales por carpeta', `${p.byFolder.length} eventos`)}
        ${byFolderList}
      </div>
    </div>`;
}

export function buildEngagementSection() {
  const e         = M.portales.engagement;
  const radarSVG  = svgRadar(e.radarAxes, e.radarValues, { size: 170, color: 'var(--text-body)' });
  const radarLegend = e.radarAxes.map((ax, i) =>
    radarLegItem('var(--text-body)', ax, `${(e.radarValues[i] * 100).toFixed(0)}%`)
  ).join('');

  const srcItems = e.sources.map(s => ({ name: s.label, val: s.pct, label: `${s.pct}%`, color: s.color }));
  const srcList  = hbarListHTML(srcItems, 100, it => it.color);
  const convRows = M.portales.topViews.map(p => convRow(p.title, fmt(p.views), fmt(p.dl), p.cvr)).join('');
  const viewsSVG = svgLine(M.portales.viewsOverTime, M.portales.viewsLabels, { w: 320, h: 80, color: 'var(--text-body)' });
  const lastViews = M.portales.viewsOverTime[M.portales.viewsOverTime.length - 1];

  return `
    <div class="an-grid-2">
      <div class="an-card">
        ${cardHead('radar', 'Radar de engagement', 'portales activos')}
        <div class="an-radar-wrap">
          ${radarSVG}
          <div class="an-radar-legend">${radarLegend}</div>
        </div>
        ${miniGrid(3,
          miniStat('blue',  e.avgTime,          'Tiempo prom.') +
          miniStat('green', e.assetsPerSession,  'Assets/sesión') +
          miniStat('amber', M.portales.inactive, 'Sin actividad'),
          'margin-top:var(--space-5)'
        )}
      </div>

      <div class="an-card">
        ${cardHead('devices', 'Acceso por dispositivo')}
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
      ${cardHead('show_chart', 'Vistas totales en el tiempo', 'últimos 9 meses')}
      ${bigNumber(fmt(lastViews), 'vistas acumuladas en todos los portales', '', 'margin-bottom:var(--space-3)')}
      <div class="an-line-wrap">${viewsSVG}</div>
    </div>

    <div class="an-card an-mb-4">
      ${cardHead('leaderboard', 'Conversión por portal', 'vista → descarga')}
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
  const sec    = M.portales.security;
  const totalP = sec.withPwd + sec.public;
  const pwdSegs = [
    { value: sec.withPwd, color: 'var(--text-title)' },
    { value: sec.public,  color: 'var(--surface-neutral)' },
  ];
  const expiryRows = sec.expiring.map(p => expiryItem(p.title, p.expires)).join('');

  return `
    <div class="an-grid-2">
      <div class="an-card">
        ${cardHead('lock', 'Acceso y seguridad', `${totalP} portales`)}
        <div class="an-donut-wrap">
          <div class="an-donut-center">
            ${svgDonut(pwdSegs, { size: 100, sw: 14 })}
            <div class="an-donut-lbl-inner">
              <span class="an-donut-lbl-val">${sec.withPwd}</span>
              <span class="an-donut-lbl-sub">con pwd</span>
            </div>
          </div>
          <div class="an-donut-legend">
            ${legendItem('var(--text-title)',      'Con contraseña', sec.withPwd, `${((sec.withPwd / totalP) * 100).toFixed(0)}%`)}
            ${legendItem('var(--surface-neutral)', 'Públicos',       sec.public,  `${((sec.public / totalP) * 100).toFixed(0)}%`)}
          </div>
        </div>
        ${miniGrid(2,
          miniStat('rose',  sec.failed,          'Accesos fallidos') +
          miniStat('amber', sec.expiring.length, 'Expiran pronto'),
          'margin-top:var(--space-5)'
        )}
      </div>

      <div class="an-card">
        ${cardHead('event_busy', 'Portales por vencer', 'próximos 7 días')}
        <div class="an-expiry-list">${expiryRows}</div>
        ${anBadge('warn', `${sec.expiring.length} portales expiran esta semana — oportunidad comercial`, 'notifications', 'margin-top:var(--space-5)')}
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
