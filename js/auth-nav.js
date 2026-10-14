// Header account link. Firebase is only loaded when accounts are enabled,
// so ordinary visitors on the public site download nothing extra.
import { accountsEnabled } from "./site-config.js";

const link = document.querySelector("[data-account-link]");

// "Become a member — Free" calls to action only appear once accounts are on;
// until then the "registration opening soon" wording stays in their place.
if (accountsEnabled) {
  document.querySelectorAll("[data-accounts-only]").forEach((el) => { el.hidden = false; });
  document.querySelectorAll("[data-accounts-hide]").forEach((el) => { el.hidden = true; });
}

if (link && accountsEnabled) {
  link.hidden = false;
  try {
    const { watchAuth } = await import("./auth-service.js");
    watchAuth((user) => {
      const signedIn = Boolean(user);
      link.textContent = signedIn ? "My Account" : "Log in";
      link.href = new URL(signedIn ? "../account.html" : "../login.html", import.meta.url).href;
    });
  } catch {
    link.hidden = true;
  }
}
