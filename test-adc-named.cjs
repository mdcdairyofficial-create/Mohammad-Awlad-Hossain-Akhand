const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const config = require('./firebase-applet-config.json');

// Do not pass explicit projectId, let ADC handle it
admin.initializeApp();

const db = getFirestore(admin.app(), config.firestoreDatabaseId);

async function test() {
  try {
    const snap = await db.collection("users").limit(1).get();
    console.log("Success ADC named DB", snap.size);
  } catch(e) {
    console.error("ADC named DB error:", e.message);
  }
}
test();
