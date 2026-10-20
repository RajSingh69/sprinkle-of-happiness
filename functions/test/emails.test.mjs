// Welcome email queueing and unsubscribe links (Firestore emulator).
import { test, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { createEmails, unsubscribeToken, verifyUnsubscribeToken } from "../src/emails.js";

const SECRET = "unit-test-unsubscribe-secret";
let db;
let emails;
before(() => {
  if (!getApps().length) initializeApp({ projectId: "demo-sprinkle" });
  db = getFirestore();
  emails = createEmails({ db, FieldValue, siteUrl: "https://areyouasurvivor.com", functionsBaseUrl: "https://fn.example", unsubscribeSecret: SECRET, log: { info() {} } });
});
beforeEach(async () => {
  for (const c of ["mail", "consents", "deletedAccounts"]) {
    const snap = await db.collection(c).get();
    await Promise.all(snap.docs.map((d) => d.ref.delete()));
  }
});

test("welcome email is queued once per member, never duplicated", async () => {
  const profile = { displayName: "Amy <b>", email: "amy@example.com", membershipTier: "free" };
  assert.deepEqual(await emails.queueWelcomeEmail("u1", profile), { queued: true });
  assert.equal((await emails.queueWelcomeEmail("u1", profile)).reason, "duplicate");
  const mail = (await db.collection("mail").get()).docs;
  assert.equal(mail.length, 1);
  assert.equal(mail[0].data().to, "amy@example.com");
  assert.ok(mail[0].data().message.html.includes("Amy &lt;b&gt;"), "names are HTML-escaped");
  assert.ok(mail[0].data().message.text.includes("999"));
});

test("no welcome email for deleted accounts or missing email", async () => {
  await db.doc("deletedAccounts/u2").set({ deletedAt: new Date() });
  assert.equal((await emails.queueWelcomeEmail("u2", { email: "x@example.com" })).queued, false);
  assert.equal((await emails.queueWelcomeEmail("u3", {})).queued, false);
  assert.equal((await db.collection("mail").get()).size, 0);
});

test("unsubscribe links are signed per member and withdraw marketing consent", async () => {
  await db.doc("consents/u1").set({ marketing: true });
  const url = new URL(emails.unsubscribeUrl("u1"));
  const ok = await emails.handleUnsubscribe({ uid: url.searchParams.get("uid"), token: url.searchParams.get("token") });
  assert.equal(ok.status, 200);
  assert.equal((await db.doc("consents/u1").get()).data().marketing, false);
  assert.equal(verifyUnsubscribeToken("u2", unsubscribeToken("u1", SECRET), SECRET), false, "a token only works for its own member");
  for (const token of [undefined, "", "abc", unsubscribeToken("u1", "wrong-secret")]) {
    assert.equal((await emails.handleUnsubscribe({ uid: "u1", token })).status, 400);
  }
  await db.doc("consents/u9").set({ marketing: true });
  assert.equal((await emails.handleUnsubscribe({ uid: "u9", token: "f".repeat(64) })).status, 400);
  assert.equal((await db.doc("consents/u9").get()).data().marketing, true);
});
