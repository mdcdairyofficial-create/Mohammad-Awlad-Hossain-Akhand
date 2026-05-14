const admin = require('firebase-admin');
const config = require('./firebase-applet-config.json');
admin.initializeApp({ projectId: config.projectId });
const db = admin.firestore(); // default db
async function test() {
  try {
    const snap = await db.collection("users").limit(1).get();
    console.log("Success admin default DB", snap.size);
  } catch(e) {
    console.error("Admin default DB error:", e.message);
  }
}
test();
