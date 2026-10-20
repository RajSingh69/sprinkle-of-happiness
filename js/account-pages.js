// Controllers for login.html, register.html, account.html and admin.html.
// Each page sets <body data-page="..."> and keeps its forms hidden until
// this script confirms accounts are enabled, so the safe default is "closed".
import { accountsEnabled, paymentsEnabled } from "./site-config.js";
import {
  validateDisplayName,
  validateEmail,
  validatePassword,
  friendlyAuthError
} from "./auth-helpers.js";

const page = document.body.dataset.page;
const url = (name) => new URL(`../${name}`, import.meta.url).href;
const $ = (sel, root = document) => root.querySelector(sel);

function toggle(selector, visible) {
  document.querySelectorAll(selector).forEach((el) => { el.hidden = !visible; });
}

function setStatus(el, message, tone = "info") {
  if (!el) return;
  el.textContent = message;
  el.dataset.tone = tone;
}

function markInvalid(input, message, status) {
  input.setAttribute("aria-invalid", "true");
  setStatus(status, message, "error");
  input.focus();
}

// Reset field errors and any previous message before each new submit.
function clearInvalid(form) {
  form.querySelectorAll("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));
  form.querySelectorAll(".form-status").forEach((el) => setStatus(el, ""));
}

async function busy(button, task) {
  const label = button.textContent;
  button.disabled = true;
  button.textContent = "Please wait…";
  try {
    return await task();
  } finally {
    button.disabled = false;
    button.textContent = label;
  }
}

const PAID_TIERS = ["spark", "glow", "radiance"];
const SELECTED_TIER_KEY = "soh-selected-tier";

// Only internal destinations are allowed after sign-in.
function nextPage() {
  const params = new URLSearchParams(location.search);
  const next = params.get("next");
  if (next === "admin") return url("admin.html");
  const tier = params.get("tier");
  if (next === "membership" && PAID_TIERS.includes(tier)) return `${url("membership.html")}?tier=${tier}#tiers`;
  return url("account.html");
}

// Missing or unknown tiers are shown as Free; paid tiers are only ever set
// by trusted server code.
function tierLabel(tier) {
  return { spark: "Spark", glow: "Glow", radiance: "Radiance" }[tier] ?? "Free";
}

function tierPrice(tier) {
  return { spark: "£27/month", glow: "£97/month", radiance: "£497/month" }[tier] ?? "£0";
}

function subscriptionLabel(status) {
  return {
    active: "Active",
    trialing: "Trial",
    past_due: "Payment overdue: please update your payment method in Manage billing",
    unpaid: "Unpaid: paid benefits are paused",
    incomplete: "Payment not completed",
    paused: "Paused",
    canceled: "Cancelled",
    incomplete_expired: "Checkout expired"
  }[status] ?? "—";
}

// Stores a valid ?tier= from the URL for later, and returns it.
function rememberTierFromUrl() {
  const tier = new URLSearchParams(location.search).get("tier");
  if (!PAID_TIERS.includes(tier)) return null;
  try {
    sessionStorage.setItem(SELECTED_TIER_KEY, tier);
  } catch {
    // Storage unavailable: the tier still travels in links.
  }
  return tier;
}

function readSelectedTier() {
  try {
    const tier = sessionStorage.getItem(SELECTED_TIER_KEY);
    return PAID_TIERS.includes(tier) ? tier : null;
  } catch {
    return null;
  }
}

// The same benefit wording as membership.html (keep the two in step).
const BENEFITS = {
  free: [
    "Free yoga and workshops, open to everyone",
    "Stay connected with the Sprinkle community",
    "Hear about community news and opportunities"
  ],
  spark: [
    "Private member community",
    "Monthly creative and reflective prompts",
    "One monthly group check-in call (60 minutes)",
    "Monthly accountability thread",
    "Early access to selected events",
    "Member-only mini-challenges",
    "Discounts on eligible paid programmes",
    "A monthly collective poem from Kaan",
    "The chance to contribute themes or lines to future poems"
  ],
  glow: [
    "Everything in Spark",
    "Weekly Glow Circle (60–75 minutes)",
    "Weekly goal setting and accountability",
    "A monthly rotating creative-feedback opportunity",
    "Monthly themed workshops for Glow and Radiance members",
    "One personalised short poem per quarter",
    "A guided reflection and movement audio library",
    "Priority booking for selected gatherings",
    "A monthly creative-business offer clinic",
    "Occasional guest expert sessions"
  ],
  radiance: [
    "Everything in Spark and Glow",
    "A weekly 30-minute 1:1 session with Kaan",
    "An initial 60–90-minute onboarding session",
    "A personalised 90-day creative roadmap",
    "One custom poem per month",
    "An optional recorded poem or voice reflection",
    "Priority access to eligible programmes",
    "The option to request bespoke workshops at member rates",
    "A defined channel or scheduled office hours for questions",
    "A quarterly 60–90-minute strategy intensive",
    "Support developing a signature creative offer",
    "Optional community leadership opportunities",
    "Optional supporter recognition, only with your consent"
  ]
};

function renderBenefits(tier) {
  const key = PAID_TIERS.includes(tier) ? tier : "free";
  $("[data-benefits-intro]").textContent = `Included with ${tierLabel(key)} membership:`;
  const list = $("[data-benefits]");
  list.replaceChildren(...BENEFITS[key].map((text) => Object.assign(document.createElement("li"), { textContent: text })));
}

async function renderConsent(svc, user) {
  const form = $("#consent-form");
  const status = $("#consent-status");
  let current = null;
  try {
    current = await svc.getConsent(user.uid);
  } catch {
    setStatus(status, "Your email preferences could not be loaded. Please try again later.", "error");
    return;
  }
  form.elements.marketing.checked = current?.marketing === true;
  if (current?.updatedAt) setStatus(status, `Last updated ${formatDate(current.updatedAt)}.`, "info");
  form.onsubmit = async (event) => {
    event.preventDefault();
    try {
      await busy(form.querySelector("button[type=submit]"), () => svc.saveConsent(user.uid, form.elements.marketing.checked, "account"));
      setStatus(status, form.elements.marketing.checked
        ? "Saved. You'll receive membership updates and community news. You can unsubscribe at any time."
        : "Saved. You won't receive membership updates or community news.", "success");
    } catch (error) {
      setStatus(status, friendlyAuthError(error), "error");
    }
  };
}

// Shows only billing facts the Stripe webhook has recorded; nothing is guessed.
async function renderMembership(svc, user, profile) {
  $("[data-membership-tier]").textContent = tierLabel(profile.membershipTier);
  $("[data-membership-price]").textContent = tierPrice(profile.membershipTier);
  const billingStatus = $("#billing-status");
  let sub = null;
  try {
    sub = await svc.getSubscription(user.uid);
  } catch {
    sub = null;
  }
  if (sub) {
    $("[data-sub-row]").hidden = false;
    $("[data-sub-status]").textContent = subscriptionLabel(sub.status);
    const live = svc.isLiveSubscription(sub);
    if (live && sub.currentPeriodEnd) {
      $("[data-renewal-row]").hidden = false;
      $("[data-renewal-label]").textContent = sub.cancelAtPeriodEnd ? "Membership ends on" : "Renews on";
      $("[data-renewal-date]").textContent = formatDate(sub.currentPeriodEnd);
    }
  }
  if (new URLSearchParams(location.search).get("checkout") === "success") {
    setStatus(billingStatus, "Thank you. Stripe has your payment details, and your membership will update here once the payment is confirmed, usually within a minute. Refresh this page to check.", "success");
  }
  renderBenefits(profile.membershipTier);

  if (!paymentsEnabled) {
    const pending = readSelectedTier();
    if (pending && !svc.isLiveSubscription(sub) && !billingStatus.textContent) {
      setStatus(billingStatus, `You chose ${tierLabel(pending)}. Paid memberships are not open yet, so you won't be charged. An upgrade option will appear here once they open.`, "info");
    }
    return;
  }

  const billing = await import("./billing-service.js");
  const live = svc.isLiveSubscription(sub);
  const manage = $("#manage-billing");
  manage.hidden = !sub;
  $("#choose-plan").hidden = live;
  manage.onclick = async () => {
    try {
      await busy(manage, () => billing.openBillingPortal());
    } catch (error) {
      setStatus(billingStatus, billing.friendlyBillingError(error), "error");
    }
  };
  const pending = readSelectedTier();
  const resume = $("#resume-checkout");
  if (pending && !live) {
    resume.hidden = false;
    resume.textContent = `Continue to ${tierLabel(pending)} checkout (${tierPrice(pending)})`;
    resume.onclick = async () => {
      try {
        await busy(resume, () => billing.startCheckout(pending));
      } catch (error) {
        setStatus(billingStatus, billing.friendlyBillingError(error), "error");
      }
    };
  }
}

function formatDate(value) {
  const date = value?.toDate?.();
  return date ? date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—";
}

const controllers = {
  login(svc) {
    const form = $("#login-form");
    const status = $("#login-status");
    const resetForm = $("#reset-form");
    const resetStatus = $("#reset-status");

    // Keep a chosen paid tier when the visitor creates an account instead.
    const chosen = rememberTierFromUrl();
    if (chosen) $("#register-link").href = `${url("register.html")}?tier=${chosen}`;

    svc.watchAuth((user) => {
      toggle("[data-signed-in-note]", Boolean(user));
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      clearInvalid(form);
      const email = form.elements.email;
      const password = form.elements.password;
      const emailError = validateEmail(email.value);
      if (emailError) return markInvalid(email, emailError, status);
      if (!password.value) return markInvalid(password, "Please enter your password.", status);
      try {
        await busy(form.querySelector("button[type=submit]"), () => svc.signInMember(email.value, password.value));
        setStatus(status, "Signed in. Taking you to your account…", "success");
        location.assign(nextPage());
      } catch (error) {
        setStatus(status, friendlyAuthError(error), "error");
      }
    });

    resetForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      clearInvalid(resetForm);
      const email = resetForm.elements.email;
      const emailError = validateEmail(email.value);
      if (emailError) return markInvalid(email, emailError, resetStatus);
      try {
        await busy(resetForm.querySelector("button[type=submit]"), () => svc.requestPasswordReset(email.value));
        setStatus(resetStatus, "If an account exists for that email, a password reset link is on its way. Please check your inbox and spam folder.", "success");
      } catch (error) {
        setStatus(resetStatus, friendlyAuthError(error), "error");
      }
    });
  },

  register(svc) {
    const form = $("#register-form");
    const status = $("#register-status");

    const chosen = rememberTierFromUrl() ?? readSelectedTier();
    if (chosen) {
      const note = $("[data-selected-tier]");
      note.hidden = false;
      note.textContent = paymentsEnabled
        ? `You've chosen ${tierLabel(chosen)} (${tierPrice(chosen)}). Create your free account and verify your email first; you can then continue to secure checkout from My Account.`
        : `You've chosen ${tierLabel(chosen)}. Paid memberships are not open yet, so your free account comes first and you won't be charged. We'll show an upgrade option in My Account once they open.`;
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      clearInvalid(form);
      const { displayName, email, password, confirm, agree } = form.elements;
      const nameError = validateDisplayName(displayName.value);
      if (nameError) return markInvalid(displayName, nameError, status);
      const emailError = validateEmail(email.value);
      if (emailError) return markInvalid(email, emailError, status);
      const passwordError = validatePassword(password.value, confirm.value);
      if (passwordError) return markInvalid(passwordError.includes("match") ? confirm : password, passwordError, status);
      if (!agree.checked) return markInvalid(agree, "Please confirm you agree to the Terms and have read the Privacy Notice.", status);
      svc.rememberConsentChoice(form.elements.marketing.checked);
      try {
        await busy(form.querySelector("button[type=submit]"), () =>
          svc.registerMember({ displayName: displayName.value, email: email.value, password: password.value })
        );
        form.hidden = true;
        toggle("[data-register-done]", true);
        $("[data-register-done] h2")?.focus();
      } catch (error) {
        setStatus(status, friendlyAuthError(error), "error");
      }
    });
  },

  account(svc) {
    const status = $("#account-status");
    let adminChecked = false;
    // Deleting the login signs the user out; stay on the page so the
    // "account deleted" confirmation can be shown instead of redirecting.
    let deletingAccount = false;

    svc.watchAuth(async (user) => {
      if (!user) {
        if (deletingAccount) return;
        location.replace(`${url("login.html")}?next=account`);
        return;
      }
      toggle("[data-account-loading]", false);
      document.querySelectorAll("[data-account-email]").forEach((el) => { el.textContent = user.email; });

      if (!user.emailVerified) {
        toggle("[data-verify-panel]", true);
        toggle("[data-member-panel]", false);
        return;
      }

      toggle("[data-verify-panel]", false);
      toggle("[data-member-panel]", true);
      try {
        const profile = await svc.ensureProfile(user);
        $("[data-profile-name]").textContent = profile.displayName;
        $("[data-profile-created]").textContent = formatDate(profile.createdAt);
        await renderMembership(svc, user, profile);
        await svc.savePendingConsent(user.uid).catch(() => {});
        await renderConsent(svc, user);
        $("[data-welcome-name]").textContent = profile.displayName;
        $("#name-form").elements.displayName.value = profile.displayName;
      } catch (error) {
        setStatus(status, friendlyAuthError(error), "error");
      }
      if (!adminChecked) {
        adminChecked = true;
        toggle("[data-admin-link]", await svc.isAdmin(user).catch(() => false));
      }
    });

    $("#resend-verification").addEventListener("click", async (event) => {
      const verifyStatus = $("#verify-status");
      try {
        await busy(event.currentTarget, () => svc.resendVerification(svc.auth.currentUser));
        setStatus(verifyStatus, "We've sent another verification email. Please check your inbox and spam folder.", "success");
      } catch (error) {
        setStatus(verifyStatus, friendlyAuthError(error), "error");
      }
    });

    $("#check-verification").addEventListener("click", async (event) => {
      const verifyStatus = $("#verify-status");
      try {
        const user = await busy(event.currentTarget, () => svc.refreshUser(svc.auth.currentUser));
        if (user?.emailVerified) {
          location.reload();
        } else {
          setStatus(verifyStatus, "Your email is not verified yet. Please use the link in the email we sent.", "info");
        }
      } catch (error) {
        setStatus(verifyStatus, friendlyAuthError(error), "error");
      }
    });

    const nameForm = $("#name-form");
    nameForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      clearInvalid(nameForm);
      const nameStatus = $("#name-status");
      const input = nameForm.elements.displayName;
      const nameError = validateDisplayName(input.value);
      if (nameError) return markInvalid(input, nameError, nameStatus);
      try {
        const name = await busy(nameForm.querySelector("button[type=submit]"), () =>
          svc.updateDisplayName(svc.auth.currentUser, input.value)
        );
        $("[data-profile-name]").textContent = name;
        $("[data-welcome-name]").textContent = name;
        setStatus(nameStatus, "Your name has been updated.", "success");
      } catch (error) {
        setStatus(nameStatus, friendlyAuthError(error), "error");
      }
    });

    document.querySelectorAll("[data-sign-out]").forEach((button) =>
      button.addEventListener("click", async () => {
        await svc.signOutMember();
        location.assign(url("index.html"));
      })
    );

    const deleteStart = $("#delete-start");
    const deleteForm = $("#delete-form");
    const showDeleteForm = (open) => {
      deleteForm.hidden = !open;
      deleteStart.setAttribute("aria-expanded", String(open));
      if (open) deleteForm.elements.password.focus();
      else { deleteForm.reset(); clearInvalid(deleteForm); deleteStart.focus(); }
    };
    deleteStart.addEventListener("click", () => showDeleteForm(deleteForm.hidden));
    $("#delete-cancel").addEventListener("click", () => showDeleteForm(false));

    deleteForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      clearInvalid(deleteForm);
      const deleteStatus = $("#delete-status");
      const { password, confirm } = deleteForm.elements;
      if (!password.value) return markInvalid(password, "Please enter your password.", deleteStatus);
      if (!confirm.checked) return markInvalid(confirm, "Please tick the box to confirm.", deleteStatus);
      let result;
      deletingAccount = true;
      try {
        result = await busy(deleteForm.querySelector("button[type=submit]"), () =>
          svc.deleteAccount(svc.auth.currentUser, password.value)
        );
      } catch (error) {
        // Password check failed: nothing has been deleted.
        deletingAccount = false;
        setStatus(deleteStatus, `${friendlyAuthError(error)} Nothing has been deleted.`, "error");
        return;
      }
      if (!result.accountDeleted) deletingAccount = false;
      if (result.checkFailed) {
        setStatus(deleteStatus, "We couldn't check your membership status, so nothing has been deleted. Please try again later, or email hello@sprinkleofhappiness.co.uk.", "error");
        return;
      }
      if (result.blockedSubscription) {
        setStatus(deleteStatus, "You have a paid membership that is still active. Please cancel it in Manage billing first. Once it has ended you can delete your account. Nothing has been deleted.", "error");
        return;
      }
      if (result.blockedAdmin) {
        setStatus(deleteStatus, "Administrator accounts cannot be deleted here. Ask another administrator to remove your admin access first. Nothing has been deleted.", "error");
        return;
      }
      if (result.accountDeleted) {
        toggle("[data-member-panel]", false);
        toggle("[data-account-deleted]", true);
        $("[data-account-deleted] h2")?.focus();
      } else if (result.profileDeleted) {
        setStatus(deleteStatus, "Your member profile was deleted, but we could not remove your login. Please try again, or email hello@sprinkleofhappiness.co.uk and we will finish deleting it.", "error");
      } else {
        setStatus(deleteStatus, "We could not delete your account. Nothing has been deleted. Please try again.", "error");
      }
    });

    $("#account-reset").addEventListener("click", async (event) => {
      const settingsStatus = $("#settings-status");
      try {
        await busy(event.currentTarget, () => svc.requestPasswordReset(svc.auth.currentUser.email));
        setStatus(settingsStatus, "A password reset link has been sent to your email address.", "success");
      } catch (error) {
        setStatus(settingsStatus, friendlyAuthError(error), "error");
      }
    });
  },

  admin(svc) {
    const status = $("#admin-status");

    svc.watchAuth(async (user) => {
      if (!user) {
        location.replace(`${url("login.html")}?next=admin`);
        return;
      }
      toggle("[data-admin-loading]", false);
      const allowed = await svc.isAdmin(user).catch(() => false);
      if (!allowed) {
        toggle("[data-admin-denied]", true);
        toggle("[data-admin-panel]", false);
        return;
      }
      toggle("[data-admin-denied]", false);
      toggle("[data-admin-panel]", true);
      $("[data-admin-email]").textContent = user.email;
      loadMembers(svc, status);
    });

    document.querySelectorAll("[data-sign-out]").forEach((button) =>
      button.addEventListener("click", async () => {
        await svc.signOutMember();
        location.assign(url("index.html"));
      })
    );
  }
};

function messageRow(tbody, text) {
  tbody.replaceChildren();
  const cell = tbody.insertRow().insertCell();
  cell.colSpan = 6;
  cell.textContent = text;
}

function fillStatusBreakdown(subscriptions) {
  const counts = {};
  for (const sub of subscriptions.values()) counts[sub.status] = (counts[sub.status] ?? 0) + 1;
  const list = $("#status-breakdown");
  list.replaceChildren();
  const entries = Object.entries(counts);
  if (!entries.length) entries.push(["none", 0]);
  for (const [statusName, n] of entries) {
    const row = document.createElement("div");
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = statusName === "none" ? "No paid subscriptions yet" : subscriptionLabel(statusName).split(":")[0];
    dd.textContent = String(n);
    row.append(dt, dd);
    list.append(row);
  }
}

function fillDonationStats(donations) {
  const list = $("#donation-stats");
  const rows = [];
  if (!donations) {
    rows.push(["Donation records", "Could not be loaded"]);
  } else {
    const paid = donations.filter((d) => d.paymentStatus === "paid");
    const pounds = (items) => `£${(items.reduce((sum, d) => sum + (d.amount || 0), 0) / 100).toFixed(2)}`;
    const once = paid.filter((d) => d.frequency === "once");
    const monthly = paid.filter((d) => d.frequency === "monthly");
    if (!paid.length) rows.push(["Donations", "None recorded yet"]);
    else {
      rows.push(["One-off donations", `${once.length} · ${pounds(once)}`]);
      rows.push(["Monthly donations started", `${monthly.length} · ${pounds(monthly)} per month`]);
    }
  }
  list.replaceChildren(...rows.map(([label, value]) => {
    const row = document.createElement("div");
    row.append(Object.assign(document.createElement("dt"), { textContent: label }), Object.assign(document.createElement("dd"), { textContent: value }));
    return row;
  }));
}

async function loadMembers(svc, status) {
  const tbody = $("#members-rows");
  const results = $("#member-results");
  messageRow(tbody, "Loading members…");
  let members;
  let subscriptions;
  let consents;
  let donations;
  try {
    let count;
    [count, members, subscriptions, consents, donations] = await Promise.all([
      svc.countMembers(),
      svc.listMembers(),
      // Members still load if billing, consent or donation records can't be read.
      svc.listSubscriptions().catch(() => null),
      svc.listConsents().catch(() => new Map()),
      svc.listDonations().catch(() => null)
    ]);
    $("[data-member-count]").textContent = String(count);
    if (!subscriptions) {
      subscriptions = new Map();
      setStatus(status, "Subscription records could not be loaded, so subscription columns show None.", "info");
    }
  } catch (error) {
    messageRow(tbody, "Members could not be loaded.");
    setStatus(status, friendlyAuthError(error), "error");
    return;
  }

  $("[data-consent-count]").textContent = String([...consents.values()].filter((c) => c.marketing === true).length);
  fillDonationStats(donations);

  const isPaid = (m) => PAID_TIERS.includes(m.membershipTier);
  const tally = { free: 0, spark: 0, glow: 0, radiance: 0 };
  for (const member of members) tally[isPaid(member) ? member.membershipTier : "free"]++;
  for (const [tier, n] of Object.entries(tally)) $(`[data-tier-count="${tier}"]`).textContent = String(n);
  $("[data-paid-count]").textContent = String(members.filter(isPaid).length);
  $("[data-active-subs]").textContent = String([...subscriptions.values()].filter((s) => svc.isLiveSubscription(s)).length);
  fillStatusBreakdown(subscriptions);

  if (!members.length) {
    messageRow(tbody, "No member profiles yet.");
    results.textContent = "";
    return;
  }

  const search = $("#member-search");
  const filter = $("#member-filter");
  const render = () => {
    const term = search.value.trim().toLowerCase();
    const shown = members.filter((m) => {
      if (filter.value === "paid" && !isPaid(m)) return false;
      if (filter.value === "free" && isPaid(m)) return false;
      return !term || `${m.displayName ?? ""} ${m.email ?? ""}`.toLowerCase().includes(term);
    });
    results.textContent = `Showing ${shown.length} of ${members.length} members.`;
    if (!shown.length) {
      messageRow(tbody, "No members match this search.");
      return;
    }
    tbody.replaceChildren();
    for (const member of shown) {
      const row = tbody.insertRow();
      row.insertCell().textContent = member.displayName ?? "—";
      row.insertCell().textContent = member.email ?? "—";
      row.insertCell().textContent = tierLabel(member.membershipTier);
      const sub = subscriptions.get(member.uid);
      row.insertCell().textContent = sub ? subscriptionLabel(sub.status).split(":")[0] : "None";
      row.insertCell().textContent = consents.get(member.uid)?.marketing === true ? "Yes" : "No";
      row.insertCell().textContent = formatDate(member.createdAt);
    }
  };
  search.addEventListener("input", render);
  filter.addEventListener("change", render);
  render();
}

if (accountsEnabled) {
  toggle("[data-accounts-closed]", false);
  toggle("[data-accounts-open]", true);
  try {
    const svc = await import("./auth-service.js");
    controllers[page]?.(svc);
  } catch {
    toggle("[data-accounts-open]", false);
    toggle("[data-accounts-closed]", true);
  }
}
