// Store de lista negra — personas cuyo contenido se oculta en carpetas y portales.
// Persiste en sessionStorage. Seed de demo con 3 personas del registro.
import { FACE_REGISTRY, PHOTO_FACES, FOLDER_IMAGES_EVENTS } from './events-registry.js';

const SS_KEY = 'len_blacklist';

// Personas del registro usadas como demo seed
const SEED_IDS = ['cr_f4', 'l42k_f7', 'osr_f2'];

let _state = null; // Array<{ id, name, selfieUrl, registro, addedBy }>

function _buildSeed() {
  return SEED_IDS
    .filter(id => FACE_REGISTRY[id])
    .map(id => {
      const f = FACE_REGISTRY[id];
      const name = f.name?.trim() || 'Sin identificar';
      return { id, name, selfieUrl: f.selfieUrl, registro: f.registro || '15/Jun/2026', addedBy: 'Mario Luna' };
    });
}

function _load() {
  if (_state) return;
  try {
    const raw = sessionStorage.getItem(SS_KEY);
    _state = raw ? JSON.parse(raw) : _buildSeed();
  } catch (e) {
    _state = _buildSeed();
  }
}

function _save() {
  try { sessionStorage.setItem(SS_KEY, JSON.stringify(_state)); } catch (e) {}
}

// ── Apariciones (mismo cálculo que getAppearances en faces.js) ────────────────
let _photoFolderCache = null;
function _photoFolderMap() {
  if (_photoFolderCache) return _photoFolderCache;
  _photoFolderCache = {};
  for (const [folderId, photos] of Object.entries(FOLDER_IMAGES_EVENTS)) {
    for (const p of photos) _photoFolderCache[p] = folderId;
  }
  return _photoFolderCache;
}

export function getAppearancesForId(id) {
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

// ── CRUD ──────────────────────────────────────────────────────────────────────

export function getBlacklist() {
  _load();
  return [..._state];
}

let _seq = 0;
export function addToBlacklist({ name, selfieUrl }) {
  _load();
  _seq++;
  const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const d = new Date();
  const id = 'bl_' + d.getTime().toString(36) + _seq;
  const item = { id, name: name.trim(), selfieUrl, registro: `${d.getDate()}/${MONTHS[d.getMonth()]}/${d.getFullYear()}`, addedBy: 'Mario Luna' };
  _state.push(item);
  _save();
  return item;
}

export function removeFromBlacklist(id) {
  _load();
  _state = _state.filter(i => i.id !== id);
  _save();
}

export function renameBlacklistItem(id, name) {
  _load();
  const item = _state.find(i => i.id === id);
  if (item) { item.name = name.trim(); _save(); }
}

export function updateBlacklistFace(id, selfieUrl) {
  _load();
  const item = _state.find(i => i.id === id);
  if (item) { item.selfieUrl = selfieUrl; _save(); }
}

// ── Helpers de filtrado para carpetas y portales ──────────────────────────────

export function isBlacklisted(faceId) {
  _load();
  return _state.some(i => i.id === faceId);
}

export function isPhotoBlacklisted(photoUrl) {
  _load();
  const faceIds = PHOTO_FACES[photoUrl] || [];
  return faceIds.some(id => isBlacklisted(id));
}
