import { admin, userFromReq } from './_lib/supa.js';
import { sendToUser } from './_lib/push.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  const user = await userFromReq(req);
  if (!user) return res.status(401).json({ error: 'auth' });
  const sent = await sendToUser(admin(), user.id, { title: 'CAP', body: 'Les notifications marchent ✓', url: '/' });
  res.status(200).json({ sent });
}
