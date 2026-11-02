import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { StaffAccount, StaffRole, StaffUser } from '../types/staff';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { validateEmail, validatePasscode } from '../utils/staffAuth';

/**
 * Staff authentication (Supabase Auth: email + password).
 *
 * Customers never sign in. Staff sign in at /staff/login; their role comes from
 * the `staff_profiles` table, and the database itself (Row Level Security)
 * refuses orders / admin data to anyone who isn't signed-in staff — hiding the
 * screens in the UI is only the convenience layer on top of that.
 */

export type LoginResult = {ok: true;user: StaffUser;} | {ok: false;error: string;};
export type ActionResult = {ok: true;} | {ok: false;error: string;};

interface StaffAuthValue {
  user: StaffUser | null;
  /** true while the saved session is being checked on first load */
  loading: boolean;
  /** all staff logins (admin only) — call loadAccounts() to fill */
  accounts: StaffAccount[];
  loadAccounts: () => Promise<ActionResult>;
  login: (email: string, passcode: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  addAccount: (input: {name: string;email: string;role: StaffRole;passcode: string;}) => Promise<ActionResult>;
  setPasscode: (id: string, passcode: string) => Promise<ActionResult>;
  setActive: (id: string, active: boolean) => Promise<ActionResult>;
  setRole: (id: string, role: StaffRole) => Promise<ActionResult>;
  removeAccount: (id: string) => Promise<ActionResult>;
}

interface ProfileRow {
  user_id: string;
  email: string;
  name: string;
  role: StaffRole;
  active: boolean;
}

const StaffAuthContext = createContext<StaffAuthValue | null>(null);

const accountFromRow = (r: ProfileRow): StaffAccount => ({ id: r.user_id, email: r.email, name: r.name, role: r.role, active: r.active });
const toUser = (a: StaffAccount): StaffUser => ({ id: a.id, name: a.name, email: a.email, role: a.role });

async function fetchProfile(userId: string): Promise<StaffAccount | null> {
  const { data, error } = await supabase.from('staff_profiles').select('*').eq('user_id', userId).maybeSingle();
  if (error || !data) return null;
  return accountFromRow(data as unknown as ProfileRow);
}

/** Calls the staff-admin Edge Function and turns failures into readable messages. */
async function invokeStaffAdmin(body: Record<string, unknown>): Promise<ActionResult> {
  const { data, error } = await supabase.functions.invoke('staff-admin', { body });
  if (error) {
    let message = error.message;
    const context = (error as {context?: Response;}).context;
    if (context && typeof context.json === 'function') {
      try {
        const payload = (await context.json()) as {error?: string;};
        if (payload?.error) message = payload.error;
      } catch {

        // keep the generic message
      }}
    return { ok: false, error: message };
  }
  const result = data as {error?: string;} | null;
  if (result?.error) return { ok: false, error: result.error };
  return { ok: true };
}

export function StaffAuthProvider({ children }: {children: React.ReactNode;}) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<StaffAccount | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [accounts, setAccounts] = useState<StaffAccount[]>([]);
  const userId = session?.user.id ?? null;

  // Track the Supabase session (it is saved in the browser and refreshed automatically)
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (!data.session) setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (!next) {
        setProfile(null);
        setLoading(false);
      }
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Whenever a user is signed in, look up their staff role
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setLoading(true);
    fetchProfile(userId).then((p) => {
      if (cancelled) return;
      if (!p || !p.active) {
        // Signed in to Supabase but not (or no longer) staff → sign out
        setProfile(null);
        supabase.auth.signOut();
      } else {
        setProfile(p);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const user = useMemo<StaffUser | null>(() => profile && session ? toUser(profile) : null, [profile, session]);

  const login = useCallback(async (email: string, passcode: string): Promise<LoginResult> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: passcode });
    if (error || !data.user) {
      const tooMany = error?.status === 429 || /rate|too many/i.test(error?.message ?? '');
      return { ok: false, error: tooMany ? 'Too many attempts. Please wait a minute and try again.' : 'Incorrect email or passcode.' };
    }
    const p = await fetchProfile(data.user.id);
    if (!p || !p.active) {
      await supabase.auth.signOut();
      return { ok: false, error: "This account doesn't have staff access." };
    }
    setProfile(p);
    return { ok: true, user: toUser(p) };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setAccounts([]);
  }, []);

  const loadAccounts = useCallback(async (): Promise<ActionResult> => {
    const { data, error } = await supabase.from('staff_profiles').select('*').order('created_at');
    if (error) return { ok: false, error: error.message };
    setAccounts(((data ?? []) as unknown as ProfileRow[]).map(accountFromRow));
    return { ok: true };
  }, []);

  const addAccount = useCallback(
    async (input: {name: string;email: string;role: StaffRole;passcode: string;}): Promise<ActionResult> => {
      if (!input.name.trim()) return { ok: false, error: 'Enter a name.' };
      const eErr = validateEmail(input.email);
      if (eErr) return { ok: false, error: eErr };
      const pErr = validatePasscode(input.passcode);
      if (pErr) return { ok: false, error: pErr };
      const res = await invokeStaffAdmin({
        action: 'create',
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        role: input.role,
        password: input.passcode
      });
      if (res.ok) await loadAccounts();
      return res;
    },
    [loadAccounts]
  );

  const setPasscode = useCallback(async (id: string, passcode: string): Promise<ActionResult> => {
    const pErr = validatePasscode(passcode);
    if (pErr) return { ok: false, error: pErr };
    return invokeStaffAdmin({ action: 'set_password', userId: id, password: passcode });
  }, []);

  const updateProfile = useCallback(
    async (id: string, patch: {role?: StaffRole;active?: boolean;}): Promise<ActionResult> => {
      const { data, error } = await supabase.from('staff_profiles').update(patch).eq('user_id', id).select('user_id');
      if (error) return { ok: false, error: error.message };
      if (!data || data.length === 0) return { ok: false, error: 'Nothing was changed. Are you signed in as an admin?' };
      await loadAccounts();
      return { ok: true };
    },
    [loadAccounts]
  );

  const setActive = useCallback((id: string, active: boolean) => updateProfile(id, { active }), [updateProfile]);
  const setRole = useCallback((id: string, role: StaffRole) => updateProfile(id, { role }), [updateProfile]);

  const removeAccount = useCallback(
    async (id: string): Promise<ActionResult> => {
      const res = await invokeStaffAdmin({ action: 'delete', userId: id });
      if (res.ok) await loadAccounts();
      return res;
    },
    [loadAccounts]
  );

  const value = useMemo<StaffAuthValue>(
    () => ({ user, loading, accounts, loadAccounts, login, logout, addAccount, setPasscode, setActive, setRole, removeAccount }),
    [user, loading, accounts, loadAccounts, login, logout, addAccount, setPasscode, setActive, setRole, removeAccount]
  );

  return <StaffAuthContext.Provider value={value}>{children}</StaffAuthContext.Provider>;
}

export function useStaffAuth(): StaffAuthValue {
  const ctx = useContext(StaffAuthContext);
  if (!ctx) throw new Error('useStaffAuth must be used within StaffAuthProvider');
  return ctx;
}
