import { test, before, after, beforeEach } from "node:test";
import { readFileSync } from "node:fs";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc, deleteDoc, getDocs, collection, serverTimestamp, writeBatch } from "firebase/firestore";

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
  membershipTier: "free",
  ...extra
});

async function seed(who) {
  await env.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "users", who.uid), {
      displayName: "Seeded", email: who.email, createdAt: new Date(), updatedAt: new Date(), membershipTier: "free"
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

// The account-deletion batch used by js/auth-service.js.
function deletionBatch(db, uid, tombstoneUid = uid) {
  const batch = writeBatch(db);
  batch.delete(doc(db, "users", uid));
  batch.set(doc(db, "deletedAccounts", tombstoneUid), { deletedAt: serverTimestamp() });
  return batch.commit();
}

test("account deletion: a member deletes their profile together with a tombstone", async () => {
  await seed(MEMBER);
  const db = ctx(MEMBER);
  await assertSucceeds(deletionBatch(db, MEMBER.uid));
  await env.withSecurityRulesDisabled(async (context) => {
    const admin = context.firestore();
    const profile = await getDoc(doc(admin, "users", MEMBER.uid));
    const tomb = await getDoc(doc(admin, "deletedAccounts", MEMBER.uid));
    if (profile.exists()) throw new Error("profile should be gone");
    if (!tomb.exists() || Object.keys(tomb.data()).join() !== "deletedAt") throw new Error("tombstone should hold only deletedAt");
  });
});

test("account deletion: deleting the profile without a tombstone, or a tombstone without deleting, is refused", async () => {
  await seed(MEMBER);
  const db = ctx(MEMBER);
  await assertFails(deleteDoc(doc(db, "users", MEMBER.uid)));
  await assertFails(setDoc(doc(db, "deletedAccounts", MEMBER.uid), { deletedAt: serverTimestamp() }));
  await assertSucceeds(getDoc(doc(db, "users", MEMBER.uid)));
});

test("deleted-account token reuse: a pre-deletion token cannot recreate, read or edit the profile", async () => {
  await seed(MEMBER);
  // Same verified token before and after deletion, as a modified client might keep.
  const staleToken = ctx(MEMBER);
  await assertSucceeds(deletionBatch(staleToken, MEMBER.uid));
  await assertFails(setDoc(doc(staleToken, "users", MEMBER.uid), profile(MEMBER)));
  await assertFails(getDoc(doc(staleToken, "users", MEMBER.uid)));
  await assertFails(updateDoc(doc(staleToken, "users", MEMBER.uid), { displayName: "Back", updatedAt: serverTimestamp() }));
  await assertFails(getDoc(doc(staleToken, "deletedAccounts", MEMBER.uid)));
  await assertFails(deleteDoc(doc(staleToken, "deletedAccounts", MEMBER.uid)));
  await assertFails(setDoc(doc(staleToken, "deletedAccounts", MEMBER.uid), { deletedAt: serverTimestamp() }));
});

test("deleted-account token reuse: a deleted member still cannot read other members' data", async () => {
  await seed(MEMBER);
  await seed(OTHER);
  const staleToken = ctx(MEMBER);
  await assertSucceeds(deletionBatch(staleToken, MEMBER.uid));
  await assertFails(getDoc(doc(staleToken, "users", OTHER.uid)));
  await assertFails(getDocs(collection(staleToken, "users")));
});

test("account deletion: members cannot delete someone else's profile or tombstone them", async () => {
  await seed(MEMBER);
  await seed(OTHER);
  const db = ctx(MEMBER);
  await assertFails(deletionBatch(db, OTHER.uid));
  await assertFails(setDoc(doc(db, "deletedAccounts", OTHER.uid), { deletedAt: serverTimestamp() }));
  await assertSucceeds(getDoc(doc(ctx(OTHER), "users", OTHER.uid)));
});

test("account deletion: unverified accounts cannot delete or tombstone", async () => {
  await seed(MEMBER);
  await assertFails(deletionBatch(ctx(MEMBER, { verified: false }), MEMBER.uid));
});

test("account deletion is atomic: a batch with any invalid part changes nothing", async () => {
  await seed(MEMBER);
  await seed(OTHER);
  const db = ctx(MEMBER);
  // Own profile + someone else's tombstone: the whole batch must fail.
  await assertFails(deletionBatch(db, MEMBER.uid, OTHER.uid));
  await assertSucceeds(getDoc(doc(db, "users", MEMBER.uid)));
  // Tombstone with extra data is refused, so the profile survives too.
  const batch = writeBatch(db);
  batch.delete(doc(db, "users", MEMBER.uid));
  batch.set(doc(db, "deletedAccounts", MEMBER.uid), { deletedAt: serverTimestamp(), email: MEMBER.email });
  await assertFails(batch.commit());
  await assertSucceeds(getDoc(doc(db, "users", MEMBER.uid)));
});

test("admin safeguard: administrators cannot delete their own profile from the browser", async () => {
  await seed(ADMIN);
  const db = ctx(ADMIN, { admin: true });
  await assertFails(deletionBatch(db, ADMIN.uid));
  await assertSucceeds(getDoc(doc(db, "users", ADMIN.uid)));
});

test("admin safeguard: admins cannot delete or tombstone other members", async () => {
  await seed(MEMBER);
  const db = ctx(ADMIN, { admin: true });
  await assertFails(deletionBatch(db, MEMBER.uid));
});

test("a new account with a new UID can still register after someone else deleted theirs", async () => {
  await seed(MEMBER);
  await assertSucceeds(deletionBatch(ctx(MEMBER), MEMBER.uid));
  await assertSucceeds(setDoc(doc(ctx(OTHER), "users", OTHER.uid), profile(OTHER)));
});

test("new profiles must start on the free tier and the tier cannot be changed", async () => {
  const db = ctx(MEMBER);
  const ref = doc(db, "users", MEMBER.uid);
  for (const tier of ["spark", "glow", "radiance", "admin", ""]) {
    await assertFails(setDoc(ref, profile(MEMBER, { membershipTier: tier })));
  }
  const { membershipTier, ...noTier } = profile(MEMBER);
  await assertFails(setDoc(ref, noTier));
  await assertSucceeds(setDoc(ref, profile(MEMBER)));
  await assertFails(updateDoc(ref, { membershipTier: "radiance", updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(ref, { subscriptionStatus: "active", updatedAt: serverTimestamp() }));
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
  for (const name of ["bookings", "payments", "memberships", "enquiries", "events", "billing", "stripeCustomers", "stripeEvents"]) {
    for (const db of [ctx(MEMBER), ctx(ADMIN, { admin: true })]) {
      await assertFails(getDoc(doc(db, name, "x")));
      await assertFails(setDoc(doc(db, name, "x"), { a: 1 }));
    }
  }
});

// ---------- Phase 15B: billing collections ----------
async function seedSubscription(who, status) {
  await env.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "subscriptions", who.uid), { status, tier: "spark", entitled: status === "active" });
  });
}

test("billing: members can read only their own subscription; admins can list", async () => {
  await seedSubscription(MEMBER, "active");
  await seedSubscription(OTHER, "active");
  await assertSucceeds(getDoc(doc(ctx(MEMBER), "subscriptions", MEMBER.uid)));
  await assertFails(getDoc(doc(ctx(MEMBER), "subscriptions", OTHER.uid)));
  await assertFails(getDoc(doc(ctx(MEMBER, { verified: false }), "subscriptions", MEMBER.uid)));
  await assertFails(getDocs(collection(ctx(MEMBER), "subscriptions")));
  await assertSucceeds(getDocs(collection(ctx(ADMIN, { admin: true }), "subscriptions")));
});

test("billing: nobody can write subscription, billing, customer or event records from the browser", async () => {
  await seedSubscription(MEMBER, "canceled");
  for (const db of [ctx(MEMBER), ctx(ADMIN, { admin: true })]) {
    await assertFails(setDoc(doc(db, "subscriptions", MEMBER.uid), { status: "active", tier: "radiance", entitled: true }));
    await assertFails(updateDoc(doc(db, "subscriptions", MEMBER.uid), { status: "active" }));
    await assertFails(deleteDoc(doc(db, "subscriptions", MEMBER.uid)));
    await assertFails(setDoc(doc(db, "billing", MEMBER.uid), { stripeCustomerId: "cus_evil" }));
    await assertFails(getDoc(doc(db, "billing", MEMBER.uid)));
    await assertFails(setDoc(doc(db, "stripeCustomers", "cus_1"), { uid: MEMBER.uid }));
    await assertFails(setDoc(doc(db, "stripeEvents", "evt_1"), { type: "x" }));
  }
});

test("billing: a member with a live subscription cannot delete their account from the browser", async () => {
  await seed(MEMBER);
  for (const status of ["active", "trialing", "past_due", "unpaid", "incomplete", "paused"]) {
    await seedSubscription(MEMBER, status);
    await assertFails(deletionBatch(ctx(MEMBER), MEMBER.uid));
  }
});

test("billing: once the subscription has ended, the member can delete their account", async () => {
  await seed(MEMBER);
  await seedSubscription(MEMBER, "canceled");
  await assertSucceeds(deletionBatch(ctx(MEMBER), MEMBER.uid));
});

// ---------- Marketing consent and donations ----------
const consent = (extra = {}) => ({ marketing: true, version: "marketing-v1-2026-10-20", wording: "Send me updates", source: "registration", updatedAt: serverTimestamp(), ...extra });

test("consent: members record and withdraw only their own choice", async () => {
  const db = ctx(MEMBER);
  await assertSucceeds(setDoc(doc(db, "consents", MEMBER.uid), consent()));
  await assertSucceeds(setDoc(doc(db, "consents", MEMBER.uid), consent({ marketing: false, source: "account" })));
  await assertSucceeds(getDoc(doc(db, "consents", MEMBER.uid)));
  await assertFails(setDoc(doc(db, "consents", OTHER.uid), consent()));
  await assertFails(getDoc(doc(db, "consents", OTHER.uid)));
  await assertFails(setDoc(doc(ctx(MEMBER, { verified: false }), "consents", MEMBER.uid), consent()));
});

test("consent: must be a real true/false choice with server time and no extra fields", async () => {
  const ref = doc(ctx(MEMBER), "consents", MEMBER.uid);
  await assertFails(setDoc(ref, consent({ marketing: "yes" })));
  await assertFails(setDoc(ref, consent({ updatedAt: new Date(2000, 0, 1) })));
  await assertFails(setDoc(ref, consent({ source: "admin" })));
  await assertFails(setDoc(ref, consent({ email: "x@example.com" })));
  await assertFails(setDoc(ref, { marketing: true }));
});

test("consent and donations: admins can read, nobody can write donations or mail", async () => {
  await assertSucceeds(setDoc(doc(ctx(MEMBER), "consents", MEMBER.uid), consent()));
  const admin = ctx(ADMIN, { admin: true });
  await assertSucceeds(getDocs(collection(admin, "consents")));
  await assertFails(getDocs(collection(ctx(MEMBER), "consents")));
  await assertSucceeds(getDocs(collection(admin, "donations")));
  await assertFails(getDocs(collection(ctx(MEMBER), "donations")));
  for (const db of [ctx(MEMBER), admin]) {
    await assertFails(setDoc(doc(db, "donations", "d1"), { amount: 1 }));
    await assertFails(setDoc(doc(db, "mail", "m1"), { to: "x@example.com" }));
    await assertFails(getDoc(doc(db, "mail", "welcome-x")));
  }
});

test("consent: deleting an account can remove the consent record", async () => {
  await seed(MEMBER);
  await assertSucceeds(setDoc(doc(ctx(MEMBER), "consents", MEMBER.uid), consent()));
  const db = ctx(MEMBER);
  const batch = writeBatch(db);
  batch.delete(doc(db, "users", MEMBER.uid));
  batch.delete(doc(db, "consents", MEMBER.uid));
  batch.set(doc(db, "deletedAccounts", MEMBER.uid), { deletedAt: serverTimestamp() });
  await assertSucceeds(batch.commit());
  await assertFails(setDoc(doc(db, "consents", MEMBER.uid), consent()));
});
