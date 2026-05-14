const admin = require('firebase-admin');
const config = require('./firebase-applet-config.json');
admin.initializeApp({ projectId: config.projectId });

async function test() {
  try {
    const token = await admin.auth().createCustomToken("test-uid", { is_backend: true });
    console.log("Custom Token:", token);
  } catch (err) {
    console.error("Token error:", err);
  }
}
test();
