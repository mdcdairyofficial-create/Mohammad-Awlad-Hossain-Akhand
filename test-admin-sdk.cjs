const admin = require("firebase-admin");
const fs = require("fs");

async function testAdmin() {
  try {
    const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf8"));
    if (!admin.apps.length) {
      admin.initializeApp({
        projectId: config.projectId
      });
    }
    const db = admin.firestore();
    console.log("Attempting to write with Admin SDK...");
    await db.collection("system_test").doc("write").set({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      test: "admin_sdk_check"
    });
    console.log("Admin SDK Write SUCCESS!");
  } catch (err) {
    console.error("Admin SDK Write FAILED:", err);
  }
}

testAdmin();
