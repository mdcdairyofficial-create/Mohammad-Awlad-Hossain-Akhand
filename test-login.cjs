const { initializeApp } = require("firebase/app");
const { getFirestore, collection, query, where, getDocs } = require("firebase/firestore");
const fs = require("fs");

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf8"));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function testLogin() {
    try {
        const mobile = "+8801714899696";
        
        console.log("Searching for:", mobile);
        const q = query(collection(db, "users"), where("mobile", "==", mobile), where("password", "==", "123456")); // Trying a likely password if I had one? No I don't.
        // Let's just read the doc itself.
        const snap = await getDocs(query(collection(db, "users"), where("mobile", "==", mobile)));
        if (snap.size > 0) {
            console.log("User found. ID:", snap.docs[0].id);
            // Re-read by ID
            const docRef = require("firebase/firestore").doc(db, "users", snap.docs[0].id);
            const docSnap = await require("firebase/firestore").getDoc(docRef);
            console.log("User data by ID:", docSnap.data());
        }
    } catch (e) {
        console.error(e);
    }
}
testLogin();
