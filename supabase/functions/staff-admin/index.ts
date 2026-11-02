// Supabase Edge Function: staff-admin
//
// Lets a signed-in ADMIN create staff logins, reset passwords and delete staff.
// These actions need the service-role key, which must never reach the browser —
// that's why they live here instead of in the React app.
//
// Deploy:  supabase functions deploy staff-admin
// (SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are provided automatically.)

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const ROLES = ['admin', 'manager', 'kitchen'];
const MIN_PASSWORD = 8;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  const url = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // 1) Who is calling?
  const authHeader = req.headers.get('Authorization') ?? '';
  const caller = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: userData, error: userError } = await caller.auth.getUser();
  if (userError || !userData.user) return json({ error: 'Please sign in again.' }, 401);

  // 2) Are they an active admin?
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: me } = await admin
    .from('staff_profiles')
    .select('role, active')
    .eq('user_id', userData.user.id)
    .maybeSingle();
  if (!me || !me.active || me.role !== 'admin') return json({ error: 'Only admins can manage staff.' }, 403);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }

  const action = String(body.action ?? '');

  // ---- create a staff login -------------------------------------------------
  if (action === 'create') {
    const email = String(body.email ?? '').trim().toLowerCase();
    const name = String(body.name ?? '').trim();
    const role = String(body.role ?? '');
    const password = String(body.password ?? '');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Enter a valid email address.' }, 400);
    if (!name) return json({ error: 'Enter a name.' }, 400);
    if (!ROLES.includes(role)) return json({ error: 'Choose a valid role.' }, 400);
    if (password.length < MIN_PASSWORD) return json({ error: `Passcode must be at least ${MIN_PASSWORD} characters.` }, 400);

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });
    if (createError || !created.user) {
      const msg = createError?.message ?? 'Could not create the account.';
      return json({ error: /already|registered|exists/i.test(msg) ? 'That email already has an account.' : msg }, 400);
    }

    const { error: profileError } = await admin
      .from('staff_profiles')
      .insert({ user_id: created.user.id, email, name, role, active: true });
    if (profileError) {
      await admin.auth.admin.deleteUser(created.user.id); // roll back the login
      return json({ error: profileError.message }, 400);
    }
    return json({ ok: true });
  }

  // ---- reset a password -----------------------------------------------------
  if (action === 'set_password') {
    const userId = String(body.userId ?? '');
    const password = String(body.password ?? '');
    if (!userId) return json({ error: 'Missing user.' }, 400);
    if (password.length < MIN_PASSWORD) return json({ error: `Passcode must be at least ${MIN_PASSWORD} characters.` }, 400);
    const { error } = await admin.auth.admin.updateUserById(userId, { password });
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true });
  }

  // ---- delete a staff login -------------------------------------------------
  if (action === 'delete') {
    const userId = String(body.userId ?? '');
    if (!userId) return json({ error: 'Missing user.' }, 400);
    if (userId === userData.user.id) return json({ error: "You can't remove your own account." }, 400);
    // The profile row is removed by ON DELETE CASCADE; the database blocks removing the last admin.
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true });
  }

  return json({ error: 'Unknown action.' }, 400);
});
