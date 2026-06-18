// Exports: renderPerfil()
import { showToast } from '../../components/ui/toast.js';

const USER = {
  name: 'Mario Luna',
  initials: 'ML',
  role: 'Administrador',
  org: 'LEN Sports Agency',
  email: 'm.luna@len.pe',
  emailVerified: true,
};

const PLAN_DATA = {
  tier: 'PRO',
  name: 'Plan Pro',
  description: 'Para equipos y agencias que gestionan eventos profesionales',
  price: '$79',
  period: 'mes',
  renewal: '18 jul 2026',
  nextTier: 'Enterprise',
  features: [
    'Almacenamiento 500 GB',
    'Face ID ilimitado',
    'Portales ilimitados',
    'Analytics avanzado',
    'Soporte prioritario',
    'Acceso a API',
  ],
};

const INVOICES = [
  { date: '18 jun 2026', desc: 'Plan Pro — Junio 2026',   amount: '$79.00', status: 'paid'   },
  { date: '18 may 2026', desc: 'Plan Pro — Mayo 2026',    amount: '$79.00', status: 'paid'   },
  { date: '18 abr 2026', desc: 'Plan Pro — Abril 2026',   amount: '$79.00', status: 'paid'   },
  { date: '18 mar 2026', desc: 'Plan Pro — Marzo 2026',   amount: '$79.00', status: 'failed' },
  { date: '18 feb 2026', desc: 'Plan Pro — Febrero 2026', amount: '$79.00', status: 'paid'   },
];

// Module-level state: persists while the app is open
let _avatarDataUrl = null;
const _state = { name: USER.name, org: USER.org };

// ── Helpers ───────────────────────────────────────────────────────────────

function _getInitials() {
  const parts = _state.name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
}

function _syncSidebarAvatar() {
  const el = document.getElementById('sb-avatar');
  if (!el) return;
  if (_avatarDataUrl) {
    el.innerHTML = `<img src="${_avatarDataUrl}" alt="avatar">`;
  } else {
    el.textContent = _getInitials();
  }
}

function _refreshAvatarUI() {
  const container = document.getElementById('pf-avatar');
  if (!container) return;

  if (_avatarDataUrl) {
    container.innerHTML = `
      <img src="${_avatarDataUrl}" alt="Foto de perfil">
      <div class="pf-avatar-overlay">
        <span class="msi xs">photo_camera</span>
        <span class="pf-avatar-overlay-txt">Cambiar</span>
      </div>`;
  } else {
    container.innerHTML = `
      <span class="pf-avatar-initials">${_getInitials()}</span>
      <div class="pf-avatar-overlay">
        <span class="msi xs">photo_camera</span>
        <span class="pf-avatar-overlay-txt">Cambiar</span>
      </div>`;
  }

  const deleteBtn = document.getElementById('pf-delete-btn');
  if (deleteBtn) deleteBtn.style.display = _avatarDataUrl ? '' : 'none';
}

function _strengthOf(pw) {
  let score = 0;
  if (pw.length >= 8)            score++;
  if (/[A-Z]/.test(pw))          score++;
  if (/[0-9]/.test(pw))          score++;
  if (/[^A-Za-z0-9]/.test(pw))   score++;
  const labels = ['', 'Débil', 'Regular', 'Buena', 'Fuerte'];
  const clses  = ['', 'str-weak', 'str-fair', 'str-good', 'str-strong'];
  return { score, label: labels[score] || '', cls: clses[score] || '' };
}

// ── Main render ───────────────────────────────────────────────────────────

export function renderPerfil() {
  const el = document.getElementById('sec-perfil');
  if (!el) return;

  el.innerHTML = `
    <div class="content pf-wrap">

      <!-- ══ CUENTA ════════════════════════════════════════════════ -->
      <div class="pf-section-label">Cuenta</div>
      <div class="pf-card">

        <!-- Avatar -->
        <div class="pf-avatar-block">
          <div class="pf-avatar" id="pf-avatar" title="Cambiar foto de perfil"></div>
          <div class="pf-avatar-meta">
            <div class="pf-avatar-name" id="pf-display-name">${_state.name}</div>
            <div class="pf-avatar-hint">JPG, PNG, WebP · máx 5 MB · recomendado 400×400 px</div>
            <div class="pf-avatar-actions">
              <button class="btn-ghost" id="pf-upload-btn">
                <span class="msi xs">upload</span>Subir foto
              </button>
              <button class="btn-ghost pf-btn-danger" id="pf-delete-btn" style="display:none">
                <span class="msi xs">delete</span>Eliminar
              </button>
            </div>
          </div>
        </div>

        <!-- Campos -->
        <div class="pf-fields">

          <div class="pf-field-row" id="pf-row-name">
            <div class="pf-field-label">Nombre</div>
            <div class="pf-field-content">
              <span class="pf-field-val" id="pf-val-name">${_state.name}</span>
              <input class="pf-field-input field field--inline" id="pf-inp-name"
                     type="text" value="${_state.name}" style="display:none">
            </div>
            <button class="pf-edit-btn" id="pf-edit-name" title="Editar nombre">
              <span class="msi xs" id="pf-edit-name-icon">edit</span>
            </button>
          </div>

          <div class="pf-field-row">
            <div class="pf-field-label">Correo</div>
            <div class="pf-field-content">
              <span class="pf-field-val">${USER.email}</span>
              ${USER.emailVerified
                ? `<span class="pf-verified-badge">
                     <span class="msi xs">verified</span>Verificado
                   </span>`
                : ''}
            </div>
          </div>

          <div class="pf-field-row" id="pf-row-org">
            <div class="pf-field-label">Empresa</div>
            <div class="pf-field-content">
              <span class="pf-field-val" id="pf-val-org">${_state.org}</span>
              <input class="pf-field-input field field--inline" id="pf-inp-org"
                     type="text" value="${_state.org}" style="display:none">
            </div>
            <button class="pf-edit-btn" id="pf-edit-org" title="Editar empresa">
              <span class="msi xs" id="pf-edit-org-icon">edit</span>
            </button>
          </div>

          <div class="pf-field-row pf-password-row" id="pf-row-password">
            <div class="pf-field-label">Contraseña</div>
            <div class="pf-field-content">
              <span class="pf-field-val">••••••••••</span>
            </div>
            <button class="pf-edit-btn" id="pf-toggle-password" title="Cambiar contraseña">
              <span class="msi xs" id="pf-pw-chevron">expand_more</span>
            </button>
          </div>

        </div><!-- /.pf-fields -->

        <!-- Password accordion (sibling de .pf-fields, fuera del flow de rows) -->
        <div class="pf-password-accordion" id="pf-pw-accordion" aria-hidden="true">
          <div class="pf-pw-fields">
            <div class="pf-pw-inp-wrap">
              <input class="field field--rect" id="pf-pw-current"
                     type="password" placeholder="Contraseña actual">
              <button class="pf-eye-btn" data-target="pf-pw-current" tabindex="-1">
                <span class="msi xs">visibility</span>
              </button>
            </div>
            <div>
              <div class="pf-pw-inp-wrap">
                <input class="field field--rect" id="pf-pw-new"
                       type="password" placeholder="Nueva contraseña">
                <button class="pf-eye-btn" data-target="pf-pw-new" tabindex="-1">
                  <span class="msi xs">visibility</span>
                </button>
              </div>
              <div class="pf-strength-wrap" id="pf-strength-wrap" style="display:none">
                <div class="pf-strength-track">
                  <div class="pf-strength-fill" id="pf-strength-fill"></div>
                </div>
                <span class="pf-strength-label" id="pf-strength-label"></span>
              </div>
            </div>
            <div>
              <div class="pf-pw-inp-wrap">
                <input class="field field--rect" id="pf-pw-confirm"
                       type="password" placeholder="Confirmar nueva contraseña">
                <button class="pf-eye-btn" data-target="pf-pw-confirm" tabindex="-1">
                  <span class="msi xs">visibility</span>
                </button>
              </div>
              <div class="pf-pw-error" id="pf-pw-error" style="display:none">
                Las contraseñas no coinciden
              </div>
            </div>
          </div>
          <div class="pf-pw-actions">
            <button class="btn-ghost" id="pf-pw-cancel">Cancelar</button>
            <button class="btn-dark" id="pf-pw-save" disabled>Actualizar contraseña</button>
          </div>
        </div><!-- /.pf-password-accordion -->

        <div class="pf-card-footer">
          <button class="btn-ghost" id="pf-cancel-btn">Cancelar</button>
          <button class="btn-dark" id="pf-save-btn">Guardar cambios</button>
        </div>
      </div><!-- /.pf-card cuenta -->

      <!-- ══ PLAN ══════════════════════════════════════════════════ -->
      <div class="pf-section-label">Plan</div>
      <div class="pf-card pf-plan-card">
        <div class="pf-plan-header">
          <div class="pf-plan-left">
            <div class="pf-tier-badge">${PLAN_DATA.tier}</div>
            <div class="pf-plan-name">${PLAN_DATA.name}</div>
            <div class="pf-plan-desc">${PLAN_DATA.description}</div>
          </div>
          <div class="pf-plan-price">
            <span class="pf-price-amount">${PLAN_DATA.price}</span>
            <span class="pf-price-period">/${PLAN_DATA.period}</span>
          </div>
        </div>
        <div class="pf-features-grid">
          ${PLAN_DATA.features.map(f => `
            <div class="pf-feature-item">
              <span class="msi xs pf-feature-check">check_circle</span>
              <span>${f}</span>
            </div>`).join('')}
        </div>
        <div class="pf-plan-footer">
          <div class="pf-renewal">
            <span class="msi xs">autorenew</span>
            Próxima renovación: <strong>${PLAN_DATA.renewal}</strong>
          </div>
          <div class="pf-plan-actions">
            <button class="btn-ghost pf-btn-danger" id="pf-cancel-plan">Cancelar plan</button>
            <button class="btn-dark" id="pf-upgrade-btn">
              <span class="msi xs">arrow_upward</span>Actualizar a ${PLAN_DATA.nextTier}
            </button>
          </div>
        </div>
      </div><!-- /.pf-card plan -->

      <!-- ══ FACTURACIÓN ══════════════════════════════════════════════════ -->
      <div class="pf-section-label">Facturación</div>
      <div class="pf-card">

        <!-- Método de pago -->
        <div class="pf-payment-block">
          <div class="pf-block-title">Método de pago</div>
          <div class="pf-payment-row">
            <div class="pf-card-type">
              <div class="pf-card-icon">
                <span class="msi xs">credit_card</span>
              </div>
              <div class="pf-card-info">
                <span class="pf-card-brand">Visa</span>
                <span class="pf-card-number">•••• •••• •••• 4242</span>
                <span class="pf-card-exp">Vence 09/27</span>
              </div>
            </div>
            <button class="btn-ghost" id="pf-change-payment">
              <span class="msi xs">edit</span>Cambiar
            </button>
          </div>
        </div>

        <div class="pf-block-divider"></div>

        <!-- Historial de facturas -->
        <div class="pf-invoices-block">
          <div class="pf-invoices-header">
            <div class="pf-block-title" style="margin-bottom:0">Historial de facturas</div>
            <button class="btn-ghost" id="pf-export-all">
              <span class="msi xs">download</span>Exportar todo
            </button>
          </div>
          <div class="pf-invoice-table">
            <div class="pf-invoice-head">
              <span>Fecha</span>
              <span>Descripción</span>
              <span>Monto</span>
              <span>Estado</span>
              <span></span>
            </div>
            ${INVOICES.map((inv, i) => `
              <div class="pf-invoice-row">
                <span class="pf-inv-date">${inv.date}</span>
                <span class="pf-inv-desc">${inv.desc}</span>
                <span class="pf-inv-amount">${inv.amount}</span>
                <span class="pf-inv-status pf-status-${inv.status}">
                  ${inv.status === 'paid' ? 'Pagado' : 'Fallido'}
                </span>
                <button class="pf-dl-btn" title="Descargar PDF" data-inv="${i}">
                  <span class="msi xs">download</span>
                </button>
              </div>`).join('')}
          </div>
          <div class="pf-invoice-note">Las facturas se generan automáticamente el día 18 de cada mes.</div>
        </div>

      </div><!-- /.pf-card billing -->

    </div><!-- /.pf-wrap -->
  `;

  // Ensure hidden file input exists (singleton — not inside innerHTML)
  let fileInput = document.getElementById('pf-file-input');
  if (!fileInput) {
    fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'pf-file-input';
    fileInput.accept = 'image/jpeg,image/png,image/webp';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
  }

  _refreshAvatarUI();
  _bindEvents(fileInput);
}

// ── Event binding ─────────────────────────────────────────────────────────

function _bindEvents(fileInput) {
  // Avatar: click anywhere on avatar or "Subir foto" → open file picker
  document.getElementById('pf-avatar')?.addEventListener('click', () => fileInput.click());
  document.getElementById('pf-upload-btn')?.addEventListener('click', () => fileInput.click());

  fileInput.onchange = (e) => {
    const file = e.target.files?.[0];
    fileInput.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('La imagen supera el límite de 5 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      _avatarDataUrl = ev.target.result;
      _refreshAvatarUI();
      _syncSidebarAvatar();
      showToast('✓ Foto de perfil actualizada');
    };
    reader.readAsDataURL(file);
  };

  document.getElementById('pf-delete-btn')?.addEventListener('click', () => {
    _avatarDataUrl = null;
    _refreshAvatarUI();
    _syncSidebarAvatar();
    showToast('✓ Foto de perfil eliminada');
  });

  // Inline edit: Nombre / Empresa
  _bindInlineEdit('name', '✓ Nombre guardado');
  _bindInlineEdit('org',  '✓ Empresa guardada');

  // Card footer
  document.getElementById('pf-cancel-btn')?.addEventListener('click', _cancelAccountChanges);
  document.getElementById('pf-save-btn')?.addEventListener('click',   _saveAccountChanges);

  // Password accordion
  _bindPasswordAccordion();

  // Plan
  document.getElementById('pf-cancel-plan')?.addEventListener('click', () =>
    showToast('Contacta a soporte para cancelar tu plan'));
  document.getElementById('pf-upgrade-btn')?.addEventListener('click', () =>
    showToast('Próximamente: planes Enterprise'));

  // Billing
  document.getElementById('pf-change-payment')?.addEventListener('click', () =>
    showToast('Próximamente: actualización de método de pago'));
  document.getElementById('pf-export-all')?.addEventListener('click', () =>
    showToast('✓ Exportando todas las facturas…'));
  document.querySelectorAll('.pf-dl-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const inv = INVOICES[parseInt(btn.dataset.inv)];
      if (inv) showToast(`✓ Descargando: ${inv.desc}`);
    });
  });
}

// ── Inline edit ───────────────────────────────────────────────────────────

function _bindInlineEdit(field, successMsg) {
  const editBtn = document.getElementById(`pf-edit-${field}`);
  const icon    = document.getElementById(`pf-edit-${field}-icon`);
  const valEl   = document.getElementById(`pf-val-${field}`);
  const inp     = document.getElementById(`pf-inp-${field}`);
  const row     = document.getElementById(`pf-row-${field}`);
  if (!editBtn || !valEl || !inp) return;

  let editing = false;

  function enterEdit() {
    editing = true;
    valEl.style.display = 'none';
    inp.style.display = '';
    inp.value = valEl.textContent;
    icon.textContent = 'check';
    row.classList.add('editing');
    inp.focus();
    inp.setSelectionRange(inp.value.length, inp.value.length);
  }

  function commitEdit() {
    const newVal = inp.value.trim() || valEl.textContent;
    valEl.textContent = newVal;
    _state[field] = newVal;
    if (field === 'name') {
      const displayName = document.getElementById('pf-display-name');
      if (displayName) displayName.textContent = newVal;
      // Update initials in avatar if no photo
      if (!_avatarDataUrl) _refreshAvatarUI();
      _syncSidebarAvatar();
    }
    cancelEdit(false);
    showToast(successMsg);
  }

  function cancelEdit(revert = true) {
    editing = false;
    if (revert) inp.value = valEl.textContent;
    valEl.style.display = '';
    inp.style.display = 'none';
    icon.textContent = 'edit';
    row.classList.remove('editing');
  }

  editBtn.addEventListener('click', () => editing ? commitEdit() : enterEdit());

  inp.addEventListener('keydown', (e) => {
    if (e.key === 'Enter')  { e.preventDefault(); commitEdit(); }
    if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
  });
}

// ── Account card footer ───────────────────────────────────────────────────

function _cancelAccountChanges() {
  // Revert any open inline edits back to saved state
  ['name', 'org'].forEach(field => {
    const valEl = document.getElementById(`pf-val-${field}`);
    const inp   = document.getElementById(`pf-inp-${field}`);
    const icon  = document.getElementById(`pf-edit-${field}-icon`);
    const row   = document.getElementById(`pf-row-${field}`);
    if (!valEl) return;
    valEl.textContent = _state[field];
    if (inp)  { inp.value = _state[field]; inp.style.display = 'none'; }
    if (valEl) valEl.style.display = '';
    if (icon)  icon.textContent = 'edit';
    if (row)   row.classList.remove('editing');
  });
  showToast('Cambios descartados');
}

function _saveAccountChanges() {
  // Commit any open inline edit before saving
  ['name', 'org'].forEach(field => {
    const valEl = document.getElementById(`pf-val-${field}`);
    const inp   = document.getElementById(`pf-inp-${field}`);
    if (!valEl || !inp || inp.style.display === 'none') return;
    const newVal = inp.value.trim() || valEl.textContent;
    valEl.textContent = newVal;
    _state[field] = newVal;
    if (field === 'name') {
      const displayName = document.getElementById('pf-display-name');
      if (displayName) displayName.textContent = newVal;
      if (!_avatarDataUrl) _refreshAvatarUI();
      _syncSidebarAvatar();
    }
    inp.style.display = 'none';
    valEl.style.display = '';
    const icon = document.getElementById(`pf-edit-${field}-icon`);
    if (icon) icon.textContent = 'edit';
    const row = document.getElementById(`pf-row-${field}`);
    if (row) row.classList.remove('editing');
  });
  showToast('✓ Perfil actualizado correctamente');
}

// ── Password accordion ────────────────────────────────────────────────────

function _bindPasswordAccordion() {
  const toggleBtn    = document.getElementById('pf-toggle-password');
  const accordion    = document.getElementById('pf-pw-accordion');
  const chevron      = document.getElementById('pf-pw-chevron');
  const pwCurrent    = document.getElementById('pf-pw-current');
  const pwNew        = document.getElementById('pf-pw-new');
  const pwConfirm    = document.getElementById('pf-pw-confirm');
  const saveBtn      = document.getElementById('pf-pw-save');
  const errorEl      = document.getElementById('pf-pw-error');
  const strengthWrap = document.getElementById('pf-strength-wrap');
  const strengthFill = document.getElementById('pf-strength-fill');
  const strengthLabel= document.getElementById('pf-strength-label');
  if (!toggleBtn || !accordion) return;

  let open = false;

  function openAccordion() {
    open = true;
    // Use a generous max-height to accommodate dynamic content (strength bar)
    accordion.style.maxHeight = '400px';
    accordion.removeAttribute('aria-hidden');
    chevron.textContent = 'expand_less';
    setTimeout(() => pwCurrent?.focus(), 320);
  }

  function closeAccordion() {
    open = false;
    accordion.style.maxHeight = '0';
    accordion.setAttribute('aria-hidden', 'true');
    chevron.textContent = 'expand_more';
    // Reset fields
    [pwCurrent, pwNew, pwConfirm].forEach(el => { if (el) el.value = ''; });
    if (errorEl)      { errorEl.style.display = 'none'; }
    if (pwConfirm)    { pwConfirm.classList.remove('inp-error'); }
    if (strengthWrap) { strengthWrap.style.display = 'none'; }
    if (saveBtn)      { saveBtn.disabled = true; }
    // Reset eye icons
    [pwCurrent, pwNew, pwConfirm].forEach(el => { if (el) el.type = 'password'; });
    document.querySelectorAll('.pf-eye-btn .msi').forEach(i => { i.textContent = 'visibility'; });
  }

  toggleBtn.addEventListener('click', () => open ? closeAccordion() : openAccordion());

  // Also make the whole password row toggle on click (except the button itself)
  document.getElementById('pf-row-password')?.addEventListener('click', (e) => {
    if (e.target === toggleBtn || toggleBtn.contains(e.target)) return;
    open ? closeAccordion() : openAccordion();
  });

  // Strength meter
  pwNew?.addEventListener('input', () => {
    const pw = pwNew.value;
    if (!pw) { strengthWrap.style.display = 'none'; }
    else {
      strengthWrap.style.display = 'flex';
      const { score, label, cls } = _strengthOf(pw);
      strengthFill.style.width = (score / 4 * 100) + '%';
      strengthFill.className   = 'pf-strength-fill ' + cls;
      strengthLabel.textContent = label;
      strengthLabel.className  = 'pf-strength-label ' + cls;
    }
    _validateMatch(pwNew, pwConfirm, errorEl);
    _refreshSaveBtn(pwCurrent, pwNew, pwConfirm, saveBtn);
  });

  pwConfirm?.addEventListener('input', () => {
    _validateMatch(pwNew, pwConfirm, errorEl);
    _refreshSaveBtn(pwCurrent, pwNew, pwConfirm, saveBtn);
  });

  pwCurrent?.addEventListener('input', () =>
    _refreshSaveBtn(pwCurrent, pwNew, pwConfirm, saveBtn));

  // Eye toggle
  document.querySelectorAll('.pf-eye-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const target = document.getElementById(btn.dataset.target);
      if (!target) return;
      const show = target.type === 'password';
      target.type = show ? 'text' : 'password';
      btn.querySelector('.msi').textContent = show ? 'visibility_off' : 'visibility';
    });
  });

  // Accordion action buttons
  document.getElementById('pf-pw-cancel')?.addEventListener('click', closeAccordion);

  saveBtn?.addEventListener('click', () => {
    if (pwNew.value !== pwConfirm.value) {
      pwConfirm.classList.add('inp-error');
      if (errorEl) errorEl.style.display = '';
      return;
    }
    closeAccordion();
    showToast('✓ Contraseña actualizada');
  });
}

function _validateMatch(pwNew, pwConfirm, errorEl) {
  if (!pwConfirm?.value) {
    pwConfirm?.classList.remove('inp-error');
    if (errorEl) errorEl.style.display = 'none';
    return;
  }
  const mismatch = pwNew?.value !== pwConfirm.value;
  pwConfirm.classList.toggle('inp-error', mismatch);
  if (errorEl) errorEl.style.display = mismatch ? '' : 'none';
}

function _refreshSaveBtn(pwCurrent, pwNew, pwConfirm, saveBtn) {
  if (!saveBtn) return;
  saveBtn.disabled = !(
    pwCurrent?.value &&
    pwNew?.value &&
    pwConfirm?.value &&
    pwNew.value === pwConfirm.value
  );
}
