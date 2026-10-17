// Paid membership buttons on membership.html. Only active once payments are
// switched on (see js/site-config.js). Login is required before checkout; the
// chosen tier is remembered so the member can continue after logging in.
import { paymentsEnabled } from "./site-config.js";

const PAID_TIERS = ["spark", "glow", "radiance"];
const NAMES = { spark: "Spark", glow: "Glow", radiance: "Radiance" };
const status = document.querySelector("#checkout-status");

function say(message, tone = "info") {
  if (!status) return;
  status.textContent = message;
  status.dataset.tone = tone;
}

function remember(tier) {
  try {
    sessionStorage.setItem("soh-selected-tier", tier);
  } catch {
    // Without storage, the tier still travels in the login URL.
  }
}

if (paymentsEnabled) {
  const params = new URLSearchParams(location.search);
  if (params.get("checkout") === "cancelled") say("Checkout was cancelled. You have not been charged.");

  const { watchAuth } = await import("./auth-service.js");
  const billing = await import("./billing-service.js");
  let currentUser = null;
  let authKnown = false;

  watchAuth((user) => {
    currentUser = user;
    authKnown = true;
    const tier = params.get("tier");
    if (user && PAID_TIERS.includes(tier)) {
      say(`You're logged in. Press "Join ${NAMES[tier]}" to continue to secure checkout.`);
      document.querySelector(`[data-checkout-tier="${tier}"]`)?.focus();
    }
  });

  document.querySelectorAll("[data-checkout-tier]").forEach((button) => {
    button.addEventListener("click", async () => {
      const tier = button.dataset.checkoutTier;
      if (!PAID_TIERS.includes(tier) || !authKnown) return;
      remember(tier);
      if (!currentUser) {
        location.assign(`login.html?next=membership&tier=${tier}`);
        return;
      }
      if (!currentUser.emailVerified) {
        say("Please verify your email address first. You'll find the link on your My Account page.", "error");
        return;
      }
      const label = button.textContent;
      button.disabled = true;
      button.textContent = "Opening secure checkout…";
      try {
        await billing.startCheckout(tier);
      } catch (error) {
        say(billing.friendlyBillingError(error), "error");
        button.disabled = false;
        button.textContent = label;
      }
    });
  });
}
