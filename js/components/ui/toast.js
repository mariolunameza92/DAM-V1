// Exports: showToast(msg, duration?)
export function showToast(msg, duration = 2500) {
  let t = document.getElementById('_toast');
  if (!t) {
    t = document.createElement('div');
    t.id = '_toast';
    t.style.cssText = 'position:fixed;bottom:28px;left:50%;transform:translateX(-50%);background:var(--g950);color:var(--g50);padding:10px 20px;border-radius:80px;font-size:12px;font-family:var(--font-mono);z-index:9999;pointer-events:none;transition:opacity .3s;white-space:nowrap';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(t._tid);
  if (duration > 0) t._tid = setTimeout(() => { t.style.opacity = '0'; }, duration);
}
