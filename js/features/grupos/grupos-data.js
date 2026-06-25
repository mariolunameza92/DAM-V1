// Store de Grupos — fuente de verdad de grupos corporativos.
// Persiste en sessionStorage. Exporta CRUD + suscripción.
const SS_GRUPOS = 'len_grupos';

const GRUPOS_BUSINESS_DEFAULT = [
  {
    id: 'g_comercial',
    name: 'Equipo Comercial',
    description: 'Área de Ventas y Clientes',
    color: 'var(--accent)',
    createdAt: '10/Abr/2026',
    memberIds: ['l42k_f', 'cr_f2', 'rbf_f', 'osr_f'],
  },
  {
    id: 'g_direccion',
    name: 'Dirección',
    description: 'Alta dirección',
    color: 'var(--accent-soft)',
    createdAt: '10/Abr/2026',
    memberIds: ['l42k_f2', 'l42k_f3', 'wfl_f'],
  },
];

const GRUPOS_SCHOOLS_DEFAULT = [
  {
    id: 'g_1a',
    name: '1ro "A"',
    description: 'Primer año — sección A',
    color: 'var(--accent)',
    createdAt: '10/Abr/2026',
    memberIds: ['l42k_f', 'cr_f2', 'rbf_f'],
  },
  {
    id: 'g_1b',
    name: '1ro "B"',
    description: 'Primer año — sección B',
    color: 'var(--accent-soft)',
    createdAt: '10/Abr/2026',
    memberIds: ['osr_f', 'l42k_f2'],
  },
  {
    id: 'g_1c',
    name: '1ro "C"',
    description: 'Primer año — sección C',
    color: 'var(--text-body)',
    createdAt: '10/Abr/2026',
    memberIds: ['l42k_f3', 'wfl_f'],
  },
];

const GRUPOS_DEFAULT = GRUPOS_BUSINESS_DEFAULT;

let _grupos = null;

function _load() {
  try {
    const raw = sessionStorage.getItem(SS_GRUPOS);
    if (raw) { _grupos = JSON.parse(raw); return; }
  } catch (e) {}
  _grupos = GRUPOS_DEFAULT.map(g => ({ ...g, memberIds: [...g.memberIds] }));
}

function _save() {
  try { sessionStorage.setItem(SS_GRUPOS, JSON.stringify(_grupos)); } catch (e) {}
}

_load();

const _listeners = [];
export function subscribeGrupos(cb) {
  _listeners.push(cb);
  return () => { const i = _listeners.indexOf(cb); if (i >= 0) _listeners.splice(i, 1); };
}
function _notify() { _save(); _listeners.forEach(cb => { try { cb(); } catch (e) {} }); }

export function getGrupos() { return _grupos.slice(); }

export function getGrupoById(id) { return _grupos.find(g => g.id === id) || null; }

export function getGrupoForFace(faceId) {
  return _grupos.find(g => g.memberIds.includes(faceId)) || null;
}

let _seq = 0;
export function createGrupo({ name, description = '', color = 'var(--accent-soft)' }) {
  _seq++;
  const id = 'g_' + Date.now().toString(36) + _seq;
  const g = { id, name: name.trim(), description: description.trim(), color, createdAt: _todayStr(), memberIds: [] };
  _grupos.push(g);
  _notify();
  return g;
}

export function updateGrupo(id, patch) {
  const g = _grupos.find(g => g.id === id);
  if (!g) return;
  if (patch.name        !== undefined) g.name        = patch.name.trim();
  if (patch.description !== undefined) g.description = patch.description.trim();
  if (patch.color       !== undefined) g.color       = patch.color;
  _notify();
}

export function deleteGrupo(id) {
  _grupos = _grupos.filter(g => g.id !== id);
  _notify();
}

export function addMember(grupoId, faceId) {
  const g = _grupos.find(g => g.id === grupoId);
  if (!g || g.memberIds.includes(faceId)) return;
  // Un rostro solo puede pertenecer a un grupo — removerlo del anterior
  _grupos.forEach(other => {
    if (other.id !== grupoId) other.memberIds = other.memberIds.filter(id => id !== faceId);
  });
  g.memberIds.push(faceId);
  _notify();
}

export function removeMember(grupoId, faceId) {
  const g = _grupos.find(g => g.id === grupoId);
  if (!g) return;
  g.memberIds = g.memberIds.filter(id => id !== faceId);
  _notify();
}

export function resetGruposForType(type) {
  const defaults = type === 'schools' ? GRUPOS_SCHOOLS_DEFAULT : GRUPOS_BUSINESS_DEFAULT;
  _grupos = defaults.map(g => ({ ...g, memberIds: [...g.memberIds] }));
  _notify();
}

function _todayStr() {
  const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const d = new Date();
  return `${d.getDate()}/${MONTHS[d.getMonth()]}/${d.getFullYear()}`;
}
