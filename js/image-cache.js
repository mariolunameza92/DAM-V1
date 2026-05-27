// Exports: openIDB(), idbGet(url), idbSet(url, data) — IndexedDB wrapper para cache de imágenes demo
const IMG_CACHE_VERSION = 'v1';
const IDB_NAME  = 'len-img-cache';
const IDB_STORE = 'images';
let _idb = null;

export function openIDB() {
  if (_idb) return Promise.resolve(_idb);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = e => {
      if (!e.target.result.objectStoreNames.contains(IDB_STORE))
        e.target.result.createObjectStore(IDB_STORE, { keyPath: 'k' });
    };
    req.onsuccess = e => { _idb = e.target.result; resolve(_idb); };
    req.onerror   = e => reject(e.target.error);
  });
}

export function idbGet(url) {
  return openIDB().then(db => new Promise(resolve => {
    const req = db.transaction(IDB_STORE, 'readonly').objectStore(IDB_STORE).get(IMG_CACHE_VERSION + ':' + url);
    req.onsuccess = e => resolve(e.target.result ? e.target.result.d : null);
    req.onerror   = () => resolve(null);
  })).catch(() => null);
}

export function idbSet(url, data) {
  return openIDB().then(db => new Promise(resolve => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put({ k: IMG_CACHE_VERSION + ':' + url, d: data });
    tx.oncomplete = resolve;
    tx.onerror    = resolve;
  })).catch(() => {});
}
