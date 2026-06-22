// Store de Consentimientos — plantillas de consentimiento GDPR/Ley29733/Ley21.719.
// Persiste en sessionStorage. El historial de versiones es inmutable (append-only).
const SS_CONSENT = 'len_consentimientos';

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function _todayStr() {
  const d = new Date();
  return `${d.getDate()}/${MONTHS[d.getMonth()]}/${d.getFullYear()}`;
}

// status: 'active' | 'draft' | 'archived'
const CONSENT_DEFAULT = [
  {
    id: 'ct_deportivo',
    title: 'Consentimiento Deportivo',
    description: 'Autorización de uso de imagen en eventos deportivos organizados o difundidos por LEN. Incluye fotografía, video y uso en plataformas digitales con tecnología de reconocimiento facial.',
    status: 'active',
    version: '2.1',
    coverImage: null,
    modules: { visual: true, rrss: true, comms: false, ia: true },
    signedCount: 47,
    pendingCount: 8,
    revokedCount: 3,
    createdAt: '10/Ene/2026',
    lastModified: '5/Jun/2026',
    history: [
      { version: '1.0', date: '10/Ene/2026', author: 'Mario Luna',    note: 'Versión inicial — lanzamiento para Color Run 2026' },
      { version: '1.1', date: '15/Feb/2026', author: 'Mario Luna',    note: 'Se incorporó cláusula de IA generativa y reconocimiento facial' },
      { version: '2.0', date: '1/Abr/2026',  author: 'Tomás De Col',  note: 'Reestructura completa conforme a Ley 29733 (Perú) y Ley 21.719 (Chile)' },
      { version: '2.1', date: '5/Jun/2026',  author: 'Tomás De Col',  note: 'Ajuste del alcance del módulo RRSS — limitado a canales propios de LEN' },
    ],
  },
  {
    id: 'ct_escolar',
    title: 'Consentimiento Escolar',
    description: 'Autorización parental de uso de imagen de menores en actividades escolares y publicaciones educativas. Cumple protocolos de protección de datos de menores.',
    status: 'draft',
    version: '1.0',
    coverImage: null,
    modules: { visual: true, rrss: false, comms: true, ia: false },
    signedCount: 0,
    pendingCount: 0,
    revokedCount: 0,
    createdAt: '18/Jun/2026',
    lastModified: '18/Jun/2026',
    history: [
      { version: '1.0', date: '18/Jun/2026', author: 'Mario Luna', note: 'Borrador inicial para sección de colegios' },
    ],
  },
];

let _templates = null;

function _load() {
  try {
    const raw = sessionStorage.getItem(SS_CONSENT);
    if (raw) { _templates = JSON.parse(raw); return; }
  } catch (e) {}
  _templates = CONSENT_DEFAULT.map(t => ({
    ...t,
    modules: { ...t.modules },
    history: t.history.map(h => ({ ...h })),
  }));
}

function _save() {
  try { sessionStorage.setItem(SS_CONSENT, JSON.stringify(_templates)); } catch (e) {}
}

_load();

const _listeners = [];
export function subscribeConsent(cb) {
  _listeners.push(cb);
  return () => { const i = _listeners.indexOf(cb); if (i >= 0) _listeners.splice(i, 1); };
}
function _notify() { _save(); _listeners.forEach(cb => { try { cb(); } catch (e) {} }); }

export function getTemplates()      { return _templates.slice(); }
export function getTemplateById(id) { return _templates.find(t => t.id === id) || null; }

export function getStats() {
  return _templates.reduce((acc, t) => {
    acc.signed  += t.signedCount;
    acc.pending += t.pendingCount;
    acc.revoked += t.revokedCount;
    acc.total++;
    return acc;
  }, { signed: 0, pending: 0, revoked: 0, total: 0 });
}

let _seq = 0;
export function createTemplate({ title, description = '', modules = {} }) {
  _seq++;
  const id = 'ct_' + Date.now().toString(36) + _seq;
  const today = _todayStr();
  const t = {
    id, title: title.trim(), description: description.trim(),
    status: 'draft', version: '1.0', coverImage: null,
    modules: { visual: !!modules.visual, rrss: !!modules.rrss, comms: !!modules.comms, ia: !!modules.ia },
    signedCount: 0, pendingCount: 0, revokedCount: 0,
    createdAt: today, lastModified: today,
    history: [{ version: '1.0', date: today, author: 'Mario Luna', note: 'Borrador inicial' }],
  };
  _templates.push(t);
  _notify();
  return t;
}

export function updateDraft(id, patch) {
  const t = _templates.find(t => t.id === id);
  if (!t || t.status !== 'draft') return;
  if (patch.title       !== undefined) t.title       = patch.title.trim();
  if (patch.description !== undefined) t.description = patch.description.trim();
  if (patch.modules     !== undefined) t.modules     = { ...t.modules, ...patch.modules };
  t.lastModified = _todayStr();
  _notify();
}

export function publishTemplate(id, note = '') {
  const t = _templates.find(t => t.id === id);
  if (!t || t.status !== 'draft') return;
  t.status = 'active';
  t.lastModified = _todayStr();
  _appendHistory(t, note || `Publicado v${t.version}`);
  _notify();
}

export function newVersion(id, note, bumpMinor = true) {
  const t = _templates.find(t => t.id === id);
  if (!t || t.status !== 'active') return;
  const [major, minor] = t.version.split('.').map(Number);
  t.version = bumpMinor ? `${major}.${minor + 1}` : `${major + 1}.0`;
  t.lastModified = _todayStr();
  _appendHistory(t, note || `Nueva versión ${t.version}`);
  _notify();
}

export function archiveTemplate(id) {
  const t = _templates.find(t => t.id === id);
  if (!t) return;
  t.status = 'archived';
  t.lastModified = _todayStr();
  _appendHistory(t, 'Plantilla archivada');
  _notify();
}

function _appendHistory(t, note) {
  t.history.push({ version: t.version, date: _todayStr(), author: 'Mario Luna', note });
}

export const MODULE_META = {
  visual: { label: 'Material visual',     icon: 'photo_camera',     desc: 'Fotografía y video de eventos' },
  rrss:   { label: 'Redes sociales',       icon: 'share',            desc: 'Publicación en canales sociales de LEN' },
  comms:  { label: 'Comms internas',       icon: 'campaign',         desc: 'Comunicaciones internas y newsletters' },
  ia:     { label: 'IA generativa',        icon: 'smart_toy',        desc: 'Uso en modelos de reconocimiento facial e IA' },
};
