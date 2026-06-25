// Atom: empty-state — mensaje centrado cuando una lista no tiene contenido.
// Export: emptyState(message) → HTML string
export function emptyState(message) {
  return `<div class="empty-state">${message}</div>`;
}
