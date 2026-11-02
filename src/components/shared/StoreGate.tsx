import React from 'react';
import { Loader2Icon, WifiOffIcon } from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';

/** Shows a loading screen until the menu and settings arrive from the database. */
export function StoreGate({ children }: {children: React.ReactNode;}) {
  const { ready, loadError, retry } = useStore();
  if (ready) return <>{children}</>;

  return (
    <main className="grid min-h-screen w-full place-items-center bg-cream p-6 text-center">
      {loadError ?
      <div className="max-w-sm">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-danger/10 text-danger">
            <WifiOffIcon size={26} />
          </span>
          <h1 className="mt-4 font-display text-2xl font-extrabold uppercase tracking-tight">We can’t reach the kitchen</h1>
          <p className="mt-2 text-sm text-muted">Check your internet connection and try again.</p>
          <p className="mt-2 break-words text-xs text-muted/70">{loadError}</p>
          <button type="button" onClick={retry} className="mt-5 h-12 rounded-full bg-brand px-6 font-semibold text-brand-ink">
            Try again
          </button>
        </div> :

      <div role="status" aria-live="polite" className="flex items-center gap-3 text-muted">
          <Loader2Icon className="animate-spin" size={22} /> Loading menu…
        </div>
      }
    </main>);

}
