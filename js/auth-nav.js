// Header account link, "Join free" button and the homepage membership
// invitation. Firebase only loads when accounts are enabled.
import { accountsEnabled, paymentsEnabled } from "./site-config.js";

// "Become a member — Free" calls to action only appear once accounts are on;
// until then the "registration opening soon" wording stays in their place.
if (accountsEnabled) {
  document.querySelectorAll("[data-accounts-only]").forEach((el) => { el.hidden = false; });
  document.querySelectorAll("[data-accounts-hide]").forEach((el) => { el.hidden = true; });
}

// Paid membership controls only appear once the Stripe backend is live.
// Applied after the accounts rules so payment state always wins.
if (paymentsEnabled) {
  document.querySelectorAll("[data-payments-only]").forEach((el) => { el.hidden = false; });
  document.querySelectorAll("[data-payments-hide]").forEach((el) => { el.hidden = true; });
}

const link = document.querySelector("[data-account-link]");
const joinButtons = document.querySelectorAll("[data-join-free]");
const INVITE_KEY = "soh-member-invite-dismissed";
let signedIn = false;
let authKnown = !accountsEnabled;

// Homepage: a gentle, dismissible invitation after the survivor gate. It is
// not a modal: it never blocks the page, the menu or the support links, and
// it shows at most once per browser session.
function inviteDismissed() {
  try {
    return sessionStorage.getItem(INVITE_KEY) === "1";
  } catch {
    return false;
  }
}

function showMembershipInvite() {
  if (!accountsEnabled || signedIn || inviteDismissed() || document.querySelector(".member-invite")) return;
  const card = document.createElement("aside");
  card.className = "member-invite";
  card.setAttribute("aria-labelledby", "member-invite-title");
  card.innerHTML = `
    <button class="member-invite-close" type="button" aria-label="Close membership invitation"><span aria-hidden="true">&times;</span></button>
    <p class="member-invite-eyebrow">Membership</p>
    <h2 id="member-invite-title">Become a member. It's free.</h2>
    <p>Join the Sprinkle of Happiness community and stay connected.</p>
    <div class="member-invite-actions">
      <a class="btn" href="register.html">Join free</a>
      <button class="btn btn-ghost" type="button" data-invite-later>Not now</button>
    </div>`;
  const dismiss = () => {
    card.remove();
    try {
      sessionStorage.setItem(INVITE_KEY, "1");
    } catch {
      // Without storage it may show again next visit.
    }
  };
  card.querySelector(".member-invite-close").addEventListener("click", dismiss);
  card.querySelector("[data-invite-later]").addEventListener("click", dismiss);
  card.querySelector('a[href="register.html"]').addEventListener("click", () => {
    try {
      sessionStorage.setItem(INVITE_KEY, "1");
    } catch {
      // Ignore.
    }
  });
  card.addEventListener("keydown", (event) => {
    if (event.key === "Escape") dismiss();
  });
  document.body.append(card);
  // Showing it once counts: it won't come back this session.
  try {
    sessionStorage.setItem(INVITE_KEY, "1");
  } catch {
    // Without storage it may show again next visit.
  }
}

const isHomepage = Boolean(document.querySelector("[data-site-intro]"));
if (isHomepage) {
  document.addEventListener("soh:gate-closed", () => {
    const tryShow = () => (authKnown ? showMembershipInvite() : setTimeout(tryShow, 300));
    setTimeout(tryShow, 1500);
  });
}

if (link && accountsEnabled) {
  link.hidden = false;
  try {
    const { watchAuth } = await import("./auth-service.js");
    watchAuth((user) => {
      signedIn = Boolean(user);
      authKnown = true;
      link.textContent = signedIn ? "My Account" : "Log in";
      link.href = new URL(signedIn ? "../account.html" : "../login.html", import.meta.url).href;
      // Members don't need the "Join free" button.
      joinButtons.forEach((button) => { button.hidden = signedIn; });
      if (signedIn) document.querySelector(".member-invite")?.remove();
    });
  } catch {
    link.hidden = true;
    authKnown = true;
  }
}
