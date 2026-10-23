import { createClient } from '@supabase/supabase-js';

const opts = { auth: { persistSession: false, autoRefreshToken: false } };
export const admin = () => createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, opts);

// Vérifie le jeton de l'utilisateur connecté et renvoie son id (ou null)
export async function userFromReq(req) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, opts);
  const { data, error } = await sb.auth.getUser(token);
  return error ? null : data?.user || null;
}
