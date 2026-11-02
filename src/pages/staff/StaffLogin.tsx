import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { EyeIcon, EyeOffIcon, Loader2Icon, LockIcon } from 'lucide-react';
import { useStaffAuth } from '../../contexts/StaffAuthContext';
import type { StaffRole } from '../../types/staff';
import { roleHome } from '../../utils/staffAuth';
import { Logo } from '../../components/shared/Logo';

/** Return to the page they were sent from, but only if their role may open it. */
function landingFor(role: StaffRole, from: string | undefined): string {
  if (from) {
    const okForRole = role === 'kitchen' ? from.startsWith('/kitchen') : from.startsWith('/admin') || from.startsWith('/kitchen');
    if (okForRole) return from;
  }
  return roleHome(role);
}

/**
 * Staff sign-in. Not linked from anywhere in the customer experience —
 * staff open /staff/login (bookmark it on the kitchen tablet / manager phone).
 */
export function StaffLogin() {
  const { user, login } = useStaffAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as {from?: string;} | null)?.from;

  const [email, setEmail] = useState('');
  const [passcode, setPasscode] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) {
    return <Navigate to={landingFor(user.role, from)} replace />;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const res = await login(email, passcode);
    setBusy(false);
    if (res.ok) {
      navigate(landingFor(res.user.role, from), { replace: true });
      return;
    }
    setError(res.error);
    setPasscode('');
  };

  return (
    <main className="grid min-h-screen w-full place-items-center bg-cream p-5">
      <div className="w-full max-w-sm">
        <div className="flex justify-center">
          <Logo size="md" />
        </div>
        <form onSubmit={submit} className="mt-8 rounded-3xl bg-surface p-6 ring-1 ring-line">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand/10 text-brand-strong">
              <LockIcon size={18} />
            </span>
            <div>
              <h1 className="font-display text-2xl font-black uppercase leading-none tracking-tight">Staff sign in</h1>
              <p className="mt-0.5 text-xs text-muted">Kitchen, manager and admin access</p>
            </div>
          </div>

          <label htmlFor="staff-email" className="mt-6 block text-sm font-semibold">
            Email
          </label>
          <input
            id="staff-email"
            type="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            className="mt-1.5 h-12 w-full rounded-xl border border-line bg-surface px-3.5 outline-none focus:border-brand" />
          

          <label htmlFor="staff-passcode" className="mt-4 block text-sm font-semibold">
            Passcode
          </label>
          <div className="relative mt-1.5">
            <input
              id="staff-passcode"
              type={show ? 'text' : 'password'}
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              autoComplete="current-password"
              required
              className="h-12 w-full rounded-xl border border-line bg-surface pl-3.5 pr-12 outline-none focus:border-brand" />
            
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? 'Hide passcode' : 'Show passcode'}
              className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-muted hover:text-ink">
              
              {show ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
            </button>
          </div>

          <p role="alert" aria-live="polite" className={`mt-3 min-h-[20px] text-sm font-medium text-danger`}>
            {error}
          </p>

          <button
            type="submit"
            disabled={busy || !email || !passcode}
            className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand font-semibold text-brand-ink transition-opacity duration-150 disabled:cursor-not-allowed disabled:opacity-40">
            
            {busy ? <><Loader2Icon size={18} className="animate-spin" /> Signing in…</> : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted">
          Customer? <Link to="/" className="font-semibold text-ink hover:underline">Go to the ordering page</Link>
        </p>
      </div>
    </main>);

}
