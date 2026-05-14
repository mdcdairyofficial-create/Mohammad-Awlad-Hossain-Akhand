const { initializeApp } = require('firebase/app');
const { getAuth, signInWithCredential, GoogleAuthProvider } = require('firebase/auth');
const config = require('./firebase-applet-config.json');

const app = initializeApp(config);
const auth = getAuth(app);

async function test() {
  try {
    // We cannot easily test this without a real id_token from the client.
    console.log("SDK loaded");
  } catch(e) {
    console.error(e);
  }
}
test();
