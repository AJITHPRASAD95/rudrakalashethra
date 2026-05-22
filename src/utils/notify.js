let messaging = null;
try {
  if (process.env.FIREBASE_PROJECT_ID) {
    const admin = require('firebase-admin');
    if (!admin.apps.length) {
      admin.initializeApp({ credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      })});
    }
    messaging = admin.messaging();
  }
} catch(e) { console.warn('[notify] Firebase not configured'); }

const sendPush = async (tokens, payload) => {
  if (!messaging || !tokens || !tokens.length) return;
  const valid = tokens.filter(Boolean);
  if (!valid.length) return;
  try {
    const r = await messaging.sendEachForMulticast({
      tokens: valid,
      notification: { title: payload.title, body: payload.body },
      data: payload.data || {},
    });
    console.log("[notify] Push: " + r.successCount + " ok, " + r.failureCount + " failed");
  } catch(e) { console.error('[notify]', e.message); }
};

const sendWhatsApp = async (phone, message) => {
  if (!process.env.WHATSAPP_API_URL) return;
  try {
    await fetch(process.env.WHATSAPP_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + process.env.WHATSAPP_API_TOKEN },
      body: JSON.stringify({ phone, message }),
    });
  } catch(e) { console.error('[whatsapp]', e.message); }
};

module.exports = { sendPush, sendWhatsApp };
