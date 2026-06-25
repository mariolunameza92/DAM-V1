// Consentimientos tab section.
// Exports: buildConsentTab

import { getStats, getTemplates, MODULE_META } from '../consentimientos/consentimientos-data.js';
import { getAllFaceConsents } from '../faceids/faces-consent.js';
import { getFaces } from '../../faces.js';
import { svgDonut } from './analytics-charts.js';

export function buildConsentTab() {
  const stats     = getStats();
  const templates = getTemplates();
  const consents  = getAllFaceConsents();
  const faces     = getFaces().filter(f => !f.unnamed);

  const total = stats.signed + stats.pending + stats.revoked;
  const pct   = total > 0 ? Math.round((stats.signed / total) * 100) : 0;

  // KPI row
  const kpiHTML = `<div class="an-kpi-grid" style="grid-template-columns:repeat(3,1fr)">
    <div class="an-kpi kc-green">
      <div class="an-kpi-top"><div class="an-kpi-icon"><span class="msi">verified_user</span></div></div>
      <div class="an-kpi-value">${stats.signed}</div>
      <div class="an-kpi-label">Firmados</div>
    </div>
    <div class="an-kpi kc-amber">
      <div class="an-kpi-top"><div class="an-kpi-icon"><span class="msi">schedule</span></div></div>
      <div class="an-kpi-value">${stats.pending}</div>
      <div class="an-kpi-label">Pendientes</div>
    </div>
    <div class="an-kpi kc-rose">
      <div class="an-kpi-top"><div class="an-kpi-icon"><span class="msi">gpp_bad</span></div></div>
      <div class="an-kpi-value">${stats.revoked}</div>
      <div class="an-kpi-label">Revocados</div>
    </div>
  </div>`;

  // Progress donut
  const donutSegs = [
    { value: stats.signed,  color: 'var(--accent-soft)' },
    { value: stats.pending, color: 'var(--text-muted)' },
    { value: stats.revoked, color: 'var(--text-faint)' },
    { value: Math.max(0, 60 - total), color: 'var(--border-subtle)' },
  ].filter(s => s.value > 0);

  const progressCard = `
    <div class="an-card">
      <div class="an-card-head">
        <span class="an-card-title"><span class="msi">donut_large</span>Tasa de firma</span>
        <span class="an-card-badge">${pct}% firmados</span>
      </div>
      <div class="an-donut-wrap">
        <div class="an-donut-center">
          ${svgDonut(donutSegs, { size: 110, sw: 18 })}
          <div class="an-donut-lbl-inner">
            <span class="an-donut-lbl-val">${pct}%</span>
            <span class="an-donut-lbl-sub">firmados</span>
          </div>
        </div>
        <div class="an-donut-legend">
          <div class="an-leg-item"><div class="an-leg-dot" style="background:var(--accent-soft)"></div><span class="an-leg-name">Firmados</span><span class="an-leg-val">${stats.signed}</span></div>
          <div class="an-leg-item"><div class="an-leg-dot" style="background:var(--text-muted)"></div><span class="an-leg-name">Pendientes</span><span class="an-leg-val">${stats.pending}</span></div>
          <div class="an-leg-item"><div class="an-leg-dot" style="background:var(--text-faint)"></div><span class="an-leg-name">Revocados</span><span class="an-leg-val">${stats.revoked}</span></div>
        </div>
      </div>
    </div>`;

  // Template cards
  const tplCards = templates.map(t => {
    const tTotal = t.signedCount + t.pendingCount + t.revokedCount;
    const tPct   = tTotal > 0 ? Math.round((t.signedCount / tTotal) * 100) : 0;
    const statusColor = t.status === 'active' ? 'var(--text-body)' : t.status === 'draft' ? 'var(--text-muted)' : 'var(--text-faint)';
    const statusLabel = t.status === 'active' ? 'Activo' : t.status === 'draft' ? 'Borrador' : 'Archivado';
    const moduleIcons = Object.entries(t.modules)
      .filter(([, on]) => on)
      .map(([k]) => `<span class="msi xs" title="${MODULE_META[k]?.label}">${MODULE_META[k]?.icon}</span>`)
      .join('');
    const tplSegs = tTotal > 0
      ? [
          { value: t.signedCount,  color: 'var(--accent-soft)' },
          { value: t.pendingCount, color: 'var(--text-muted)' },
          { value: t.revokedCount, color: 'var(--text-faint)' },
        ].filter(s => s.value > 0)
      : [{ value: 1, color: 'var(--border-subtle)' }];
    return `<div class="an-card">
      <div class="an-card-head">
        <span class="an-card-title"><span class="msi">description</span>${t.title}</span>
        <span class="an-card-badge" style="color:${statusColor}">${statusLabel} v${t.version}</span>
      </div>
      <div class="an-donut-wrap" style="gap:20px">
        <div class="an-donut-center">${svgDonut(tplSegs, { size: 90, sw: 14 })}<div class="an-donut-lbl-inner"><span class="an-donut-lbl-val" style="font-size:14px">${tPct}%</span></div></div>
        <div style="flex:1;min-width:0">
          <div class="an-stat-rows">
            <div class="an-stat-row"><span class="an-stat-row-lbl"><span class="msi">verified_user</span>Firmados</span><div class="an-stat-row-right"><span class="an-stat-row-val" style="color:var(--text-body)">${t.signedCount}</span></div></div>
            <div class="an-stat-row"><span class="an-stat-row-lbl"><span class="msi">schedule</span>Pendientes</span><div class="an-stat-row-right"><span class="an-stat-row-val" style="color:var(--text-muted)">${t.pendingCount}</span></div></div>
            <div class="an-stat-row"><span class="an-stat-row-lbl"><span class="msi">gpp_bad</span>Revocados</span><div class="an-stat-row-right"><span class="an-stat-row-val" style="color:var(--text-faint)">${t.revokedCount}</span></div></div>
          </div>
          <div style="margin-top:8px;display:flex;gap:6px;align-items:center;color:var(--text-muted);font-size:11px">
            <span>Módulos:</span>${moduleIcons || '<span style="font-size:11px;color:var(--text-faint)">Ninguno</span>'}
          </div>
        </div>
      </div>
    </div>`;
  }).join('');

  // Face-level consent grid
  const consentFaces = faces.map(f => {
    const c = consents[f.id];
    if (!c) return null;
    const state = c.state;
    const badgeColor = state === 'signed' ? 'var(--text-body)' : 'var(--text-muted)';
    const badgeLabel = state === 'signed' ? 'Firmado' : 'Pendiente';
    const badgeIcon  = state === 'signed' ? 'verified' : 'schedule';
    return `<div class="an-cf-item">
      <div class="an-cf-av"><img src="${f.selfieUrl}" alt="" loading="lazy"></div>
      <div class="an-cf-name">${f.displayName.split(' ')[0]}</div>
      <div class="an-cf-badge" style="color:${badgeColor}"><span class="msi">${badgeIcon}</span>${badgeLabel}</div>
    </div>`;
  }).filter(Boolean).join('');

  const facesCard = `
    <div class="an-card an-mb-4">
      <div class="an-card-head">
        <span class="an-card-title"><span class="msi">ar_on_you</span>Detalle por Face ID</span>
        <span class="an-card-badge">${Object.keys(consents).length} con registro</span>
      </div>
      <div class="an-cf-grid">${consentFaces || '<div style="font-size:13px;color:var(--text-faint);padding:16px">Sin registros de consentimiento.</div>'}</div>
    </div>`;

  return `
    ${kpiHTML}
    <div class="an-section-lbl"><span class="msi">donut_large</span>Estado global</div>
    <div class="an-grid-2" style="align-items:start">
      ${progressCard}
      <div class="an-card">
        <div class="an-card-head">
          <span class="an-card-title"><span class="msi">info</span>Sobre los datos</span>
        </div>
        <div class="an-alerts">
          <div class="an-alert-item">
            <div class="an-alert-icon info"><span class="msi">description</span></div>
            <div class="an-alert-body"><div class="an-alert-title">Plantillas activas</div><div class="an-alert-sub">Plantillas publicadas con firma habilitada</div></div>
            <span class="an-alert-val">${templates.filter(t => t.status === 'active').length}</span>
          </div>
          <div class="an-alert-item">
            <div class="an-alert-icon warn"><span class="msi">edit_note</span></div>
            <div class="an-alert-body"><div class="an-alert-title">Borradores</div><div class="an-alert-sub">Plantillas pendientes de publicar</div></div>
            <span class="an-alert-val">${templates.filter(t => t.status === 'draft').length}</span>
          </div>
          <div class="an-alert-item">
            <div class="an-alert-icon danger"><span class="msi">gpp_bad</span></div>
            <div class="an-alert-body"><div class="an-alert-title">Revocaciones</div><div class="an-alert-sub">Consentimientos revocados — auto-blacklist activo</div></div>
            <span class="an-alert-val">${stats.revoked}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="an-section-lbl"><span class="msi">description</span>Por plantilla</div>
    <div class="an-grid-2" style="align-items:start">${tplCards}</div>
    <div class="an-section-lbl"><span class="msi">ar_on_you</span>Por persona</div>
    ${facesCard}`;
}
