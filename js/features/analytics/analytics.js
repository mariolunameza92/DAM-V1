// Orchestrator: wires tabs, period state, and renders analytics.
// Exports: renderAnalytics()

import { faceStats, totalFiles } from './analytics-data.js';
import {
  buildFaceHero, buildKPIs, buildStorageSection, buildStructureSection,
  buildActivitySection, buildQualitySection, buildFaceDetailSection, filterDAM,
} from './analytics-dam.js';
import {
  buildPortalInventory, buildEngagementSection, buildSecuritySection, filterPortales,
} from './analytics-portales.js';
import { buildConsentTab } from './analytics-consentimientos.js';

let _tab    = 'dam'; // 'dam' | 'portales' | 'consentimientos'
let _period = '30d';

function _buildHTML() {
  const faces = faceStats();
  const total = totalFiles();

  const tabs = `<div class="tabs">
    <div class="tab${_tab === 'dam' ? ' active' : ''}" data-tab="dam">DAM — Assets</div>
    <div class="tab${_tab === 'portales' ? ' active' : ''}" data-tab="portales">Portales</div>
    <div class="tab${_tab === 'consentimientos' ? ' active' : ''}" data-tab="consentimientos">Consentimientos</div>
  </div>`;

  let content = '';

  if (_tab === 'dam') {
    content = `
      ${filterDAM(_period)}
      <div class="an-section-lbl no-top"><span class="msi">ar_on_you</span>Face IDs — reconocimiento facial</div>
      ${buildFaceHero(faces)}
      <div class="an-section-lbl"><span class="msi">timeline</span>KPIs del período</div>
      ${buildKPIs(total, _period)}
      <div class="an-section-lbl"><span class="msi">database</span>Storage y volumen</div>
      ${buildStorageSection()}
      <div class="an-section-lbl"><span class="msi">account_tree</span>Estructura y contenido</div>
      ${buildStructureSection()}
      <div class="an-section-lbl"><span class="msi">group</span>Actividad de usuarios</div>
      ${buildActivitySection()}
      <div class="an-section-lbl"><span class="msi">memory</span>Calidad y procesamiento</div>
      ${buildQualitySection()}
      <div class="an-section-lbl"><span class="msi">grid_view</span>Detalle Face IDs</div>
      ${buildFaceDetailSection(faces)}`;
  } else if (_tab === 'portales') {
    content = `
      ${filterPortales(_period)}
      <div class="an-section-lbl no-top"><span class="msi">captive_portal</span>Inventario de portales</div>
      ${buildPortalInventory()}
      <div class="an-section-lbl"><span class="msi">insights</span>Engagement</div>
      ${buildEngagementSection()}
      <div class="an-section-lbl"><span class="msi">lock</span>Acceso y seguridad</div>
      ${buildSecuritySection()}`;
  } else {
    content = `
      <div class="an-section-lbl no-top"><span class="msi">verified_user</span>Consentimientos — resumen global</div>
      ${buildConsentTab()}`;
  }

  return `<div class="an-wrap">${tabs}${content}</div>`;
}

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

export function renderAnalytics() {
  const sec = document.getElementById('sec-analytics');
  if (!sec) return;
  sec.innerHTML = _buildHTML();
  _bindEvents(sec);
}
