import React, { useEffect, useState } from 'react';
import { KeyRoundIcon, Loader2Icon, PlusIcon, Trash2Icon } from 'lucide-react';
import { toast } from 'sonner';
import type { StaffRole } from '../../types/staff';
import { useStaffAuth, type ActionResult } from '../../contexts/StaffAuthContext';
import { MIN_PASSCODE_LENGTH, roleLabels } from '../../utils/staffAuth';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';

const roleHints: Record<StaffRole, string> = {
  admin: 'Everything, including settings and staff accounts',
  manager: 'Orders, menu, tables, reports and the kitchen display',
  kitchen: 'Kitchen display only'
};

const input = 'h-11 w-full rounded-xl border border-line bg-surface px-3.5 outline-none focus:border-brand';

export function Staff() {
  const { user, accounts, loadAccounts, addAccount, setPasscode, setActive, setRole, removeAccount } = useStaffAuth();
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setNewRole] = useState<StaffRole>('kitchen');
  const [passcode, setNewPasscode] = useState('');
  const [resetId, setResetId] = useState<string | null>(null);
  const [resetValue, setResetValue] = useState('');
  const [removeId, setRemoveId] = useState<string | null>(null);

  useEffect(() => {
    loadAccounts().then((res) => {
      if (!res.ok) toast.error(res.error);
      setLoaded(true);
    });
  }, [loadAccounts]);

  /** Runs an account action, shows the outcome, returns whether it worked. */
  const run = async (job: () => Promise<ActionResult>, okMsg: string): Promise<boolean> => {
    setBusy(true);
    const res = await job();
    setBusy(false);
    if (res.ok) toast.success(okMsg);else toast.error(res.error);
    return res.ok;
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await run(() => addAccount({ name, email, role, passcode }), 'Staff account added')) {
      setName('');
      setEmail('');
      setNewPasscode('');
    }
  };

  return (
    <div className="max-w-3xl space-y-8 p-4 md:p-8">
      <AdminPageHeader title="Staff access" description="Only people with an account can open the kitchen display or back office. Customers never see these areas." />

      <section>
        <h2 className="mb-3 font-display text-xl font-extrabold uppercase tracking-tight">Accounts</h2>
        {!loaded ?
        <p className="flex items-center gap-2 text-sm text-muted">
            <Loader2Icon size={16} className="animate-spin" /> Loading accounts…
          </p> :

        <ul className="divide-y divide-line rounded-3xl bg-surface px-6 ring-1 ring-line">
            {accounts.map((a) => {
            const isMe = a.id === user?.id;
            return (
              <li key={a.id} className="py-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">
                        {a.name} {isMe && <span className="text-xs font-medium text-muted">(you)</span>}
                      </p>
                      <p className="truncate text-sm text-muted">
                        {a.email}
                        {!a.active && <span className="ml-2 rounded-full bg-danger/10 px-2 py-0.5 text-xs font-semibold text-danger">Disabled</span>}
                      </p>
                    </div>
                    <label className="sr-only" htmlFor={`role-${a.id}`}>
                      Role for {a.name}
                    </label>
                    <select
                    id={`role-${a.id}`}
                    value={a.role}
                    disabled={busy || isMe}
                    onChange={(e) => void run(() => setRole(a.id, e.target.value as StaffRole), 'Role updated')}
                    className="h-10 rounded-full border border-line bg-surface px-3 text-sm font-medium outline-none focus:border-brand disabled:opacity-60">
                    
                      {(Object.keys(roleLabels) as StaffRole[]).map((r) =>
                    <option key={r} value={r}>
                          {roleLabels[r]}
                        </option>
                    )}
                    </select>
                    <button
                    type="button"
                    onClick={() => {
                      setResetId(resetId === a.id ? null : a.id);
                      setResetValue('');
                    }}
                    className="inline-flex h-10 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold ring-1 ring-line hover:bg-cream">
                    
                      <KeyRoundIcon size={15} /> Passcode
                    </button>
                    <button
                    type="button"
                    disabled={busy || isMe}
                    onClick={() => void run(() => setActive(a.id, !a.active), a.active ? 'Account disabled' : 'Account enabled')}
                    title={isMe ? "You can't disable your own account" : undefined}
                    className="h-10 rounded-full px-3.5 text-sm font-semibold ring-1 ring-line hover:bg-cream disabled:cursor-not-allowed disabled:opacity-40">
                    
                      {a.active ? 'Disable' : 'Enable'}
                    </button>
                    {removeId === a.id ?
                  <span className="flex gap-2">
                        <button type="button" onClick={() => setRemoveId(null)} className="h-10 rounded-full px-3.5 text-sm font-semibold ring-1 ring-line">
                          Cancel
                        </button>
                        <button
                      type="button"
                      disabled={busy}
                      onClick={async () => {
                        await run(() => removeAccount(a.id), 'Account removed');
                        setRemoveId(null);
                      }}
                      className="h-10 rounded-full bg-danger px-3.5 text-sm font-semibold text-white disabled:opacity-60">
                      
                          Remove
                        </button>
                      </span> :

                  <button
                    type="button"
                    onClick={() => setRemoveId(a.id)}
                    disabled={isMe}
                    title={isMe ? "You can't remove your own account" : 'Remove account'}
                    aria-label={`Remove ${a.name}`}
                    className="grid h-10 w-10 place-items-center rounded-full text-muted ring-1 ring-line hover:text-danger disabled:cursor-not-allowed disabled:opacity-30">
                    
                        <Trash2Icon size={16} />
                      </button>
                  }
                  </div>
                  {resetId === a.id &&
                <form
                  className="mt-3 flex flex-wrap gap-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (await run(() => setPasscode(a.id, resetValue), 'Passcode updated')) setResetId(null);
                  }}>
                  
                      <label htmlFor={`pc-${a.id}`} className="sr-only">
                        New passcode for {a.name}
                      </label>
                      <input
                    id={`pc-${a.id}`}
                    type="text"
                    value={resetValue}
                    onChange={(e) => setResetValue(e.target.value)}
                    placeholder={`New passcode (min ${MIN_PASSCODE_LENGTH} characters)`}
                    autoComplete="off"
                    className={`${input} flex-1 sm:w-auto`} />
                  
                      <button type="submit" disabled={busy} className="h-11 rounded-full bg-ink px-5 text-sm font-semibold text-white disabled:opacity-60">
                        Save passcode
                      </button>
                    </form>
                }
                </li>);

          })}
          </ul>
        }
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-extrabold uppercase tracking-tight">Add a staff member</h2>
        <form onSubmit={add} className="grid gap-4 rounded-3xl bg-surface p-6 ring-1 ring-line sm:grid-cols-2">
          <div>
            <label htmlFor="new-name" className="text-sm font-semibold">
              Name
            </label>
            <input id="new-name" value={name} onChange={(e) => setName(e.target.value)} className={`${input} mt-1.5`} required />
          </div>
          <div>
            <label htmlFor="new-email" className="text-sm font-semibold">
              Email (used to sign in)
            </label>
            <input
              id="new-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoCapitalize="none"
              spellCheck={false}
              className={`${input} mt-1.5`}
              required />
            
          </div>
          <div>
            <label htmlFor="new-role" className="text-sm font-semibold">
              Role
            </label>
            <select id="new-role" value={role} onChange={(e) => setNewRole(e.target.value as StaffRole)} className={`${input} mt-1.5`}>
              {(Object.keys(roleLabels) as StaffRole[]).map((r) =>
              <option key={r} value={r}>
                  {roleLabels[r]}
                </option>
              )}
            </select>
            <p className="mt-1.5 text-xs text-muted">{roleHints[role]}</p>
          </div>
          <div>
            <label htmlFor="new-passcode" className="text-sm font-semibold">
              Passcode
            </label>
            <input
              id="new-passcode"
              type="text"
              value={passcode}
              onChange={(e) => setNewPasscode(e.target.value)}
              autoComplete="off"
              placeholder={`Min ${MIN_PASSCODE_LENGTH} characters`}
              className={`${input} mt-1.5`}
              required />
            
          </div>
          <div className="sm:col-span-2">
            <button type="submit" disabled={busy} className="inline-flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-brand-ink disabled:opacity-60">
              {busy ? <Loader2Icon size={18} className="animate-spin" /> : <PlusIcon size={18} />} Add account
            </button>
          </div>
        </form>
      </section>
    </div>);

}
