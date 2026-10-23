# CAP

App perso d'organisation : règle d'or (1 page de Coran), projets qui rapportent, thèmes pour évoluer (pratique + vidéo) selon une semaine type, rappels quotidiens. Sans IA.

- **Front** : PWA statique (`index.html`, `app.js`, `sw.js`) — à installer sur l'écran d'accueil de l'iPhone.
- **Données** : Supabase (`cap_state`, `cap_push`, `cap_sent`).
- **Serveur** : fonctions Vercel dans `api/` (notifications, planificateur).
- **Planificateur** : Supabase `pg_cron` appelle `/api/tick` toutes les 5 minutes.

## Variables d'environnement Vercel

| Nom | Valeur |
|---|---|
| `SUPABASE_URL` | URL du projet Supabase |
| `SUPABASE_ANON_KEY` | clé publique (anon / publishable) |
| `SUPABASE_SERVICE_ROLE_KEY` | clé secrète (service_role) |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | clés des notifications |
| `VAPID_SUBJECT` | `mailto:ton@email` |
| `CRON_SECRET` | secret partagé avec le planificateur |
