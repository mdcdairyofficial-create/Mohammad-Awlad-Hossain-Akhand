const admin = require('firebase-admin');
const config = require('./firebase-applet-config.json');
admin.initializeApp({ projectId: config.projectId });
async function test() {
  try {
    const user = await admin.auth().getUserByEmail("backend-server@example.com").catch(async e => {
      if (e.code === 'auth/user-not-found') {
         return await admin.auth().createUser({ email: "backend-server@example.com", password: "SuperSecretPassword123!" });
      }
      throw e;
    });
    console.log("Admin user:", user.uid);
  } catch(e) {
    console.error("Auth error:", e);
  }
}
test();
