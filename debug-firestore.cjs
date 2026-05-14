const fs = require("fs");
const { initializeApp: initializeClientApp } = require("firebase/app");
const { getFirestore: getClientFirestore, collection, query, where, getDocs, limit } = require("firebase/firestore");

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf8"));

const clientApp = initializeClientApp(config);
const db = getClientFirestore(clientApp, config.firestoreDatabaseId);

async function test() {
  try {
    console.log("Testing CLIENT SDK with Firestore...");
    const q = query(collection(db, "users"), limit(1));
    const snapshot = await getDocs(q);
    console.log("SUCCESS! Found users via Client SDK:", snapshot.size);
    if (snapshot.size > 0) {
        console.log("First user data:", JSON.stringify(snapshot.docs[0].data(), null, 2));
    }
  } catch (e) {
    console.error("FAILED on Client SDK!");
    console.error("Message:", e.message);
  }
}

test();
