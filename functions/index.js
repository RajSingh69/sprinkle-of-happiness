// Firebase Cloud Functions for Stripe memberships (region: London).
// Secrets are read from Firebase Secret Manager at runtime; never commit them.
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import { defineSecret, defineString } from "firebase-functions/params";
import * as functionsV1 from "firebase-functions/v1";
import { logger } from "firebase-functions";
import Stripe from "stripe";
import { createBilling } from "./src/billing.js";
import { createEmails } from "./src/emails.js";
import { onDocumentCreated } from "firebase-functions/v2/firestore";

initializeApp();
setGlobalOptions({ region: "europe-west2", maxInstances: 5 });

const STRIPE_SECRET_KEY = defineSecret("STRIPE_SECRET_KEY");
const STRIPE_WEBHOOK_SECRET = defineSecret("STRIPE_WEBHOOK_SECRET");
const UNSUBSCRIBE_SECRET = defineSecret("UNSUBSCRIBE_SECRET");

// Server-side price allowlist. Test-mode and live-mode prices have different
// IDs, so these can be overridden per environment in functions/.env.<project>.
const PRICE_SPARK = defineString("PRICE_SPARK", { default: "price_1URUTt0fxtNsls7c3R0o1iDc" });
const PRICE_GLOW = defineString("PRICE_GLOW", { default: "price_1URUXf0fxtNsls7cwIUZtOVt" });
const PRICE_RADIANCE = defineString("PRICE_RADIANCE", { default: "price_1URUYA0fxtNsls7calq2dq6E" });
const SITE_URL = defineString("SITE_URL", { default: "https://areyouasurvivor.com" });

const ALLOWED_ORIGINS = ["https://areyouasurvivor.com", "http://localhost:8080"];

function billing() {
  return createBilling({
    stripe: new Stripe(STRIPE_SECRET_KEY.value()),
    db: getFirestore(),
    FieldValue,
    Timestamp,
    prices: { spark: PRICE_SPARK.value(), glow: PRICE_GLOW.value(), radiance: PRICE_RADIANCE.value() },
    siteUrl: SITE_URL.value(),
    allowedOrigins: ALLOWED_ORIGINS,
    webhookSecret: STRIPE_WEBHOOK_SECRET.value(),
    error: (code, message) => new HttpsError(code, message),
    log: logger
  });
}

const callableOptions = { secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET], cors: ALLOWED_ORIGINS };

export const createCheckoutSession = onCall(callableOptions, (request) =>
  billing().createCheckoutSession({ auth: request.auth, data: request.data, origin: request.rawRequest?.headers?.origin })
);

export const createPortalSession = onCall(callableOptions, (request) =>
  billing().createPortalSession({ auth: request.auth, origin: request.rawRequest?.headers?.origin })
);

// Stripe calls this endpoint; the signature check is the authentication.
export const stripeWebhook = onRequest(
  { secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET], invoker: "public" },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method not allowed");
      return;
    }
    try {
      const result = await billing().handleWebhook({ rawBody: req.rawBody, signature: req.get("stripe-signature") });
      res.status(result.status).send(result.body);
    } catch (err) {
      // Non-2xx makes Stripe retry later; processing is idempotent.
      logger.error("Webhook processing failed", { message: err?.message });
      res.status(500).send("Processing error");
    }
  }
);

// When a login is deleted from anywhere, cancel subscriptions and remove billing data.
export const cleanUpDeletedUser = functionsV1
  .region("europe-west2")
  .runWith({ secrets: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"] })
  .auth.user()
  .onDelete((user) => billing().onAuthUserDeleted(user.uid));

// Donations: open to everyone (no login), amount validated on the server.
export const createDonationSession = onCall(callableOptions, (request) =>
  billing().createDonationSession({ data: request.data, origin: request.rawRequest?.headers?.origin })
);

function emails() {
  return createEmails({
    db: getFirestore(),
    FieldValue,
    siteUrl: SITE_URL.value(),
    functionsBaseUrl: "https://europe-west2-sprinkle-of-happiness.cloudfunctions.net",
    unsubscribeSecret: UNSUBSCRIBE_SECRET.value(),
    log: logger
  });
}

// Welcome email when a member profile is first created (after email
// verification). Queued once per member for the Trigger Email extension.
export const sendWelcomeEmail = onDocumentCreated(
  { document: "users/{uid}", secrets: [UNSUBSCRIBE_SECRET] },
  (event) => emails().queueWelcomeEmail(event.params.uid, event.data?.data())
);

// One-click unsubscribe from marketing emails (signed link).
export const unsubscribe = onRequest({ secrets: [UNSUBSCRIBE_SECRET], invoker: "public" }, async (req, res) => {
  const result = await emails().handleUnsubscribe({ uid: req.query.uid, token: req.query.token });
  res.status(result.status).type("html").send(result.body);
});
