// Stripe membership billing logic. Kept free of firebase-functions wiring so it
// can be tested with a fake Stripe client and the Firestore emulator.
//
// Firestore layout (all written only by trusted server code):
//   users/{uid}.membershipTier   "free" | "spark" | "glow" | "radiance"
//   subscriptions/{uid}          billing state, readable by the member and admins
//   billing/{uid}                { stripeCustomerId }       server-only
//   stripeCustomers/{customerId} { uid }                    server-only
//   stripeEvents/{eventId}       processed webhook markers  server-only

// Statuses that keep paid benefits. past_due is a short grace period while
// Stripe retries the payment; Stripe then moves the subscription to unpaid or
// canceled (per the Dashboard's retry settings), which removes the benefits.
export const ENTITLED_STATUSES = new Set(["active", "trialing", "past_due"]);

// Statuses that mean the customer could still be charged; an account must not
// be deleted while one of these is in place.
export const LIVE_STATUSES = new Set(["active", "trialing", "past_due", "unpaid", "incomplete", "paused"]);

export function createBilling({ stripe, db, FieldValue, Timestamp, prices, siteUrl, allowedOrigins = [], webhookSecret, error, log = console }) {
  const tierForPrice = (priceId) => Object.keys(prices).find((tier) => prices[tier] === priceId) ?? null;
  const toTimestamp = (seconds) => (seconds ? Timestamp.fromMillis(seconds * 1000) : null);
  const doc = (path) => db.doc(path);

  function requireVerified(auth) {
    if (!auth?.uid) throw error("unauthenticated", "Please log in first.");
    if (auth.token?.email_verified !== true) throw error("failed-precondition", "Please verify your email address first.");
    return auth.uid;
  }

  function returnBase(origin) {
    return allowedOrigins.includes(origin) ? origin : siteUrl;
  }

  async function ensureCustomer(uid, email) {
    const billingRef = doc(`billing/${uid}`);
    const existing = await billingRef.get();
    if (existing.exists && existing.data().stripeCustomerId) return existing.data().stripeCustomerId;
    const customer = await stripe.customers.create(
      { email, metadata: { firebaseUID: uid } },
      { idempotencyKey: `customer-${uid}` }
    );
    const batch = db.batch();
    batch.set(billingRef, { stripeCustomerId: customer.id, createdAt: FieldValue.serverTimestamp() }, { merge: true });
    batch.set(doc(`stripeCustomers/${customer.id}`), { uid });
    await batch.commit();
    return customer.id;
  }

  async function createCheckoutSession({ auth, data, origin }) {
    const uid = requireVerified(auth);
    const tier = data?.tier;
    const priceId = typeof tier === "string" && Object.hasOwn(prices, tier) ? prices[tier] : null;
    if (!priceId) throw error("invalid-argument", "Please choose a valid membership.");
    if (data?.priceId !== undefined && data.priceId !== priceId) throw error("invalid-argument", "Please choose a valid membership.");

    if ((await doc(`deletedAccounts/${uid}`).get()).exists) throw error("permission-denied", "This account has been deleted.");

    const current = await doc(`subscriptions/${uid}`).get();
    if (current.exists && LIVE_STATUSES.has(current.data().status)) {
      throw error("failed-precondition", "You already have a membership. Use Manage billing to change or cancel it.");
    }

    // Make sure a basic profile exists so the webhook has somewhere to record the tier.
    const userRef = doc(`users/${uid}`);
    if (!(await userRef.get()).exists) {
      const email = auth.token.email ?? "";
      await userRef.set({
        displayName: (auth.token.name || email.split("@")[0] || "Member").slice(0, 60),
        email,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        membershipTier: "free"
      });
    }

    const customer = await ensureCustomer(uid, auth.token.email);
    const base = returnBase(origin);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer,
      client_reference_id: uid,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: { metadata: { firebaseUID: uid, tier } },
      metadata: { firebaseUID: uid, tier },
      success_url: `${base}/account.html?checkout=success`,
      cancel_url: `${base}/membership.html?checkout=cancelled`
    });
    return { url: session.url };
  }

  async function createPortalSession({ auth, origin }) {
    const uid = requireVerified(auth);
    const billing = await doc(`billing/${uid}`).get();
    if (!billing.exists || !billing.data().stripeCustomerId) {
      throw error("failed-precondition", "There is no billing account to manage yet.");
    }
    const session = await stripe.billingPortal.sessions.create({
      customer: billing.data().stripeCustomerId,
      return_url: `${returnBase(origin)}/account.html`
    });
    return { url: session.url };
  }

  async function uidForCustomer(customerId, metadataUid) {
    const mapping = await doc(`stripeCustomers/${customerId}`).get();
    const mappedUid = mapping.exists ? mapping.data().uid : null;
    if (mappedUid && metadataUid && mappedUid !== metadataUid) {
      log.error("Stripe customer is linked to a different Firebase user; ignoring.", { customerId });
      return null;
    }
    return mappedUid ?? metadataUid ?? null;
  }

  // Always re-reads the subscription from Stripe, so the latest state wins no
  // matter what order webhooks arrive in, and replays are harmless.
  async function syncSubscription(subscriptionId) {
    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
    const uid = await uidForCustomer(customerId, sub.metadata?.firebaseUID);
    if (!uid) {
      log.warn("No Firebase user for subscription; ignoring.", { subscriptionId });
      return null;
    }
    const item = sub.items?.data?.[0];
    const priceId = item?.price?.id ?? null;
    const tier = tierForPrice(priceId);
    const entitled = Boolean(tier) && ENTITLED_STATUSES.has(sub.status);

    const subRef = doc(`subscriptions/${uid}`);
    const existing = await subRef.get();
    // A member should only ever have one subscription. If an older, ended
    // subscription sends an event, don't let it overwrite a live one.
    if (existing.exists && existing.data().stripeSubscriptionId !== sub.id
        && LIVE_STATUSES.has(existing.data().status) && !LIVE_STATUSES.has(sub.status)) {
      log.warn("Ignoring event for a superseded subscription.", { subscriptionId });
      return { uid, ignored: true };
    }

    await subRef.set({
      stripeSubscriptionId: sub.id,
      stripeCustomerId: customerId,
      status: sub.status,
      tier: tier ?? "unknown",
      priceId,
      entitled,
      currentPeriodEnd: toTimestamp(item?.current_period_end ?? sub.current_period_end),
      cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
      cancelAt: toTimestamp(sub.cancel_at),
      canceledAt: toTimestamp(sub.canceled_at),
      endedAt: toTimestamp(sub.ended_at),
      updatedAt: FieldValue.serverTimestamp()
    });

    const userRef = doc(`users/${uid}`);
    const tombstoned = (await doc(`deletedAccounts/${uid}`).get()).exists;
    if (!tombstoned && (await userRef.get()).exists) {
      await userRef.update({ membershipTier: entitled ? tier : "free", updatedAt: FieldValue.serverTimestamp() });
    }
    return { uid, tier: entitled ? tier : "free", status: sub.status };
  }

  const invoiceSubscription = (invoice) =>
    invoice.subscription ?? invoice.parent?.subscription_details?.subscription ?? null;

  async function handleWebhook({ rawBody, signature }) {
    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch {
      return { status: 400, body: "Invalid signature" };
    }

    const marker = doc(`stripeEvents/${event.id}`);
    if ((await marker.get()).exists) return { status: 200, body: "Duplicate event ignored", duplicate: true };

    const obj = event.data.object;
    switch (event.type) {
      case "checkout.session.completed": {
        if (obj.mode === "subscription" && obj.subscription) {
          const uid = obj.client_reference_id ?? obj.metadata?.firebaseUID;
          const customerId = typeof obj.customer === "string" ? obj.customer : obj.customer?.id;
          const mapping = await doc(`stripeCustomers/${customerId}`).get();
          if (uid && customerId && !mapping.exists) {
            await doc(`stripeCustomers/${customerId}`).set({ uid });
            await doc(`billing/${uid}`).set({ stripeCustomerId: customerId }, { merge: true });
          }
          await syncSubscription(typeof obj.subscription === "string" ? obj.subscription : obj.subscription.id);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
      case "customer.subscription.paused":
      case "customer.subscription.resumed":
        await syncSubscription(obj.id);
        break;
      case "invoice.paid":
      case "invoice.payment_succeeded":
      case "invoice.payment_failed": {
        const subscriptionId = invoiceSubscription(obj);
        if (subscriptionId) await syncSubscription(subscriptionId);
        break;
      }
      case "charge.refunded":
        // A refund does not by itself end a subscription in Stripe. Cancel the
        // subscription in Stripe (or the Customer Portal) to remove benefits;
        // that sends customer.subscription.deleted, handled above.
        log.info("Charge refunded; subscription state unchanged until Stripe updates it.", { charge: obj.id });
        break;
      default:
        break;
    }

    await marker.set({ type: event.type, created: event.created, processedAt: FieldValue.serverTimestamp() });
    return { status: 200, body: "ok" };
  }

  // Runs when a Firebase Auth account is deleted (from the site, the Console
  // or anywhere else): stop any charges and remove billing data.
  async function onAuthUserDeleted(uid) {
    const billing = await doc(`billing/${uid}`).get();
    const customerId = billing.exists ? billing.data().stripeCustomerId : null;
    const cancelled = [];
    if (customerId) {
      const subs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 100 });
      for (const sub of subs.data) {
        if (LIVE_STATUSES.has(sub.status)) {
          await stripe.subscriptions.cancel(sub.id);
          cancelled.push(sub.id);
        }
      }
      await stripe.customers.del(customerId);
    }
    const batch = db.batch();
    if (customerId) batch.delete(doc(`stripeCustomers/${customerId}`));
    batch.delete(doc(`billing/${uid}`));
    batch.delete(doc(`subscriptions/${uid}`));
    batch.delete(doc(`users/${uid}`));
    batch.set(doc(`deletedAccounts/${uid}`), { deletedAt: FieldValue.serverTimestamp() }, { merge: true });
    await batch.commit();
    return { cancelled, customerDeleted: Boolean(customerId) };
  }

  return { createCheckoutSession, createPortalSession, handleWebhook, syncSubscription, onAuthUserDeleted, tierForPrice };
}
