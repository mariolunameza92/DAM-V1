// Atom: alert-item — icon + title + optional subtitle + right-side value.
// Usar este atom para cualquier fila de alerta/stat en analytics; nunca inline.
export function alertItem(icon, title, subtitle, value) {
  const sub = subtitle ? `<div class="an-alert-sub">${subtitle}</div>` : '';
  return `<div class="an-alert-item">
    <div class="an-alert-icon"><span class="msi">${icon}</span></div>
    <div class="an-alert-body"><div class="an-alert-title">${title}</div>${sub}</div>
    <span class="an-alert-val">${value}</span>
  </div>`;
}
