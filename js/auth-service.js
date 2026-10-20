// Authentication and profile operations used by the account pages.
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  writeBatch,
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
    updatedAt: serverTimestamp(),
    membershipTier: "free"
  });
  return (await getDoc(ref)).data();
}

export async function updateDisplayName(user, displayName) {
  const name = cleanDisplayName(displayName);
  await updateDoc(profileRef(user.uid), { displayName: name, updatedAt: serverTimestamp() });
  await updateProfile(user, { displayName: name });
  return name;
}

// Permanently deletes the signed-in member's account:
//   1. Administrators are refused (remove the admin claim first).
//   2. Re-check the password (Firebase requires a recent sign-in).
//   3. In one atomic batch, delete the Firestore profile and write a
//      tombstone, so this UID can never recreate a profile, even with an ID
//      token issued before deletion.
//   4. Delete the Firebase Authentication account.
// Returns which steps completed so the page can report honestly.
export async function deleteAccount(user, password) {
  if (await isAdmin(user)) return { blockedAdmin: true, profileDeleted: false, accountDeleted: false };
  // Never delete an account while a paid subscription could still charge it.
  // If the subscription can't be checked, stop: never risk deleting an account
  // that might still be paying.
  let subscription;
  try {
    subscription = await getSubscription(user.uid);
  } catch {
    return { checkFailed: true, profileDeleted: false, accountDeleted: false };
  }
  if (isLiveSubscription(subscription)) {
    return { blockedSubscription: true, profileDeleted: false, accountDeleted: false };
  }
  const credential = EmailAuthProvider.credential(user.email, password);
  await reauthenticateWithCredential(user, credential);
  try {
    const batch = writeBatch(db);
    batch.delete(profileRef(user.uid));
    batch.delete(doc(db, "consents", user.uid));
    batch.set(doc(db, "deletedAccounts", user.uid), { deletedAt: serverTimestamp() });
    await batch.commit();
  } catch (error) {
    return { profileDeleted: false, accountDeleted: false, error };
  }
  try {
    await deleteUser(user);
  } catch (error) {
    return { profileDeleted: true, accountDeleted: false, error };
  }
  return { profileDeleted: true, accountDeleted: true };
}

// ---------- Optional marketing consent ----------
// Kept separate from the account Terms. The exact wording and version shown
// are stored with a server timestamp so the choice can be evidenced.
export const CONSENT_VERSION = "marketing-v1-2026-10-20";
export const CONSENT_WORDING = "Optional: send me membership updates and community news by email. You can unsubscribe at any time.";
const PENDING_CONSENT_KEY = "soh-pending-consent";

// Registration happens before email verification, and only verified members
// can write to Firestore, so the choice waits on this device until then.
export function rememberConsentChoice(marketing) {
  try {
    localStorage.setItem(PENDING_CONSENT_KEY, JSON.stringify({ marketing: Boolean(marketing) }));
  } catch {
    // Without storage no consent is recorded, which is the safe default.
  }
}

export async function getConsent(uid) {
  const snap = await getDoc(doc(db, "consents", uid));
  return snap.exists() ? snap.data() : null;
}

export async function saveConsent(uid, marketing, source) {
  await setDoc(doc(db, "consents", uid), {
    marketing: Boolean(marketing),
    version: CONSENT_VERSION,
    wording: CONSENT_WORDING,
    source,
    updatedAt: serverTimestamp()
  });
}

export async function savePendingConsent(uid) {
  let pending = null;
  try {
    pending = JSON.parse(localStorage.getItem(PENDING_CONSENT_KEY) ?? "null");
  } catch {
    pending = null;
  }
  if (!pending) return;
  if (!(await getConsent(uid))) await saveConsent(uid, pending.marketing, "registration");
  try {
    localStorage.removeItem(PENDING_CONSENT_KEY);
  } catch {
    // Nothing else to do.
  }
}

export async function listConsents() {
  const snap = await getDocs(collection(db, "consents"));
  return new Map(snap.docs.map((d) => [d.id, d.data()]));
}

export async function listDonations() {
  const snap = await getDocs(collection(db, "donations"));
  return snap.docs.map((d) => d.data());
}

// Billing state written by the Stripe webhook (read-only for members).
const LIVE_SUBSCRIPTION = ["active", "trialing", "past_due", "unpaid", "incomplete", "paused"];

export async function getSubscription(uid) {
  const snap = await getDoc(doc(db, "subscriptions", uid));
  return snap.exists() ? snap.data() : null;
}

export function isLiveSubscription(sub) {
  return Boolean(sub && LIVE_SUBSCRIPTION.includes(sub.status));
}

export async function listSubscriptions() {
  const snap = await getDocs(collection(db, "subscriptions"));
  return new Map(snap.docs.map((d) => [d.id, d.data()]));
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
