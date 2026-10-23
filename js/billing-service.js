// Paid membership actions. All Stripe work happens in Cloud Functions; the
// browser only asks for a Checkout or Customer Portal link and follows it.
import {
  getFunctions,
  httpsCallable,
  connectFunctionsEmulator
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-functions.js";
import { app } from "./firebase-init.js";
import { useEmulators } from "./site-config.js";

const functions = getFunctions(app, "europe-west2");
if (useEmulators) connectFunctionsEmulator(functions, "127.0.0.1", 5001);

export const PAID_TIERS = ["spark", "glow", "radiance"];
const STRIPE_HOSTS = ["checkout.stripe.com", "billing.stripe.com"];

// Only ever redirect to Stripe's own hosted pages.
function goToStripe(url) {
  const target = new URL(url);
  if (target.protocol !== "https:" || !STRIPE_HOSTS.includes(target.hostname)) {
    throw Object.assign(new Error("Unexpected payment link."), { code: "internal" });
  }
  location.assign(target.href);
}

export async function startCheckout(tier) {
  if (!PAID_TIERS.includes(tier)) throw Object.assign(new Error("Unknown tier"), { code: "invalid-argument" });
  const { data } = await httpsCallable(functions, "createCheckoutSession")({ tier });
  goToStripe(data.url);
}

export async function openBillingPortal() {
  const { data } = await httpsCallable(functions, "createPortalSession")();
  goToStripe(data.url);
}

// Callable errors arrive as "functions/<code>" with the server's safe message.
export function friendlyBillingError(error) {
  const code = String(error?.code ?? "").replace("functions/", "");
  if (["unauthenticated", "failed-precondition", "invalid-argument", "permission-denied"].includes(code) && error.message) {
    // The SDK can append the HTTP status, e.g. "… [400]"; members don't need it.
    return error.message.replace(/\s*\[\d{3}\]$/, "");
  }
  return "We could not reach the payment service. Please try again in a moment.";
}

// Donations: anyone can donate (no account needed). The server checks the
// amount against its own allowlist and limits before creating a Checkout.
export const DONATION_AMOUNTS = { once: [5, 10, 25, 50], monthly: [5, 10, 25] };

export async function startDonation(frequency, amountPounds) {
  const { data } = await httpsCallable(functions, "createDonationSession")({ frequency, amount: amountPounds });
  goToStripe(data.url);
}
