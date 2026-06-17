// Tema global de la app (light/dark).
// Aplica data-theme en <html>, persiste en localStorage y cae a la preferencia
// del sistema cuando no hay valor guardado. El botón #theme-toggle de la topbar lo invierte.
// Los portales públicos definen su propio [data-theme] sobre el elemento del portal,
// así que su apariencia no se ve afectada por el tema de la app.

const STORAGE_KEY = 'len-theme';

function systemPref() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark' : 'light';
}

export function getTheme() {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

function syncToggleUI(theme) {
  const btn  = document.getElementById('theme-toggle');
  if (!btn) return;
  const icon = btn.querySelector('.msi');
  // El icono anuncia la ACCIÓN: en light muestra "dark_mode" (ir a oscuro) y viceversa.
  if (icon) icon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
  btn.setAttribute('aria-label', theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro');
  btn.setAttribute('title',      theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro');
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  syncToggleUI(theme);
}

export function setTheme(theme) {
  applyTheme(theme);
  try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) { /* storage no disponible */ }
}

export function toggleTheme() {
  setTheme(getTheme() === 'dark' ? 'light' : 'dark');
}

export function initTheme() {
  let stored;
  try { stored = localStorage.getItem(STORAGE_KEY); } catch (e) { /* storage no disponible */ }
  // El script anti-FOUC del <head> ya fijó data-theme; aquí re-sincronizamos icono y listener.
  applyTheme(stored === 'dark' || stored === 'light' ? stored : systemPref());

  const btn = document.getElementById('theme-toggle');
  if (btn) btn.addEventListener('click', toggleTheme);
}
