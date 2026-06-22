// Store de Configuración — TenantConfig (módulos) + equipo/roles.
// Persiste en sessionStorage. subscribeConfig() permite que main.js reactive el sidebar.
const SS_CONFIG = 'len_config';
const SS_TEAM   = 'len_team';

// ── Módulos disponibles en la plataforma ─────────────────────────────────────────
export const MODULE_DEFS = [
  { id: 'inicio',          label: 'Inicio',          desc: 'Dashboard de actividad reciente y accesos rápidos',    icon: 'home',            required: true  },
  { id: 'carpetas',        label: 'Carpetas',         desc: 'Gestión de archivos y carpetas de assets',             icon: 'folder',          required: true  },
  { id: 'portales',        label: 'Portales',         desc: 'Portales de descarga pública para eventos',            icon: 'captive_portal',  required: false },
  { id: 'faceids',         label: 'Face IDs',         desc: 'Reconocimiento y gestión de personas identificadas',   icon: 'ar_on_you',       required: false },
  { id: 'blacklist',       label: 'Black List',       desc: 'Control de personas que no deben aparecer publicadas', icon: 'person_off',      required: false },
  { id: 'grupos',          label: 'Grupos',           desc: 'Organización de personas en equipos y secciones',      icon: 'groups',          required: false },
  { id: 'consentimientos', label: 'Consentimientos',  desc: 'Gestión de plantillas de consentimiento de imagen',    icon: 'verified_user',   required: false },
  { id: 'analytics',       label: 'Analytics',        desc: 'Métricas de uso, descargas y accesos a portales',      icon: 'analytics',       required: false },
  { id: 'configuracion',   label: 'Configuración',    desc: 'Administración de módulos, precios y equipo',          icon: 'settings',        required: true  },
];

// ── Planes de pricing ─────────────────────────────────────────────────────────────
export const PRICING_PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$299',
    period: '/mes',
    desc: 'Para equipos que comienzan con la gestión digital de activos',
    highlight: false,
    modules: ['inicio', 'carpetas', 'portales', 'configuracion'],
    features: ['Hasta 50 GB de almacenamiento', '3 usuarios', 'Soporte por email', '5 portales activos'],
  },
  {
    id: 'professional',
    name: 'Professional',
    price: '$699',
    period: '/mes',
    desc: 'Para organizaciones con eventos y gestión de personas',
    highlight: true,
    modules: ['inicio', 'carpetas', 'portales', 'faceids', 'blacklist', 'grupos', 'consentimientos', 'configuracion'],
    features: ['Hasta 500 GB de almacenamiento', '15 usuarios', 'Soporte prioritario', 'Portales ilimitados', 'Face ID + Black List', 'Gestión de consentimientos'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'A medida',
    period: '',
    desc: 'Para grandes empresas con necesidades personalizadas',
    highlight: false,
    modules: ['inicio', 'carpetas', 'portales', 'faceids', 'blacklist', 'grupos', 'consentimientos', 'analytics', 'configuracion'],
    features: ['Almacenamiento ilimitado', 'Usuarios ilimitados', 'SLA garantizado', 'Integración API', 'Analytics avanzado', 'Multi-tenant', 'IA generativa', 'Soporte dedicado'],
  },
];

// ── TenantConfig (módulos habilitados) ────────────────────────────────────────────
const DEFAULT_ENABLED = MODULE_DEFS.map(m => m.id); // todos habilitados por defecto en demo

let _config = null;

function _loadConfig() {
  try {
    const raw = sessionStorage.getItem(SS_CONFIG);
    if (raw) { _config = JSON.parse(raw); return; }
  } catch (e) {}
  _config = { enabledModules: [...DEFAULT_ENABLED] };
}

function _saveConfig() {
  try { sessionStorage.setItem(SS_CONFIG, JSON.stringify(_config)); } catch (e) {}
}

_loadConfig();

const _configListeners = [];
export function subscribeConfig(cb) {
  _configListeners.push(cb);
  return () => { const i = _configListeners.indexOf(cb); if (i >= 0) _configListeners.splice(i, 1); };
}
function _notifyConfig() { _saveConfig(); _configListeners.forEach(cb => { try { cb(); } catch (e) {} }); }

export function getEnabledModules()    { return new Set(_config.enabledModules); }
export function isModuleEnabled(id)    { return _config.enabledModules.includes(id); }

export function setModuleEnabled(id, enabled) {
  const m = MODULE_DEFS.find(m => m.id === id);
  if (!m || m.required) return; // módulos required no se pueden deshabilitar
  if (enabled && !_config.enabledModules.includes(id)) _config.enabledModules.push(id);
  if (!enabled) _config.enabledModules = _config.enabledModules.filter(x => x !== id);
  _notifyConfig();
}

// ── Team store ────────────────────────────────────────────────────────────────────
const ROLES = ['Admin', 'Editor', 'Viewer'];
export { ROLES };

const TEAM_DEFAULT = [
  { id: 'u_mario',   name: 'Mario Luna',    email: 'marioluna@len.pe',   role: 'Admin',  joinedAt: '1/Ene/2026',  initials: 'ML', color: '#1d4ed8' },
  { id: 'u_tomas',   name: 'Tomás De Col',  email: 'tdecol@len.pe',      role: 'Admin',  joinedAt: '1/Ene/2026',  initials: 'TD', color: '#7c3aed' },
  { id: 'u_brisa',   name: 'Brisa B.',      email: 'brisa@len.pe',       role: 'Editor', joinedAt: '15/Feb/2026', initials: 'BB', color: '#db2777' },
  { id: 'u_renato',  name: 'Renato Reyes',  email: 'rreyes@len.pe',      role: 'Editor', joinedAt: '15/Feb/2026', initials: 'RR', color: '#d97706' },
  { id: 'u_antonio', name: 'Antonio C.',    email: 'antonio@len.pe',     role: 'Viewer', joinedAt: '1/Mar/2026',  initials: 'AC', color: '#16a34a' },
];

let _team = null;

function _loadTeam() {
  try {
    const raw = sessionStorage.getItem(SS_TEAM);
    if (raw) { _team = JSON.parse(raw); return; }
  } catch (e) {}
  _team = TEAM_DEFAULT.map(m => ({ ...m }));
}

function _saveTeam() {
  try { sessionStorage.setItem(SS_TEAM, JSON.stringify(_team)); } catch (e) {}
}

_loadTeam();

const _teamListeners = [];
export function subscribeTeam(cb) {
  _teamListeners.push(cb);
  return () => { const i = _teamListeners.indexOf(cb); if (i >= 0) _teamListeners.splice(i, 1); };
}
function _notifyTeam() { _saveTeam(); _teamListeners.forEach(cb => { try { cb(); } catch (e) {} }); }

export function getTeam()      { return _team.slice(); }

let _tseq = 0;
export function inviteMember({ name, email, role = 'Viewer' }) {
  _tseq++;
  const id = 'u_' + Date.now().toString(36) + _tseq;
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const d = new Date();
  const m = { id, name: name.trim(), email: email.trim(), role, initials, color: '#6366f1', joinedAt: `${d.getDate()}/${MONTHS[d.getMonth()]}/${d.getFullYear()}` };
  _team.push(m);
  _notifyTeam();
  return m;
}

export function updateMemberRole(id, role) {
  const m = _team.find(m => m.id === id);
  if (m) { m.role = role; _notifyTeam(); }
}

export function removeMember(id) {
  if (id === 'u_mario') return; // no puede eliminarse a sí mismo
  _team = _team.filter(m => m.id !== id);
  _notifyTeam();
}
