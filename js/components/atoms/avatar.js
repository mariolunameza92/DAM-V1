// Atom: user-avatar — bolita de iniciales de usuario con color de identidad.
// Export: userAvatar(initials, color) → HTML string
// color debe ser un token var(--user-color-N), nunca hex directo.
export function userAvatar(initials, color) {
  return `<div class="user-avatar" style="background:${color}">${initials}</div>`;
}
