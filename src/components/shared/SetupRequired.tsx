import React from 'react';
import { DatabaseIcon } from 'lucide-react';

/** Shown instead of the app until the Supabase keys have been added to .env */
export function SetupRequired() {
  return (
    <main className="grid min-h-screen w-full place-items-center bg-cream p-6">
      <div className="w-full max-w-lg rounded-3xl bg-surface p-8 ring-1 ring-line">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 text-brand-strong">
          <DatabaseIcon size={24} />
        </span>
        <h1 className="mt-4 font-display text-3xl font-black uppercase leading-none tracking-tight">Connect your database</h1>
        <p className="mt-3 text-sm text-muted">This app needs a Supabase project. Add these two values to a file named <code className="font-mono">.env</code> in the project folder, then restart the dev server:</p>
        <pre className="mt-4 overflow-x-auto rounded-2xl bg-ink p-4 text-xs leading-relaxed text-white">{`VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ANON-PUBLIC-KEY`}</pre>
        <p className="mt-4 text-sm text-muted">Both are in Supabase → Project Settings → API. Full steps are in the README.</p>
      </div>
    </main>);

}
