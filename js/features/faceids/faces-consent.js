// Per-face consent state store.
// state: 'signed' | 'pending'  (null = sin registro de consentimiento)
// Revocar consent → elimina registro y auto-blacklist (UC-03).
import { addToBlacklistByFaceId } from '../../blacklist-store.js';

const SS_KEY = 'len_faces_consent';

// Seed demo — faces asignadas a ct_deportivo
const SEED = {
  l42k_f:   { templateId: 'ct_deportivo', state: 'signed' },
  l42k_f2:  { templateId: 'ct_deportivo', state: 'signed' },
  l42k_f3:  { templateId: 'ct_deportivo', state: 'signed' },
  l42k_f8:  { templateId: 'ct_deportivo', state: 'signed' },
  l42k_f11: { templateId: 'ct_deportivo', state: 'signed' },
  l42k_f12: { templateId: 'ct_deportivo', state: 'signed' },
  cr_f2:    { templateId: 'ct_deportivo', state: 'signed' },
  cr_f3:    { templateId: 'ct_deportivo', state: 'signed' },
  cr_f5:    { templateId: 'ct_deportivo', state: 'signed' },
  cr_f6:    { templateId: 'ct_deportivo', state: 'signed' },
  mmm_f:    { templateId: 'ct_deportivo', state: 'signed' },
  osr_f:    { templateId: 'ct_deportivo', state: 'signed' },
  rbf_f:    { templateId: 'ct_deportivo', state: 'signed' },
  rbf_f2:   { templateId: 'ct_deportivo', state: 'signed' },
  rbf_f4:   { templateId: 'ct_deportivo', state: 'signed' },
  rbf_f8:   { templateId: 'ct_deportivo', state: 'signed' },
  wfl_f:    { templateId: 'ct_deportivo', state: 'signed' },
  wfl_f3:   { templateId: 'ct_deportivo', state: 'signed' },
  cr_f7:    { templateId: 'ct_deportivo', state: 'pending' },
  l42k_f6:  { templateId: 'ct_deportivo', state: 'pending' },
};

let _map = null;

function _load() {
  if (_map) return;
  try {
    const raw = sessionStorage.getItem(SS_KEY);
    _map = raw ? JSON.parse(raw) : { ...SEED };
  } catch (e) {
    _map = { ...SEED };
  }
}

function _save() {
  try { sessionStorage.setItem(SS_KEY, JSON.stringify(_map)); } catch (e) {}
}

_load();

const _listeners = [];
export function subscribeFaceConsent(cb) {
  _listeners.push(cb);
  return () => { const i = _listeners.indexOf(cb); if (i >= 0) _listeners.splice(i, 1); };
}
function _notify() { _save(); _listeners.forEach(cb => { try { cb(); } catch (e) {} }); }

// Retorna { templateId, state } o null si no tiene consentimiento registrado.
export function getFaceConsent(faceId) {
  _load();
  return _map[faceId] || null;
}

// Retorna mapa { [faceId]: { templateId, state } } de todos los registros.
export function getAllFaceConsents() {
  _load();
  return { ..._map };
}

// UC-03: revocar → elimina del mapa y auto-añade a blacklist con source='consent_revoked'.
export function revokeFaceConsent(faceId, { name, selfieUrl }) {
  _load();
  const c = _map[faceId];
  if (!c) return;
  const templateId = c.templateId;
  delete _map[faceId];
  addToBlacklistByFaceId(faceId, { name, selfieUrl, templateId });
  _notify();
}

// Cuenta por estado para widgets de analytics/dashboard.
export function getConsentCounts() {
  _load();
  const counts = { signed: 0, pending: 0 };
  for (const v of Object.values(_map)) {
    if (v.state === 'signed')  counts.signed++;
    else if (v.state === 'pending') counts.pending++;
  }
  return counts;
}
