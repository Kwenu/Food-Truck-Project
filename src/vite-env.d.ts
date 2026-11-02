/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Your Supabase project URL, e.g. https://abcd1234.supabase.co */
  readonly VITE_SUPABASE_URL?: string;
  /** Your Supabase "anon" public key (never the service_role key!) */
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** Public address customers reach (used inside printed QR codes). Optional. */
  readonly VITE_CUSTOMER_URL?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
