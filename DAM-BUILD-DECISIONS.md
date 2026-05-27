# Architecture Decision Log — DAM V1

Leer solo cuando tengas dudas sobre por qué algo está estructurado de cierta manera.
Cada ADR explica qué se decidió, por qué, y qué alternativa se descartó.

---

### ADR-001 — `browser.js` fusiona árbol + masonry

`js/features/carpetas/browser.js` contiene tree panel Y masonry panel juntos.

**Por qué**: Click en nodo del árbol → dispara render de masonry. Separarlos en `tree.js` + `masonry.js` creaba dependencia circular. Custom events eran válidos pero añadían indirección innecesaria para este scope.

---

### ADR-002 — `goToCarpeta` vive en `main.js`

**Por qué**: Cruza dos features (routing + carpetas). Si viviera en `browser.js` → `browser.js → main.js → browser.js` (circular). Regla: toda función cross-feature va en `main.js`.

---

### ADR-003 — `window.*` bridge para inline HTML handlers

`main.js` hace `Object.assign(window, { openModal, closeModal, ... })`.

**Por qué**: ES Modules no expone globales. El HTML tiene muchos `onclick="fn()"`. Refactorizar todo a `addEventListener` era out-of-scope. El bridge es deliberado y centralizado. En migración futura a framework, este es el primer archivo a eliminar.

**Excepción**: `inp-title`, `inp-desc`, `font-sel` usan `addEventListener` directo en `main.js` porque accedían a `st` del módulo, no a funciones globales.

---

### ADR-004 — `sessionStorage` (no `localStorage`) para el demo

**Por qué**: Demo debe empezar limpio con cada cliente. `sessionStorage` se borra al cerrar pestaña. `localStorage` contaminaría demos futuros. Refresh → preserva estado. Nueva pestaña → limpio.

---

### ADR-005 — `uploadedAssets` vs `userUploadedAssets` separados

Demo images → `uploadedAssets{}` (IndexedDB cache, no se serializa).
User uploads → `userUploadedAssets{}` (sessionStorage, sí se serializa).

**Por qué**: Mezclarlos obligaría a serializar ~2MB de demos innecesariamente, o a usar flags. En render, user uploads tienen prioridad sobre demo images.

---

### ADR-006 — `findNode` y `getAncestorIds` en `data.js`

**Por qué**: Operan sobre `TREE_DATA`, sin efectos secundarios ni conocimiento de UI. Ponerlas en `browser.js` las acoplaría a presentación. En `data.js` cualquier feature las importa sin depender de la capa de render.

---

### ADR-007 — `thumbsHTML` en `features/shared/`, no en `components/ui/`

**Por qué**: Conoce el dominio de folders (lee `userUploadedAssets`, `uploadedAssets`, `FOLDER_IMAGES`). No es UI pura. La usan tanto `carpetas/browser.js` como `inicio/inicio.js`.

Regla: reutilizable entre features pero con conocimiento de dominio → `features/shared/`. Agnóstico de negocio → `components/ui/`.
