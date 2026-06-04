// Shared view toggle (grid / list) — single source of truth for the DAM.

// HTML string for dynamically-rendered toggles. Call bindDynamicToggle after inserting.
export function viewToggleHTML(currentView = 'grid') {
  return `<div class="view-toggle">` +
    `<button class="view-btn${currentView === 'grid' ? ' active' : ''}" data-v="grid"><span class="msi xs">grid_view</span></button>` +
    `<button class="view-btn${currentView === 'list' ? ' active' : ''}" data-v="list"><span class="msi xs">lists</span></button>` +
    `</div>`;
}

// Bind .view-btn[data-v] buttons inside container. Calls onChange(view) on change.
export function bindDynamicToggle(container, onChange) {
  container.querySelectorAll('.view-btn[data-v]').forEach(btn => {
    btn.addEventListener('click', () => {
      const v = btn.dataset.v;
      if (container.querySelector('.view-btn[data-v].active')?.dataset.v === v) return;
      container.querySelectorAll('.view-btn[data-v]').forEach(b => b.classList.toggle('active', b.dataset.v === v));
      onChange(v);
    });
  });
}

// Bind static-HTML toggle pair by element IDs (declared in index.html).
// getView: () => 'grid'|'list'  |  onChange: (view) => void
export function bindStaticToggle(gridId, listId, getView, onChange) {
  const g = document.getElementById(gridId);
  const l = document.getElementById(listId);
  if (!g || !l) return;
  const sync = v => { g.classList.toggle('active', v === 'grid'); l.classList.toggle('active', v === 'list'); };
  g.addEventListener('click', () => { if (getView() === 'grid') return; sync('grid'); onChange('grid'); });
  l.addEventListener('click', () => { if (getView() === 'list') return; sync('list'); onChange('list'); });
}
