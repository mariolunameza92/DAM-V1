// Molecule: dialog — show/hide overlay dialogs via .open class.
// setupDialog debe llamarse una vez en init; openDialog/closeDialog en cada operación.
export function setupDialog(id, closeFn) {
  const dlg = document.getElementById(id);
  if (!dlg) return;
  dlg.addEventListener('mousedown', e => { if (e.target === dlg) closeFn(); });
}

export function openDialog(id, focusId) {
  document.getElementById(id).classList.add('open');
  if (focusId) setTimeout(() => document.getElementById(focusId)?.focus(), 50);
}

export function closeDialog(id) {
  document.getElementById(id).classList.remove('open');
}
