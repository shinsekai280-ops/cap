// Config publique pour l'app (aucun secret ici)
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    supabaseUrl: process.env.SUPABASE_URL || null,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || null,
    vapidPublicKey: process.env.VAPID_PUBLIC_KEY || null,
  });
}
