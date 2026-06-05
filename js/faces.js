// Store compartido de Face IDs — fuente de verdad única de rostros + favoritos.
// Lo consumen features/inicio (tira "Face ID Favoritos" del home) y features/faceids.
// Persiste los cambios del usuario (favoritos, renombrados, eliminados, nuevos) en sessionStorage.
// Sin imports de features → sin dependencias circulares (solo lee de events-registry.js).
import { FACE_REGISTRY, PHOTO_FACES, FOLDER_IMAGES_EVENTS } from './events-registry.js';

const SS_FACES = 'len_faces';

// Favoritos por defecto = los rostros que mostraba originalmente la tira del home.
const DEFAULT_FAVS = ['cr_f2', 'cr_f3', 'l42k_f', 'l42k_f2', 'l42k_f3', 'l42k_f8', 'l42k_f11', 'mmm_f', 'osr_f', 'rbf_f', 'wfl_f'];

const REGISTRO_DEFAULT = '14/May/2026';
const ADDED_BY_POOL = ['Mario Luna', 'Tomás De Col', 'Brisa B.', 'Renato Reyes', 'Antonio C.', 'Larisa T.', 'Josue O.', 'Juan Canales', 'Mariana Soto'];
const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

// ── Estado persistido ───────────────────────────────────────────────────────────
let _state = { favs: DEFAULT_FAVS.slice(), renames: {}, deleted: [], created: [] };

function _load() {
  try {
    const raw = sessionStorage.getItem(SS_FACES);
    if (!raw) return;
    const s = JSON.parse(raw);
    _state = {
      favs:    Array.isArray(s.favs)    ? s.favs    : DEFAULT_FAVS.slice(),
      renames: s.renames && typeof s.renames === 'object' ? s.renames : {},
      deleted: Array.isArray(s.deleted) ? s.deleted : [],
      created: Array.isArray(s.created) ? s.created : [],
    };
  } catch (e) {}
}

function _save() {
  try { sessionStorage.setItem(SS_FACES, JSON.stringify(_state)); } catch (e) {}
}

_load();

// ── Suscripción (sync cross-feature: home ↔ Face IDs) ───────────────────────────
const _listeners = [];
export function subscribe(cb) {
  _listeners.push(cb);
  return () => { const i = _listeners.indexOf(cb); if (i >= 0) _listeners.splice(i, 1); };
}
function _notify() {
  _save();
  _listeners.forEach(cb => { try { cb(); } catch (e) {} });
}

// ── Apariciones (reales, derivadas de PHOTO_FACES) ──────────────────────────────
let _photoFolder = null;
function _photoFolderMap() {
  if (_photoFolder) return _photoFolder;
  _photoFolder = {};
  for (const [folderId, photos] of Object.entries(FOLDER_IMAGES_EVENTS)) {
    for (const p of photos) _photoFolder[p] = folderId;
  }
  return _photoFolder;
}

export function getAppearances(id) {
  const map = _photoFolderMap();
  const folders = new Set();
  let photos = 0;
  for (const [photoUrl, faceIds] of Object.entries(PHOTO_FACES)) {
    if (!faceIds.includes(id)) continue;
    photos++;
    const f = map[photoUrl];
    if (f) folders.add(f);
  }
  return { folders: folders.size, photos };
}

// Nombre estable (determinista) para "Agregado por" de los rostros del registro.
function _addedBy(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return ADDED_BY_POOL[h % ADDED_BY_POOL.length];
}

function _todayStr() {
  const d = new Date();
  return `${d.getDate()}/${MONTHS[d.getMonth()]}/${d.getFullYear()}`;
}

// ── Lista efectiva de rostros (registro + overlay de sesión) ────────────────────
function _buildFace(id, base) {
  const renamed = _state.renames[id];
  const name = (renamed != null ? renamed : base.name) || '';
  return {
    id,
    name,
    displayName: name || 'Sin identificar',
    unnamed: !name,
    selfieUrl: base.selfieUrl,
    fav: _state.favs.includes(id),
    registro: base.registro || REGISTRO_DEFAULT,
    addedBy: base.addedBy || _addedBy(id),
    appearances: base.appearances || getAppearances(id),
  };
}

export function getFaces() {
  const out = [];
  const deleted = new Set(_state.deleted);
  for (const [id, face] of Object.entries(FACE_REGISTRY)) {
    if (deleted.has(id)) continue;
    out.push(_buildFace(id, { name: face.name, selfieUrl: face.selfieUrl }));
  }
  for (const c of _state.created) {
    if (deleted.has(c.id)) continue;
    out.push(_buildFace(c.id, {
      name: c.name, selfieUrl: c.selfieUrl, registro: c.registro,
      addedBy: c.addedBy, appearances: { folders: 0, photos: 0 },
    }));
  }
  return out;
}

export function getFavoriteFaces() {
  const byId = {};
  getFaces().forEach(f => { byId[f.id] = f; });
  return _state.favs.map(id => byId[id]).filter(Boolean);
}

export function isFavorite(id) { return _state.favs.includes(id); }

export function toggleFavorite(id) {
  const i = _state.favs.indexOf(id);
  if (i >= 0) _state.favs.splice(i, 1);
  else _state.favs.push(id);
  _notify();
  return _state.favs.includes(id);
}

export function renameFace(id, name) {
  name = (name || '').trim();
  const created = _state.created.find(c => c.id === id);
  if (created) created.name = name;
  else _state.renames[id] = name;
  _notify();
}

export function deleteFace(id) {
  _state.favs = _state.favs.filter(f => f !== id);
  const ci = _state.created.findIndex(c => c.id === id);
  if (ci >= 0) _state.created.splice(ci, 1);
  else if (!_state.deleted.includes(id)) _state.deleted.push(id);
  delete _state.renames[id];
  _notify();
}

let _seq = 0;
export function createFace({ name, selfieUrl }) {
  _seq++;
  const id = 'usr_' + Date.now().toString(36) + _seq;
  const c = { id, name: (name || '').trim(), selfieUrl, registro: _todayStr(), addedBy: 'Mario Luna' };
  _state.created.push(c);
  _notify();
  return _buildFace(id, { name: c.name, selfieUrl: c.selfieUrl, registro: c.registro, addedBy: c.addedBy, appearances: { folders: 0, photos: 0 } });
}
