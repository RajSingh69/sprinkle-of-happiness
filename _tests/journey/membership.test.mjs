// Free-membership journey against the Auth and Firestore emulators, using the
// same SDK calls as js/auth-service.js and the real firestore.rules:
// register -> verification email -> verify -> sign in -> profile -> consent
// -> update -> sign out/in -> privacy between members -> delete.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { initializeApp, deleteApp } from "firebase/app";
import {
  getAuth, connectAuthEmulator, createUserWithEmailAndPassword, sendEmailVerification,
  signInWithEmailAndPassword, signOut, updateProfile, deleteUser, EmailAuthProvider, reauthenticateWithCredential
} from "firebase/auth";
import {
  getFirestore, connectFirestoreEmulator, doc, getDoc, setDoc, updateDoc, writeBatch, serverTimestamp
} from "firebase/firestore";

const PROJECT = "demo-sprinkle";
const AUTH_HOST = "127.0.0.1:9099";
const config = { apiKey: "demo-key", projectId: PROJECT, authDomain: `${PROJECT}.firebaseapp.com` };
const apps = [];

function client(name) {
  const app = initializeApp(config, name);
  apps.push(app);
  const auth = getAuth(app);
  connectAuthEmulator(auth, `http://${AUTH_HOST}`, { disableWarnings: true });
  const db = getFirestore(app);
  connectFirestoreEmulator(db, "127.0.0.1", 8085);
  return { auth, db };
}

async function verifyEmailFor(email) {
  const res = await fetch(`http://${AUTH_HOST}/emulator/v1/projects/${PROJECT}/oobCodes`);
  const { oobCodes } = await res.json();
  const code = oobCodes.filter((c) => c.email === email && c.requestType === "VERIFY_EMAIL").pop();
  assert.ok(code, `a verification email was sent to ${email}`);
  const link = await fetch(code.oobLink, { redirect: "manual" });
  assert.ok(link.status < 400, "the verification link works");
}

// Mirrors ensureProfile() in js/auth-service.js.
const createProfile = (db, user, name) => setDoc(doc(db, "users", user.uid), {
  displayName: name, email: user.email, createdAt: serverTimestamp(), updatedAt: serverTimestamp(), membershipTier: "free"
});
// Mirrors saveConsent().
const saveConsent = (db, uid, marketing, source) => setDoc(doc(db, "consents", uid), {
  marketing, version: "marketing-v1-2026-10-20", wording: "Optional: send me membership updates.", source, updatedAt: serverTimestamp()
});

const amy = { email: `amy-${Date.now()}@example.test`, password: "correct horse 1" };
const ben = { email: `ben-${Date.now()}@example.test`, password: "battery staple 2" };
let A;
let B;

before(async () => {
  await fetch(`http://${AUTH_HOST}/emulator/v1/projects/${PROJECT}/accounts`, { method: "DELETE" });
  A = client("amy");
  B = client("ben");
});
after(async () => { await Promise.all(apps.map((app) => deleteApp(app))); });

test("registration creates the login and sends a verification email", async () => {
  const { user } = await createUserWithEmailAndPassword(A.auth, amy.email, amy.password);
  await updateProfile(user, { displayName: "Amy" });
  await sendEmailVerification(user);
  assert.equal(user.emailVerified, false);
  await assert.rejects(createUserWithEmailAndPassword(B.auth, amy.email, "another password"), { code: "auth/email-already-in-use" });
});

test("an unverified member cannot create a profile or record consent", async () => {
  const user = A.auth.currentUser;
  await assert.rejects(createProfile(A.db, user, "Amy"), { code: "permission-denied" });
  await assert.rejects(saveConsent(A.db, user.uid, true, "registration"), { code: "permission-denied" });
});

test("after verifying, a fresh token lets the member create their free profile", async () => {
  await verifyEmailFor(amy.email);
  await A.auth.currentUser.reload();
  await A.auth.currentUser.getIdToken(true);
  assert.equal(A.auth.currentUser.emailVerified, true);
  await createProfile(A.db, A.auth.currentUser, "Amy");
  const profile = (await getDoc(doc(A.db, "users", A.auth.currentUser.uid))).data();
  assert.equal(profile.membershipTier, "free");
  assert.equal(profile.email, amy.email);
});

test("members cannot give themselves a paid tier or edit their email", async () => {
  const ref = doc(A.db, "users", A.auth.currentUser.uid);
  await assert.rejects(updateDoc(ref, { membershipTier: "radiance", updatedAt: serverTimestamp() }), { code: "permission-denied" });
  await assert.rejects(updateDoc(ref, { email: "x@example.test", updatedAt: serverTimestamp() }), { code: "permission-denied" });
  await assert.rejects(setDoc(doc(A.db, "subscriptions", A.auth.currentUser.uid), { status: "active", tier: "glow" }), { code: "permission-denied" });
});

test("marketing consent is optional, recorded with version and time, and can be withdrawn", async () => {
  const uid = A.auth.currentUser.uid;
  await saveConsent(A.db, uid, true, "registration");
  let consent = (await getDoc(doc(A.db, "consents", uid))).data();
  assert.equal(consent.marketing, true);
  assert.equal(consent.version, "marketing-v1-2026-10-20");
  assert.ok(consent.updatedAt?.toDate() instanceof Date);
  await saveConsent(A.db, uid, false, "account");
  consent = (await getDoc(doc(A.db, "consents", uid))).data();
  assert.equal(consent.marketing, false);
  assert.equal(consent.source, "account");
  await assert.rejects(setDoc(doc(A.db, "consents", uid), { marketing: true, version: "v", wording: "w", source: "admin", updatedAt: serverTimestamp() }), { code: "permission-denied" });
});

test("members can change their name, and data persists after signing out and back in", async () => {
  const uid = A.auth.currentUser.uid;
  await updateDoc(doc(A.db, "users", uid), { displayName: "Amy S", updatedAt: serverTimestamp() });
  await signOut(A.auth);
  await assert.rejects(getDoc(doc(A.db, "users", uid)), { code: "permission-denied" });
  await assert.rejects(signInWithEmailAndPassword(A.auth, amy.email, "wrong password"), (e) => /auth\/(wrong-password|invalid-credential|invalid-login-credentials)/.test(e.code));
  await signInWithEmailAndPassword(A.auth, amy.email, amy.password);
  assert.equal((await getDoc(doc(A.db, "users", uid))).data().displayName, "Amy S");
  assert.equal((await getDoc(doc(A.db, "consents", uid))).data().marketing, false);
});

test("one member can never read or change another member's data", async () => {
  const { user } = await createUserWithEmailAndPassword(B.auth, ben.email, ben.password);
  await sendEmailVerification(user);
  await verifyEmailFor(ben.email);
  await B.auth.currentUser.reload();
  await B.auth.currentUser.getIdToken(true);
  const amyUid = A.auth.currentUser.uid;
  await assert.rejects(getDoc(doc(B.db, "users", amyUid)), { code: "permission-denied" });
  await assert.rejects(getDoc(doc(B.db, "consents", amyUid)), { code: "permission-denied" });
  await assert.rejects(updateDoc(doc(B.db, "users", amyUid), { displayName: "Hacked", updatedAt: serverTimestamp() }), { code: "permission-denied" });
  await assert.rejects(saveConsent(B.db, amyUid, true, "account"), { code: "permission-denied" });
});

test("deleting an account removes the profile and consent, and the login", async () => {
  const user = A.auth.currentUser;
  const uid = user.uid;
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(amy.email, amy.password));
  const batch = writeBatch(A.db);
  batch.delete(doc(A.db, "users", uid));
  batch.delete(doc(A.db, "consents", uid));
  batch.set(doc(A.db, "deletedAccounts", uid), { deletedAt: serverTimestamp() });
  await batch.commit();
  await deleteUser(user);
  await assert.rejects(signInWithEmailAndPassword(A.auth, amy.email, amy.password));
});
