'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';

interface AuthPopupProps {
  onClose: () => void;
}

// Faint outline flourishes echoing the feather in the site's logo — kept
// low-opacity so they read as background texture, not decoration that
// competes with the form (this is still a funeral/wedding-facing site).
function BackgroundDoodles() {
  return (
    <>
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 text-accent-gold/[0.08]"
        viewBox="0 0 100 100"
        fill="none"
      >
        <path
          d="M50 4C68 16 82 34 82 54c0 20-16 34-32 42-16-8-32-22-32-42C18 34 32 16 50 4Z"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        <path d="M50 14v78M50 30c10 4 16 10 16 18M50 46c10 4 16 10 16 18M50 30c-10 4-16 10-16 18M50 46c-10 4-16 10-16 18" stroke="currentColor" strokeWidth="1" />
      </svg>
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-12 -left-10 h-32 w-32 text-accent-blush/[0.10]"
        viewBox="0 0 100 100"
        fill="none"
      >
        <circle cx="50" cy="50" r="38" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="50" cy="50" r="24" stroke="currentColor" strokeWidth="1" />
      </svg>
    </>
  );
}

const inputClass =
  'mt-1.5 w-full rounded-xl border border-border bg-bg-primary px-4 py-2.5 font-body text-base text-text-heading outline-none transition-colors focus:border-accent-gold';
const labelClass = 'block font-mono text-base uppercase tracking-wider text-text-muted';

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3l18 18" />
      <path d="M10.6 5.1A10.7 10.7 0 0 1 12 5c7 0 10.5 7 10.5 7a13.5 13.5 0 0 1-3.1 4.1M6.6 6.6C3.4 8.5 1.5 12 1.5 12s3.5 7 10.5 7a9.9 9.9 0 0 0 5.4-1.6" />
      <path d="M9.9 10.1a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  minLength?: number;
  rightSlot?: React.ReactNode;
}

function PasswordField({ id, label, value, onChange, minLength, rightSlot }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className={labelClass}>{label}</label>
        {rightSlot}
      </div>
      <div className="relative mt-1.5">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          required
          minLength={minLength}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-border bg-bg-primary px-4 py-2.5 pr-11 font-body text-base text-text-heading outline-none transition-colors focus:border-accent-gold"
        />
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-text-muted transition-colors hover:text-text-heading"
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </div>
  );
}

export default function AuthPopup({ onClose }: AuthPopupProps) {
  const [view, setView] = useState<'register' | 'login'>('register');

  // Register form
  const [name, setName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [regMessage, setRegMessage] = useState('');

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>('idle');

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    setRegLoading(true);
    setRegError('');
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name || undefined, email: regEmail, password: regPassword }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Sign up failed.');
      setRegMessage(json.message || 'Check your email to verify your account.');
    } catch (err) {
      setRegError(err instanceof Error ? err.message : 'Sign up failed.');
    } finally {
      setRegLoading(false);
    }
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    setNeedsVerification(false);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        if (res.status === 403) setNeedsVerification(true);
        throw new Error(json.error || 'Login failed.');
      }
      const role = json.data?.user?.role;
      const isStaff = role === 'designer' || role === 'employee' || role === 'proofreader' || role === 'admin';
      window.location.href = isStaff ? '/staff' : '/account';
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleResend() {
    setResendState('sending');
    try {
      await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail }),
      });
    } finally {
      setResendState('sent');
    }
  }

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 px-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={view === 'register' ? 'Create an account' : 'Log in'}
        className="relative w-full max-w-[400px] overflow-hidden rounded-2xl border border-border bg-bg-primary p-8 shadow-[0_24px_60px_rgba(0,0,0,0.25)]"
      >
        <BackgroundDoodles />

        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 flex h-7 w-7 items-center justify-center text-text-muted transition-colors hover:text-text-heading"
        >
          ×
        </button>

        <div className="relative">
          {regMessage ? (
            <div>
              <span className="font-mono text-label uppercase tracking-wider text-accent-gold">Almost there</span>
              <h2 className="mt-2 font-display text-xl text-text-heading">Check your email</h2>
              <p className="mt-2 font-body text-base text-text-muted">{regMessage}</p>
              <button
                type="button"
                onClick={() => {
                  setRegMessage('');
                  setView('login');
                }}
                className="mt-5 w-full rounded-2xl border border-text-heading bg-text-heading px-5 py-2.5 text-center font-body text-label uppercase tracking-wider text-bg-primary transition-opacity hover:opacity-85"
              >
                Back to login
              </button>
            </div>
          ) : (
            <>
              {/* Register given priority — first tab, first in reading order */}
              <div className="mb-5 flex items-center gap-6 pr-6">
                <button
                  type="button"
                  onClick={() => setView('register')}
                  className={`pb-1 font-body text-label uppercase tracking-wider transition-colors ${view === 'register' ? 'border-b-2 border-accent-gold text-text-heading' : 'border-b-2 border-transparent text-text-muted hover:text-text-heading'
                    }`}
                >
                  Register
                </button>
                <button
                  type="button"
                  onClick={() => setView('login')}
                  className={`pb-1 font-body text-label uppercase tracking-wider transition-colors ${view === 'login' ? 'border-b-2 border-accent-gold text-text-heading' : 'border-b-2 border-transparent text-text-muted hover:text-text-heading'
                    }`}
                >
                  Login
                </button>
              </div>

              {view === 'register' ? (
                <form onSubmit={handleRegister} className="space-y-3" noValidate>
                  <div>
                    <label htmlFor="popup-signup-name" className={labelClass}>Full Name</label>
                    <input
                      id="popup-signup-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="popup-signup-email" className={labelClass}>Email</label>
                    <input
                      id="popup-signup-email"
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <PasswordField
                    id="popup-signup-password"
                    label="Password"
                    value={regPassword}
                    onChange={setRegPassword}
                    minLength={8}
                  />

                  {regError && (
                    <p className="font-body text-base text-accent-blush" role="alert">{regError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={regLoading}
                    className="w-full rounded-2xl border border-accent-gold bg-accent-gold px-5 py-2.5 font-body text-label uppercase tracking-wider text-bg-primary transition-all duration-300 hover:bg-accent-gold-hover disabled:opacity-50"
                  >
                    {regLoading ? 'Creating account…' : 'Create account'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="space-y-3" noValidate>
                  <div>
                    <label htmlFor="popup-login-email" className={labelClass}>Email</label>
                    <input
                      id="popup-login-email"
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <PasswordField
                    id="popup-login-password"
                    label="Password"
                    value={loginPassword}
                    onChange={setLoginPassword}
                    rightSlot={
                      <Link
                        href="/forgot-password"
                        onClick={onClose}
                        className="font-mono text-base uppercase tracking-wider text-accent-gold link-underline"
                      >
                        Forgot?
                      </Link>
                    }
                  />

                  {loginError && (
                    <div>
                      <p className="font-body text-base text-accent-blush" role="alert">{loginError}</p>
                      {needsVerification && (
                        <button
                          type="button"
                          onClick={handleResend}
                          disabled={resendState !== 'idle'}
                          className="mt-1.5 font-mono text-base uppercase tracking-wider text-accent-gold underline disabled:opacity-50"
                        >
                          {resendState === 'sent' ? 'Verification link sent' : resendState === 'sending' ? 'Sending…' : 'Resend verification email'}
                        </button>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full rounded-2xl border border-text-heading bg-text-heading px-5 py-2.5 font-body text-label uppercase tracking-wider text-bg-primary transition-opacity hover:opacity-85 disabled:opacity-50"
                  >
                    {loginLoading ? 'Logging in…' : 'Log in'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
