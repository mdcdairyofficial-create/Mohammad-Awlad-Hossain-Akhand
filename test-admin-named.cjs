const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const config = require('./firebase-applet-config.json');
const app = admin.initializeApp({ projectId: config.projectId });
const db = getFirestore(app, config.firestoreDatabaseId);
async function test() {
  try {
    const snap = await db.collection("users").limit(1).get();
    console.log("Success admin named DB", snap.size);
  } catch(e) {
    console.error("Admin named DB error:", e.message);
  }
}
test();
