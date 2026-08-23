'use client';

export default function UserLogoutButton() {
  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="font-mono text-base uppercase tracking-wider text-text-muted underline hover:text-text-heading"
    >
      Log out
    </button>
  );
}
