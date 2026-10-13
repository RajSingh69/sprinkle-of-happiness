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
