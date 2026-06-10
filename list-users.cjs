const fs = require("fs");
const { initializeApp: initializeClientApp } = require("firebase/app");
const { getFirestore: getClientFirestore, collection, getDocs } = require("firebase/firestore");

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf8"));
const clientApp = initializeClientApp(config);
const db = getClientFirestore(clientApp, config.firestoreDatabaseId);

async function listUsers() {
  try {
    console.log("Fetching registered users from Firestore...");
    const snapshot = await getDocs(collection(db, "users"));
    console.log(`Found ${snapshot.size} users:`);
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`Document ID: ${doc.id} | Name: ${data.name || data.fullName} | Mobile: ${data.mobile} | Email: ${data.email} | Firebase UID: ${data.firebase_uid}`);
    });
  } catch (e) {
    console.error("Failed to query users collection:", e.message);
  }
}

listUsers();
