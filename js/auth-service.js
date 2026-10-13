// Authentication and profile operations used by the account pages.
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  getCountFromServer,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";
import { auth, db, authReady } from "./firebase-init.js";
import { cleanDisplayName } from "./auth-helpers.js";

const pageUrl = (name) => new URL(`../${name}`, import.meta.url).href;

export { auth };

export function watchAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function registerMember({ displayName, email, password }) {
  await authReady;
  const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
  await updateProfile(user, { displayName: cleanDisplayName(displayName) });
  await sendEmailVerification(user, { url: pageUrl("account.html") });
  return user;
}

export async function signInMember(email, password) {
  await authReady;
  const { user } = await signInWithEmailAndPassword(auth, email.trim(), password);
  return user;
}

export function signOutMember() {
  return signOut(auth);
}

// Always resolves the same way so the page never reveals whether an
// account exists for an email address.
export async function requestPasswordReset(email) {
  try {
    await sendPasswordResetEmail(auth, email.trim(), { url: pageUrl("login.html") });
  } catch (error) {
    if (!["auth/user-not-found", "auth/invalid-email"].includes(error?.code)) throw error;
  }
}

export function resendVerification(user) {
  return sendEmailVerification(user, { url: pageUrl("account.html") });
}

// Reload the user and force a fresh ID token so Firestore rules see the
// current email_verified status and custom claims.
export async function refreshUser(user) {
  await user.reload();
  await user.getIdToken(true);
  return auth.currentUser;
}

export async function isAdmin(user) {
  if (!user || !user.emailVerified) return false;
  const token = await user.getIdTokenResult(true);
  return token.claims.admin === true;
}

const profileRef = (uid) => doc(db, "users", uid);

// Creates the member profile on the first verified sign-in. Only the four
// approved fields are ever written from the browser.
export async function ensureProfile(user) {
  if (!user?.emailVerified) return null;
  const ref = profileRef(user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data();
  const fallback = (user.email || "Member").split("@")[0];
  await setDoc(ref, {
    displayName: cleanDisplayName(user.displayName || fallback).slice(0, 60) || "Member",
    email: user.email,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return (await getDoc(ref)).data();
}

export async function updateDisplayName(user, displayName) {
  const name = cleanDisplayName(displayName);
  await updateDoc(profileRef(user.uid), { displayName: name, updatedAt: serverTimestamp() });
  await updateProfile(user, { displayName: name });
  return name;
}

// Admin-only reads. Firestore rules reject these for anyone without a
// verified email and the `admin` custom claim.
export async function countMembers() {
  const snap = await getCountFromServer(collection(db, "users"));
  return snap.data().count;
}

export async function listMembers(max = 200) {
  const snap = await getDocs(query(collection(db, "users"), orderBy("createdAt", "desc"), limit(max)));
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
}
