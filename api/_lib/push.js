import webpush from 'web-push';

let ready = false;
function setup() {
  if (ready) return;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:cap@example.com', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
  ready = true;
}

// Envoie une notif à tous les appareils de l'utilisateur ; supprime les abonnements morts
export async function sendToUser(sb, userId, msg) {
  setup();
  const { data: subs } = await sb.from('cap_push').select('endpoint,subscription').eq('user_id', userId);
  let sent = 0;
  for (const s of subs || []) {
    try {
      await webpush.sendNotification(s.subscription, JSON.stringify(msg), { TTL: 3600, urgency: 'high' });
      sent++;
    } catch (e) {
      if (e.statusCode === 404 || e.statusCode === 410) await sb.from('cap_push').delete().eq('endpoint', s.endpoint);
      else console.warn('push error', e.statusCode, e.body);
    }
  }
  return sent;
}
