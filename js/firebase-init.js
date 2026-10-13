// Shared Firebase initialisation (modular SDK via the official CDN).
// The web config below is public by design; it is not a secret. Never put
// service-account keys, Stripe secrets or admin credentials in frontend code.
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";
import {
  getAuth,
  connectAuthEmulator,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";
import {
  getFirestore,
  connectFirestoreEmulator
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";
import { useEmulators } from "./site-config.js";

const firebaseConfig = {
  apiKey: "AIzaSyDGTwAzdcZJRUhXv1EkHKiiFXFKCLJ-Iq0",
  authDomain: "sprinkle-of-happiness.firebaseapp.com",
  projectId: "sprinkle-of-happiness",
  storageBucket: "sprinkle-of-happiness.firebasestorage.app",
  messagingSenderId: "373455306084",
  appId: "1:373455306084:web:bca6b3387caccfd0bc8e71",
  measurementId: "G-TPMSBPH1VT"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

if (useEmulators) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8085);
}

// Keep members signed in across visits on this device.
export const authReady = setPersistence(auth, browserLocalPersistence);
