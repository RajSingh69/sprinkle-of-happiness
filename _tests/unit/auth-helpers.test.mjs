import { test } from "node:test";
import assert from "node:assert/strict";
import {
  cleanDisplayName,
  validateDisplayName,
  validateEmail,
  validatePassword,
  friendlyAuthError
} from "../../js/auth-helpers.js";

test("display names are cleaned and length-checked", () => {
  assert.equal(cleanDisplayName("  Kaan \n  Singh\u0007 "), "Kaan Singh");
  assert.equal(validateDisplayName("   "), "Please enter a name.");
  assert.equal(validateDisplayName("A".repeat(60)), "");
  assert.match(validateDisplayName("A".repeat(61)), /60 characters/);
});

test("email validation", () => {
  assert.equal(validateEmail("person@example.com"), "");
  assert.notEqual(validateEmail(""), "");
  assert.notEqual(validateEmail("not-an-email"), "");
});

test("password validation", () => {
  assert.match(validatePassword("short"), /at least 8/);
  assert.equal(validatePassword("longenough", "longenough"), "");
  assert.match(validatePassword("longenough", "different"), /do not match/);
});

test("sign-in errors never reveal whether an account exists", () => {
  const wrongPassword = friendlyAuthError({ code: "auth/wrong-password" });
  const noUser = friendlyAuthError({ code: "auth/user-not-found" });
  const invalid = friendlyAuthError({ code: "auth/invalid-credential" });
  assert.equal(wrongPassword, noUser);
  assert.equal(noUser, invalid);
  assert.doesNotMatch(noUser, /not found|no account|does not exist/i);
});

test("unknown errors fall back to a generic message", () => {
  assert.equal(friendlyAuthError({ code: "auth/internal-error", message: "secret details" }), "Something went wrong. Please try again.");
  assert.equal(friendlyAuthError(undefined), "Something went wrong. Please try again.");
});

test("sign-up and account errors have calm, specific messages", () => {
  assert.equal(friendlyAuthError({ code: "auth/missing-password" }), "Please enter your password.");
  assert.match(friendlyAuthError({ code: "auth/requires-recent-login" }), /log out, log back in/);
  assert.match(friendlyAuthError({ code: "auth/quota-exceeded" }), /Too many attempts/);
  assert.match(friendlyAuthError({ code: "auth/email-already-in-use" }), /try logging in or resetting your password/);
  assert.doesNotMatch(friendlyAuthError({ code: "auth/user-not-found" }), /no account|not found|doesn't exist/i, "never reveals whether an account exists");
});
