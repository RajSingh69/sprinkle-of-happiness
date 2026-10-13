import { test, before, after, beforeEach } from "node:test";
import { readFileSync } from "node:fs";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc, deleteDoc, getDocs, collection, serverTimestamp } from "firebase/firestore";

let env;

const MEMBER = { uid: "member1", email: "member@example.com" };
const OTHER = { uid: "member2", email: "other@example.com" };
const ADMIN = { uid: "admin1", email: "rajan@s3dsystems.com" };

const ctx = (who, { verified = true, admin = false } = {}) =>
  env.authenticatedContext(who.uid, { email: who.email, email_verified: verified, ...(admin ? { admin: true } : {}) }).firestore();

const profile = (who, extra = {}) => ({
  displayName: "Test Member",
  email: who.email,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  ...extra
});

async function seed(who) {
  await env.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "users", who.uid), {
      displayName: "Seeded", email: who.email, createdAt: new Date(), updatedAt: new Date()
    });
  });
}

before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-sprinkle",
    firestore: { rules: readFileSync(new URL("../../firestore.rules", import.meta.url), "utf8"), host: "127.0.0.1", port: 8085 }
  });
});

beforeEach(async () => env.clearFirestore());
after(async () => env.cleanup());

test("signed-out visitors cannot read or write profiles", async () => {
  await seed(MEMBER);
  const anon = env.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(anon, "users", MEMBER.uid)));
  await assertFails(setDoc(doc(anon, "users", "x"), profile(MEMBER)));
});

test("unverified users cannot create or read their profile", async () => {
  const db = ctx(MEMBER, { verified: false });
  await assertFails(setDoc(doc(db, "users", MEMBER.uid), profile(MEMBER)));
  await seed(MEMBER);
  await assertFails(getDoc(doc(db, "users", MEMBER.uid)));
});

test("verified members can create and read their own profile", async () => {
  const db = ctx(MEMBER);
  await assertSucceeds(setDoc(doc(db, "users", MEMBER.uid), profile(MEMBER)));
  await assertSucceeds(getDoc(doc(db, "users", MEMBER.uid)));
});

test("profiles cannot be created with protected or extra fields", async () => {
  const db = ctx(MEMBER);
  for (const field of ["role", "membershipTier", "subscriptionStatus", "stripeCustomerId", "admin"]) {
    await assertFails(setDoc(doc(db, "users", MEMBER.uid), profile(MEMBER, { [field]: "x" })));
  }
});

test("profiles must use the account's own email and server timestamps", async () => {
  const db = ctx(MEMBER);
  await assertFails(setDoc(doc(db, "users", MEMBER.uid), profile(MEMBER, { email: "someone@else.com" })));
  await assertFails(setDoc(doc(db, "users", MEMBER.uid), profile(MEMBER, { createdAt: new Date(2000, 0, 1) })));
  await assertFails(setDoc(doc(db, "users", MEMBER.uid), profile(MEMBER, { displayName: "" })));
  await assertFails(setDoc(doc(db, "users", MEMBER.uid), profile(MEMBER, { displayName: "A".repeat(61) })));
});

test("members cannot create, read or edit someone else's profile", async () => {
  await seed(OTHER);
  const db = ctx(MEMBER);
  await assertFails(getDoc(doc(db, "users", OTHER.uid)));
  await assertFails(setDoc(doc(db, "users", OTHER.uid), profile(OTHER)));
  await assertFails(updateDoc(doc(db, "users", OTHER.uid), { displayName: "Hacked", updatedAt: serverTimestamp() }));
});

test("members can update only their display name", async () => {
  await seed(MEMBER);
  const db = ctx(MEMBER);
  const ref = doc(db, "users", MEMBER.uid);
  await assertSucceeds(updateDoc(ref, { displayName: "New Name", updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(ref, { role: "admin", updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(ref, { membershipTier: "radiance", updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(ref, { email: "new@example.com", updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(ref, { createdAt: serverTimestamp(), updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(ref, { displayName: "No timestamp" }));
});

test("members cannot delete profiles", async () => {
  await seed(MEMBER);
  await assertFails(deleteDoc(doc(ctx(MEMBER), "users", MEMBER.uid)));
});

test("only verified admins (custom claim) can list members", async () => {
  await seed(MEMBER);
  await seed(OTHER);
  await assertFails(getDocs(collection(ctx(MEMBER), "users")));
  await assertFails(getDocs(collection(ctx(ADMIN, { admin: true, verified: false }), "users")));
  await assertSucceeds(getDocs(collection(ctx(ADMIN, { admin: true }), "users")));
  await assertSucceeds(getDoc(doc(ctx(ADMIN, { admin: true }), "users", MEMBER.uid)));
});

test("an approved admin email without the claim gets no admin access", async () => {
  await seed(MEMBER);
  await assertFails(getDocs(collection(ctx(ADMIN), "users")));
});

test("admins cannot write other members' profiles from the browser", async () => {
  await seed(MEMBER);
  const db = ctx(ADMIN, { admin: true });
  await assertFails(updateDoc(doc(db, "users", MEMBER.uid), { displayName: "Changed", updatedAt: serverTimestamp() }));
  await assertFails(deleteDoc(doc(db, "users", MEMBER.uid)));
});

test("all other collections are locked, including for admins", async () => {
  for (const name of ["bookings", "payments", "subscriptions", "memberships", "enquiries", "events"]) {
    for (const db of [ctx(MEMBER), ctx(ADMIN, { admin: true })]) {
      await assertFails(getDoc(doc(db, name, "x")));
      await assertFails(setDoc(doc(db, name, "x"), { a: 1 }));
    }
  }
});
