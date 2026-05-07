const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");
const fs = require("fs");

const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf8"));
admin.initializeApp({ projectId: firebaseConfig.projectId });

async function run() {
  try {
    const firestore = getFirestore(admin.app(), firebaseConfig.firestoreDatabaseId);
    await firestore.collection('_system_test').doc('ping').set({ test: true });
    console.log("Success with getFirestore(app, dbId)");
  } catch (e) {
    console.error("Error with getFirestore(app, dbId):", e.message, e.code);
  }
}
run();
