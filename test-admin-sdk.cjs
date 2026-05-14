const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");
const fs = require("fs");

const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf8"));
admin.initializeApp({ projectId: firebaseConfig.projectId });

async function run() {
  try {
    console.log("Testing Auth...");
    const users = await admin.auth().listUsers(1);
    console.log("Auth Success! Found " + users.users.length + " users.");
  } catch (e) {
    console.error("Auth Failed:", e.message);
  }

  try {
    console.log("Testing Firestore with DB ID: " + firebaseConfig.firestoreDatabaseId);
    const firestore = getFirestore(admin.app(), firebaseConfig.firestoreDatabaseId);
    const snapshot = await firestore.collection('users').limit(1).get();
    console.log("Firestore success! Users found in list: " + snapshot.size);
  } catch (e) {
    console.error("Firestore Failed:", e.message, e.code);
  }
}
run();
