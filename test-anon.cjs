const { initializeApp } = require('firebase/app');
const { getAuth, signInAnonymously } = require('firebase/auth');
const config = require('./firebase-applet-config.json');

const app = initializeApp(config);
const auth = getAuth(app);

async function test() {
  try {
    const userCred = await signInAnonymously(auth);
    console.log("Anon UID:", userCred.user.uid);
  } catch(e) {
    console.error("Anon err:", e.message);
  }
}
test();
