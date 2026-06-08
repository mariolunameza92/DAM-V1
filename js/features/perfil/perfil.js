// Exports: renderPerfil()
import { uploadedAssets, userUploadedAssets, getPortals } from '../../session.js';
import { FOLDERS_DATA } from '../../data.js';

const USER = {
  name: 'Mario Luna',
  initials: 'ML',
  role: 'Administrador',
  org: 'LEN Sports Agency',
  email: 'm.luna@len.pe',
  phone: '+51 987 654 321',
  since: 'enero 2025',
  plan: 'Pro',
  tenantId: 'len-sports-001',
};

function _totalAssets() {
  const demo = Object.values(uploadedAssets).reduce((s, a) => s + a.length, 0);
  const user = Object.values(userUploadedAssets).reduce((s, a) => s + a.length, 0);
  return demo + user;
}

export function renderPerfil() {
  const el = document.getElementById('sec-perfil');
  if (!el) return;

  const totalAssets = _totalAssets();
  const portals     = getPortals().length;
  const carpetas    = FOLDERS_DATA.length;

  el.innerHTML = `
    <div class="perfil-wrap">
      <div class="perfil-header">
        <div class="perfil-avatar">${USER.initials}</div>
        <div class="perfil-info">
          <div class="perfil-name">${USER.name}</div>
          <div class="perfil-role">${USER.role}</div>
          <div class="perfil-org">
            <span class="msi xs">corporate_fare</span>
            ${USER.org}
          </div>
        </div>
      </div>

      <div class="perfil-grid">
        <div class="perfil-card">
          <div class="perfil-card-title">Contacto</div>
          <div class="perfil-field">
            <div class="perfil-field-label">Correo electrónico</div>
            <div class="perfil-field-value">${USER.email}</div>
          </div>
          <div class="perfil-field">
            <div class="perfil-field-label">Teléfono</div>
            <div class="perfil-field-value">${USER.phone}</div>
          </div>
        </div>
        <div class="perfil-card">
          <div class="perfil-card-title">Cuenta</div>
          <div class="perfil-field">
            <div class="perfil-field-label">Miembro desde</div>
            <div class="perfil-field-value">${USER.since}</div>
          </div>
          <div class="perfil-field">
            <div class="perfil-field-label">Plan</div>
            <div class="perfil-badge">${USER.plan}</div>
          </div>
          <div class="perfil-field">
            <div class="perfil-field-label">ID de tenant</div>
            <div class="perfil-field-value perfil-field-mono">${USER.tenantId}</div>
          </div>
        </div>
      </div>

      <div class="perfil-stats">
        <div class="perfil-stat">
          <div class="perfil-stat-value">${totalAssets}</div>
          <div class="perfil-stat-label">Assets totales</div>
        </div>
        <div class="perfil-stat">
          <div class="perfil-stat-value">${portals}</div>
          <div class="perfil-stat-label">Portales creados</div>
        </div>
        <div class="perfil-stat">
          <div class="perfil-stat-value">${carpetas}</div>
          <div class="perfil-stat-label">Carpetas activas</div>
        </div>
      </div>
    </div>
  `;
}
