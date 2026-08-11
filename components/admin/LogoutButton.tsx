'use client';

export default function LogoutButton() {
  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="font-mono text-xs uppercase tracking-widest text-white/40 transition-colors hover:text-white"
    >
      Log out
    </button>
  );
}
