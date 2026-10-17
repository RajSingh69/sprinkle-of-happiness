// Billing logic tests: Firestore emulator + a fake Stripe API. Webhook
// signatures are created and verified with the real Stripe library.
import { test, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import Stripe from "stripe";
import { createBilling } from "../src/billing.js";

const PRICES = { spark: "price_spark_test", glow: "price_glow_test", radiance: "price_radiance_test" };
const WEBHOOK_SECRET = "whsec_test_secret_for_unit_tests";
const realStripe = new Stripe("sk_test_dummy_key_not_used_for_network");

let db;
before(() => {
  initializeApp({ projectId: "demo-sprinkle" });
  db = getFirestore();
});

async function clearAll() {
  for (const c of ["users", "subscriptions", "billing", "stripeCustomers", "stripeEvents", "deletedAccounts"]) {
    const snap = await db.collection(c).get();
    await Promise.all(snap.docs.map((d) => d.ref.delete()));
  }
}
beforeEach(clearAll);

function fakeStripe() {
  const state = { customers: [], sessions: [], portal: [], subs: new Map(), cancelled: [], deletedCustomers: [], retrieves: 0 };
  return {
    state,
    webhooks: realStripe.webhooks,
    customers: {
      create: async (params) => { const c = { id: `cus_${state.customers.length + 1}`, ...params }; state.customers.push(c); return c; },
      del: async (id) => { state.deletedCustomers.push(id); return { id, deleted: true }; }
    },
    checkout: { sessions: { create: async (p) => { state.sessions.push(p); return { id: "cs_1", url: "https://checkout.stripe.test/cs_1" }; } } },
    billingPortal: { sessions: { create: async (p) => { state.portal.push(p); return { url: "https://billing.stripe.test/p_1" }; } } },
    subscriptions: {
      retrieve: async (id) => { state.retrieves++; const s = state.subs.get(id); if (!s) throw new Error("no sub"); return s; },
      list: async ({ customer }) => ({ data: [...state.subs.values()].filter((s) => s.customer === customer) }),
      cancel: async (id) => { state.cancelled.push(id); const s = state.subs.get(id); s.status = "canceled"; return s; }
    }
  };
}

class TestError extends Error { constructor(code, message) { super(message); this.code = code; } }

function setup() {
  const stripe = fakeStripe();
  const billing = createBilling({
    stripe, db, FieldValue, Timestamp, prices: PRICES,
    siteUrl: "https://areyouasurvivor.com", allowedOrigins: ["https://areyouasurvivor.com", "http://localhost:8080"],
    webhookSecret: WEBHOOK_SECRET, error: (code, msg) => new TestError(code, msg),
    log: { info() {}, warn() {}, error() {} }
  });
  return { stripe, billing };
}

const member = { uid: "u1", token: { email: "member@example.com", email_verified: true, name: "Member One" } };

function sub(id, { status = "active", price = PRICES.spark, customer = "cus_1", uid = "u1", cancelAtPeriodEnd = false } = {}) {
  return {
    id, customer, status, metadata: { firebaseUID: uid }, cancel_at_period_end: cancelAtPeriodEnd,
    cancel_at: null, canceled_at: status === "canceled" ? 1790000000 : null, ended_at: null,
    items: { data: [{ price: { id: price }, current_period_end: 1795000000 }] }
  };
}

function signed(event) {
  const payload = JSON.stringify(event);
  const header = realStripe.webhooks.generateTestHeaderString({ payload, secret: WEBHOOK_SECRET });
  return { rawBody: Buffer.from(payload), signature: header };
}

const evt = (id, type, object) => ({ id, type, created: 1790000000, data: { object } });

async function seedProfile(uid = "u1") {
  await db.doc(`users/${uid}`).set({ displayName: "Member One", email: "member@example.com", membershipTier: "free", createdAt: new Date(), updatedAt: new Date() });
}

// ---------- Checkout ----------
test("checkout: unauthenticated requests are refused", async () => {
  const { billing } = setup();
  await assert.rejects(billing.createCheckoutSession({ auth: null, data: { tier: "spark" } }), { code: "unauthenticated" });
});

test("checkout: unverified emails are refused", async () => {
  const { billing } = setup();
  await assert.rejects(billing.createCheckoutSession({ auth: { uid: "u1", token: { email_verified: false } }, data: { tier: "spark" } }), { code: "failed-precondition" });
});

test("checkout: unknown tiers and non-allowlisted price IDs are refused", async () => {
  const { billing, stripe } = setup();
  for (const data of [{ tier: "platinum" }, { tier: "__proto__" }, {}, { priceId: "price_evil" }, { tier: "spark", priceId: "price_evil" }]) {
    await assert.rejects(billing.createCheckoutSession({ auth: member, data }), { code: "invalid-argument" });
  }
  assert.equal(stripe.state.sessions.length, 0);
});

test("checkout: creates one customer and a subscription session using the allowlisted price", async () => {
  const { billing, stripe } = setup();
  const { url } = await billing.createCheckoutSession({ auth: member, data: { tier: "glow" }, origin: "https://evil.example" });
  assert.match(url, /checkout\.stripe\.test/);
  const s = stripe.state.sessions[0];
  assert.equal(s.mode, "subscription");
  assert.deepEqual(s.line_items, [{ price: PRICES.glow, quantity: 1 }]);
  assert.equal(s.client_reference_id, "u1");
  assert.equal(s.subscription_data.metadata.firebaseUID, "u1");
  assert.ok(s.success_url.startsWith("https://areyouasurvivor.com/"), "untrusted origins fall back to the site URL");
  assert.equal((await db.doc("billing/u1").get()).data().stripeCustomerId, "cus_1");
  assert.equal((await db.doc("stripeCustomers/cus_1").get()).data().uid, "u1");
  assert.equal((await db.doc("users/u1").get()).data().membershipTier, "free", "profile created as free until payment completes");
  await billing.createCheckoutSession({ auth: member, data: { tier: "spark" }, origin: "http://localhost:8080" });
  assert.equal(stripe.state.customers.length, 1, "customer is reused");
  assert.ok(stripe.state.sessions[1].success_url.startsWith("http://localhost:8080/"));
});

test("checkout: members with a live subscription are sent to the portal instead", async () => {
  const { billing } = setup();
  await db.doc("subscriptions/u1").set({ status: "active" });
  await assert.rejects(billing.createCheckoutSession({ auth: member, data: { tier: "radiance" } }), { code: "failed-precondition" });
});

test("checkout: deleted (tombstoned) accounts cannot start checkout", async () => {
  const { billing } = setup();
  await db.doc("deletedAccounts/u1").set({ deletedAt: new Date() });
  await assert.rejects(billing.createCheckoutSession({ auth: member, data: { tier: "spark" } }), { code: "permission-denied" });
});

// ---------- Portal ----------
test("portal: requires login, verification and an existing billing account", async () => {
  const { billing, stripe } = setup();
  await assert.rejects(billing.createPortalSession({ auth: null }), { code: "unauthenticated" });
  await assert.rejects(billing.createPortalSession({ auth: member }), { code: "failed-precondition" });
  await db.doc("billing/u1").set({ stripeCustomerId: "cus_1" });
  const { url } = await billing.createPortalSession({ auth: member, origin: "https://areyouasurvivor.com" });
  assert.match(url, /billing\.stripe\.test/);
  assert.equal(stripe.state.portal[0].customer, "cus_1");
});

// ---------- Webhooks ----------
test("webhook: invalid or missing signatures are rejected and change nothing", async () => {
  const { billing, stripe } = setup();
  const good = signed(evt("evt_1", "customer.subscription.updated", { id: "sub_1" }));
  assert.equal((await billing.handleWebhook({ rawBody: good.rawBody, signature: "t=1,v1=bad" })).status, 400);
  assert.equal((await billing.handleWebhook({ rawBody: good.rawBody, signature: undefined })).status, 400);
  const tampered = Buffer.from(good.rawBody.toString().replace("sub_1", "sub_2"));
  assert.equal((await billing.handleWebhook({ rawBody: tampered, signature: good.signature })).status, 400);
  assert.equal(stripe.state.retrieves, 0);
  assert.equal((await db.collection("stripeEvents").get()).size, 0);
});

test("lifecycle: successful checkout upgrades the member; duplicate delivery is ignored", async () => {
  const { billing, stripe } = setup();
  await seedProfile();
  await db.doc("stripeCustomers/cus_1").set({ uid: "u1" });
  stripe.state.subs.set("sub_1", sub("sub_1"));
  const event = signed(evt("evt_checkout", "checkout.session.completed", { mode: "subscription", subscription: "sub_1", customer: "cus_1", client_reference_id: "u1" }));
  assert.equal((await billing.handleWebhook(event)).status, 200);
  assert.equal((await db.doc("users/u1").get()).data().membershipTier, "spark");
  const s = (await db.doc("subscriptions/u1").get()).data();
  assert.equal(s.status, "active");
  assert.equal(s.entitled, true);
  assert.equal(s.currentPeriodEnd.seconds, 1795000000);
  const retrievesBefore = stripe.state.retrieves;
  const again = await billing.handleWebhook(event);
  assert.equal(again.duplicate, true);
  assert.equal(stripe.state.retrieves, retrievesBefore, "duplicate is not processed again");
});

test("lifecycle: upgrade, failed payment grace, unpaid, cancel at period end, and cancellation", async () => {
  const { billing, stripe } = setup();
  await seedProfile();
  await db.doc("stripeCustomers/cus_1").set({ uid: "u1" });
  const tier = async () => (await db.doc("users/u1").get()).data().membershipTier;
  const send = (id, type, object) => billing.handleWebhook(signed(evt(id, type, object)));

  stripe.state.subs.set("sub_1", sub("sub_1", { price: PRICES.glow }));
  await send("e1", "customer.subscription.updated", { id: "sub_1" });
  assert.equal(await tier(), "glow", "upgrade to Glow");

  stripe.state.subs.set("sub_1", sub("sub_1", { price: PRICES.glow, status: "past_due" }));
  await send("e2", "invoice.payment_failed", { id: "in_1", subscription: "sub_1" });
  assert.equal(await tier(), "glow", "short grace period while Stripe retries");

  stripe.state.subs.set("sub_1", sub("sub_1", { price: PRICES.glow, status: "unpaid" }));
  await send("e3", "customer.subscription.updated", { id: "sub_1" });
  assert.equal(await tier(), "free", "unpaid removes benefits");

  stripe.state.subs.set("sub_1", sub("sub_1", { price: PRICES.radiance, cancelAtPeriodEnd: true }));
  await send("e4", "invoice.paid", { id: "in_2", parent: { subscription_details: { subscription: "sub_1" } } });
  assert.equal(await tier(), "radiance", "renewal paid; benefits until period end");
  assert.equal((await db.doc("subscriptions/u1").get()).data().cancelAtPeriodEnd, true);

  stripe.state.subs.set("sub_1", sub("sub_1", { price: PRICES.radiance, status: "canceled" }));
  await send("e5", "customer.subscription.deleted", { id: "sub_1" });
  assert.equal(await tier(), "free", "cancelled subscription is downgraded to free");
  assert.equal((await db.doc("subscriptions/u1").get()).data().entitled, false);
});

test("lifecycle: an unknown price never grants paid benefits", async () => {
  const { billing, stripe } = setup();
  await seedProfile();
  await db.doc("stripeCustomers/cus_1").set({ uid: "u1" });
  stripe.state.subs.set("sub_x", sub("sub_x", { price: "price_not_ours" }));
  await billing.handleWebhook(signed(evt("e_x", "customer.subscription.created", { id: "sub_x" })));
  assert.equal((await db.doc("users/u1").get()).data().membershipTier, "free");
});

test("lifecycle: metadata cannot attach a subscription to a different member", async () => {
  const { billing, stripe } = setup();
  await seedProfile("u1");
  await seedProfile("u2");
  await db.doc("stripeCustomers/cus_1").set({ uid: "u1" });
  stripe.state.subs.set("sub_bad", sub("sub_bad", { uid: "u2" }));
  await billing.handleWebhook(signed(evt("e_bad", "customer.subscription.created", { id: "sub_bad" })));
  assert.equal((await db.doc("users/u2").get()).data().membershipTier, "free");
  assert.equal((await db.doc("users/u1").get()).data().membershipTier, "free");
});

test("lifecycle: refunds are recorded without changing membership", async () => {
  const { billing } = setup();
  const r = await billing.handleWebhook(signed(evt("e_ref", "charge.refunded", { id: "ch_1" })));
  assert.equal(r.status, 200);
});

// ---------- Account deletion ----------
test("deleting a login cancels live subscriptions and removes billing data", async () => {
  const { billing, stripe } = setup();
  await seedProfile();
  await db.doc("billing/u1").set({ stripeCustomerId: "cus_1" });
  await db.doc("stripeCustomers/cus_1").set({ uid: "u1" });
  await db.doc("subscriptions/u1").set({ status: "active" });
  stripe.state.subs.set("sub_live", sub("sub_live"));
  stripe.state.subs.set("sub_old", sub("sub_old", { status: "canceled" }));
  const result = await billing.onAuthUserDeleted("u1");
  assert.deepEqual(result.cancelled, ["sub_live"]);
  assert.deepEqual(stripe.state.deletedCustomers, ["cus_1"]);
  for (const path of ["users/u1", "billing/u1", "subscriptions/u1", "stripeCustomers/cus_1"]) {
    assert.equal((await db.doc(path).get()).exists, false, `${path} removed`);
  }
  assert.equal((await db.doc("deletedAccounts/u1").get()).exists, true);
});
