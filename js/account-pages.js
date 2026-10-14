// Controllers for login.html, register.html, account.html and admin.html.
// Each page sets <body data-page="..."> and keeps its forms hidden until
// this script confirms accounts are enabled, so the safe default is "closed".
import { accountsEnabled } from "./site-config.js";
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

// Only internal destinations are allowed after sign-in.
function nextPage() {
  const next = new URLSearchParams(location.search).get("next");
  return next === "admin" ? url("admin.html") : url("account.html");
}

// Missing or unknown tiers are shown as Free; paid tiers are only ever set
// by trusted server code.
function tierLabel(tier) {
  return { spark: "Spark", glow: "Glow", radiance: "Radiance" }[tier] ?? "Free";
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

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      clearInvalid(form);
      const { displayName, email, password, confirm } = form.elements;
      const nameError = validateDisplayName(displayName.value);
      if (nameError) return markInvalid(displayName, nameError, status);
      const emailError = validateEmail(email.value);
      if (emailError) return markInvalid(email, emailError, status);
      const passwordError = validatePassword(password.value, confirm.value);
      if (passwordError) return markInvalid(passwordError.includes("match") ? confirm : password, passwordError, status);
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
        $("[data-membership-tier]").textContent = tierLabel(profile.membershipTier);
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

async function loadMembers(svc, status) {
  const tbody = $("#members-rows");
  try {
    const [count, members] = await Promise.all([svc.countMembers(), svc.listMembers()]);
    $("[data-member-count]").textContent = String(count);
    tbody.replaceChildren();
    if (!members.length) {
      const row = tbody.insertRow();
      const cell = row.insertCell();
      cell.colSpan = 4;
      cell.textContent = "No member profiles yet.";
      return;
    }
    for (const member of members) {
      const row = tbody.insertRow();
      row.insertCell().textContent = member.displayName ?? "—";
      row.insertCell().textContent = member.email ?? "—";
      row.insertCell().textContent = tierLabel(member.membershipTier);
      row.insertCell().textContent = formatDate(member.createdAt);
    }
  } catch (error) {
    setStatus(status, friendlyAuthError(error), "error");
  }
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
