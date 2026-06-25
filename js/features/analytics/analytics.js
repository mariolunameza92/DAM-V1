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
import { sectionLabel } from './analytics-helpers.js';

let _tab    = 'dam'; // 'dam' | 'portales' | 'consentimientos'
let _period = '30d';

function _buildHTML() {
  const faces = faceStats();
  const total = totalFiles();

  const tabs = `<div class="tabs">
    <div class="tab${_tab === 'dam'             ? ' active' : ''}" data-tab="dam">DAM — Assets</div>
    <div class="tab${_tab === 'portales'        ? ' active' : ''}" data-tab="portales">Portales</div>
    <div class="tab${_tab === 'consentimientos' ? ' active' : ''}" data-tab="consentimientos">Consentimientos</div>
  </div>`;

  let content = '';

  if (_tab === 'dam') {
    content = `
      ${filterDAM(_period)}
      ${sectionLabel('ar_on_you', 'Face IDs — reconocimiento facial', true)}
      ${buildFaceHero(faces)}
      ${sectionLabel('timeline', 'KPIs del período')}
      ${buildKPIs(total, _period)}
      ${sectionLabel('database', 'Storage y volumen')}
      ${buildStorageSection()}
      ${sectionLabel('account_tree', 'Estructura y contenido')}
      ${buildStructureSection()}
      ${sectionLabel('group', 'Actividad de usuarios')}
      ${buildActivitySection()}
      ${sectionLabel('memory', 'Calidad y procesamiento')}
      ${buildQualitySection()}
      ${sectionLabel('grid_view', 'Detalle Face IDs')}
      ${buildFaceDetailSection(faces)}`;
  } else if (_tab === 'portales') {
    content = `
      ${filterPortales(_period)}
      ${sectionLabel('captive_portal', 'Inventario de portales', true)}
      ${buildPortalInventory()}
      ${sectionLabel('insights', 'Engagement')}
      ${buildEngagementSection()}
      ${sectionLabel('lock', 'Acceso y seguridad')}
      ${buildSecuritySection()}`;
  } else {
    content = `
      ${sectionLabel('verified_user', 'Consentimientos — resumen global', true)}
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
