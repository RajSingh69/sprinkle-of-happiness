#!/usr/bin/env node
// One-time administrator bootstrap. Run manually on a trusted machine only.
// Never commit service-account keys; point GOOGLE_APPLICATION_CREDENTIALS at
// a key file stored outside this repository. See README.md.
//
//   node set-admin.mjs check  --email person@example.com
//   node set-admin.mjs grant  --email person@example.com --uid <uid-from-check>
//   node set-admin.mjs revoke --email person@example.com --uid <uid-from-check>
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const PROJECT_ID = "sprinkle-of-happiness";
const APPROVED_ADMINS = new Set([
  "kaansingh@sprinkleofhappiness.co.uk",
  "rajan@s3dsystems.com"
]);

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

const action = process.argv[2];
const email = arg("email")?.trim().toLowerCase();
const uid = arg("uid")?.trim();

if (!["check", "grant", "revoke"].includes(action)) fail("Usage: set-admin.mjs <check|grant|revoke> --email <email> [--uid <uid>]");
if (!email) fail("--email is required.");
// Credentials come from Application Default Credentials: preferably
// `gcloud auth application-default login` (no key file), or a key file named
// in GOOGLE_APPLICATION_CREDENTIALS that is stored outside this repository.
initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
const auth = getAuth();

let user;
try {
  user = await auth.getUserByEmail(email);
} catch (error) {
  if (error?.code === "auth/user-not-found") {
    fail(`No Firebase Authentication user found for ${email}. They must register and verify their email first.`);
  }
  fail("Could not reach Firebase with your credentials. Run `gcloud auth application-default login` as a project owner (see README.md) and try again.");
}

console.log(`\nUser:            ${user.email}`);
console.log(`UID:             ${user.uid}`);
console.log(`Email verified:  ${user.emailVerified}`);
console.log(`Disabled:        ${user.disabled}`);
console.log(`Current claims:  ${JSON.stringify(user.customClaims ?? {})}`);

if (action === "check") {
  console.log("\nNo changes made. To grant admin, re-run with: grant --email <email> --uid <uid shown above>\n");
  process.exit(0);
}

if (uid !== user.uid) fail("--uid must exactly match the UID shown by `check`. This confirms you are changing the intended account.");

if (action === "grant") {
  if (!APPROVED_ADMINS.has(email)) fail(`${email} is not on the approved administrator list in this script.`);
  if (!user.emailVerified) fail("This email address is not verified yet. Ask the person to verify it, then try again.");
  if (user.disabled) fail("This account is disabled.");
  await auth.setCustomUserClaims(user.uid, { ...(user.customClaims ?? {}), admin: true });
  console.log("\n✔ Admin claim granted. The person must log out and back in (or wait up to an hour) for it to take effect.\n");
}

if (action === "revoke") {
  const { admin, ...rest } = user.customClaims ?? {};
  await auth.setCustomUserClaims(user.uid, rest);
  await auth.revokeRefreshTokens(user.uid);
  console.log("\n✔ Admin claim removed and existing sessions revoked.\n");
}
