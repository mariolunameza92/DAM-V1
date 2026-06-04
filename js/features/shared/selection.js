// Exports: initSelection(), toggleSelected(key), clearSelection(), selectAll(), isSelected(key), selectionStore
// Key format: "folder:{nodeId}" | "asset:{section}:{idx}"
// Multi-select is purely visual; actions are run from the right-click context menu.

// ── Store ─────────────────────────────────────────────────────────
export const selectionStore = new Set();

export function isSelected(key) { return selectionStore.has(key); }
export function getSelected()   { return [...selectionStore]; }

export function toggleSelected(key) {
  if (selectionStore.has(key)) selectionStore.delete(key);
  else selectionStore.add(key);
  _refreshUI();
}

export function clearSelection() {
  selectionStore.clear();
  _refreshUI();
}

export function selectAll() {
  _selectableCards().forEach(el => {
    const k = _key(el);
    if (k) selectionStore.add(k);
  });
  _refreshUI();
}

// ── Key helpers ───────────────────────────────────────────────────
function _key(el) {
  if (el.matches('.folder-card[data-node-id]'))          return `folder:${el.dataset.nodeId}`;
  if (el.matches('.asset-card[data-section][data-idx]')) return `asset:${el.dataset.section}:${el.dataset.idx}`;
  return null;
}

function _selectableCards() {
  return [
    ...document.querySelectorAll('.folder-card[data-node-id]'),
    ...document.querySelectorAll('.asset-card[data-section][data-idx]'),
  ];
}

// ── UI refresh ────────────────────────────────────────────────────
function _refreshUI() {
  _selectableCards().forEach(el => {
    const k = _key(el);
    el.classList.toggle('is-selected', !!k && selectionStore.has(k));
  });
}

// ── Lasso rubber-band ─────────────────────────────────────────────
let _lassoEl  = null;
let _dragging = false;
let _anchor   = { x: 0, y: 0 };
const DRAG_MIN = 5;

function _createLasso() {
  _lassoEl = document.createElement('div');
  _lassoEl.className = 'lasso-rect';
  document.body.appendChild(_lassoEl);
}

function _lassoBounds(ax, ay, cx, cy) {
  return {
    left:   Math.min(ax, cx),
    top:    Math.min(ay, cy),
    right:  Math.max(ax, cx),
    bottom: Math.max(ay, cy),
  };
}

function _intersects(r, el) {
  const b = el.getBoundingClientRect();
  return b.right > r.left && b.left < r.right &&
         b.bottom > r.top  && b.top  < r.bottom;
}

// ── Init ──────────────────────────────────────────────────────────
export function initSelection() {
  _createLasso();

  // ── Click-to-toggle while a selection is active (capture phase) ──
  document.addEventListener('click', e => {
    if (selectionStore.size === 0) return;
    const card = e.target.closest('.folder-card[data-node-id], .asset-card[data-section][data-idx]');
    if (!card) return;
    if (e.target.closest('.asset-dl, button, a, [data-action]')) return;
    const k = _key(card);
    if (!k) return;
    toggleSelected(k);
    e.stopPropagation(); // prevent folder nav / image detail from firing
  }, true);

  // ── Lasso: mousedown on empty viewer area ──────────────────────
  document.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    // Only inside the carpetas viewer (excludes tree panel, resizer, header, tabs)
    if (!e.target.closest('.masonry-area')) return;
    // Not on an interactive element or a card
    if (e.target.closest('.folder-card, .asset-card, button, a, input, [data-action]')) return;

    // Stop native text selection from starting on this drag
    e.preventDefault();

    _dragging = false;
    _anchor   = { x: e.clientX, y: e.clientY };

    const onMove = mv => {
      const dx = Math.abs(mv.clientX - _anchor.x);
      const dy = Math.abs(mv.clientY - _anchor.y);
      if (!_dragging && dx < DRAG_MIN && dy < DRAG_MIN) return;

      if (!_dragging) {
        _dragging = true;
        document.body.style.userSelect = 'none';
      }

      const r = _lassoBounds(_anchor.x, _anchor.y, mv.clientX, mv.clientY);
      Object.assign(_lassoEl.style, {
        display: 'block',
        left:    r.left              + 'px',
        top:     r.top               + 'px',
        width:   (r.right  - r.left) + 'px',
        height:  (r.bottom - r.top)  + 'px',
      });
    };

    const onUp = up => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
      _lassoEl.style.display = 'none';
      document.body.style.userSelect = '';

      // Plain click on empty area (no drag) → clear selection
      if (!_dragging) {
        if (selectionStore.size > 0) clearSelection();
        return;
      }
      _dragging = false;

      const r = _lassoBounds(_anchor.x, _anchor.y, up.clientX, up.clientY);
      if ((r.right - r.left) < DRAG_MIN || (r.bottom - r.top) < DRAG_MIN) return;

      // Shift-drag adds to the existing selection; plain drag replaces it
      if (!up.shiftKey) selectionStore.clear();

      _selectableCards().forEach(el => {
        if (_intersects(r, el)) {
          const k = _key(el);
          if (k) selectionStore.add(k);
        }
      });

      _refreshUI();
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
  });

  // ── Keyboard ──────────────────────────────────────────────────
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && selectionStore.size > 0) {
      clearSelection();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
      if (document.getElementById('sec-carpetas')?.classList.contains('active')) {
        e.preventDefault();
        selectAll();
      }
    }
  });

  // ── Re-apply selection classes after cards are re-rendered ─────
  document.addEventListener('dam:cardsrendered', _refreshUI);
}
