// Member emails: the welcome email and marketing unsubscribe.
//
// Emails are queued as documents in mail/{id} using the format of Firebase's
// "Trigger Email from Firestore" extension, which sends them through the
// configured provider (SMTP / SendGrid / etc.). No email credentials live in
// this code. mail/ is server-only in firestore.rules.
import { createHmac, timingSafeEqual } from "node:crypto";

export const CONSENT_VERSION = "marketing-v1-2026-10-20";

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

export function unsubscribeToken(uid, secret) {
  return createHmac("sha256", secret).update(`unsubscribe:${uid}`).digest("hex");
}

export function verifyUnsubscribeToken(uid, token, secret) {
  if (typeof uid !== "string" || typeof token !== "string" || !uid || !/^[0-9a-f]{64}$/.test(token)) return false;
  const expected = Buffer.from(unsubscribeToken(uid, secret), "hex");
  const given = Buffer.from(token, "hex");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export function createEmails({ db, FieldValue, siteUrl, functionsBaseUrl, unsubscribeSecret, log = console }) {
  // Transactional welcome email (not marketing, so no consent needed). The
  // deterministic document ID plus create() means it can only ever be queued
  // once per member, however many times the trigger fires.
  async function queueWelcomeEmail(uid, profile) {
    if (!profile?.email) return { queued: false, reason: "no-email" };
    if ((await db.doc(`deletedAccounts/${uid}`).get()).exists) return { queued: false, reason: "deleted" };
    const name = profile.displayName || "there";
    try {
      await db.doc(`mail/welcome-${uid}`).create({
        to: profile.email,
        message: {
          subject: "Welcome to Sprinkle of Happiness",
          text: `Hi ${name},\n\nWelcome to Sprinkle of Happiness. Your free membership is ready.\n\nVisit My Account: ${siteUrl}/account.html\nExplore experiences: ${siteUrl}/experiences.html\n\nYou can change your email preferences at any time in My Account.\n\nSprinkle of Happiness is not a crisis or emergency service. If you are in danger, call 999. Samaritans: 116 123.\n\nWith warmth,\nSprinkle of Happiness`,
          html: `<p>Hi ${escapeHtml(name)},</p><p>Welcome to Sprinkle of Happiness. Your free membership is ready.</p><p><a href="${siteUrl}/account.html">Visit My Account</a> · <a href="${siteUrl}/experiences.html">Explore experiences</a></p><p>You can change your email preferences at any time in My Account.</p><p style="font-size:13px;color:#555">Sprinkle of Happiness is not a crisis or emergency service. If you are in danger, call 999. Samaritans: 116 123.</p><p>With warmth,<br>Sprinkle of Happiness</p>`
        },
        kind: "welcome",
        uid,
        createdAt: FieldValue.serverTimestamp()
      });
      return { queued: true };
    } catch (err) {
      if (err?.code === 6 || /already exists/i.test(err?.message ?? "")) return { queued: false, reason: "duplicate" };
      throw err;
    }
  }

  // For future marketing emails: every one must include this link.
  function unsubscribeUrl(uid) {
    return `${functionsBaseUrl}/unsubscribe?uid=${encodeURIComponent(uid)}&token=${unsubscribeToken(uid, unsubscribeSecret)}`;
  }

  // One-click unsubscribe from a signed link: no login needed, and it can
  // only change the marketing preference of the member the link was made for.
  async function handleUnsubscribe({ uid, token }) {
    if (!verifyUnsubscribeToken(uid, token, unsubscribeSecret)) {
      return { status: 400, body: page("This unsubscribe link is not valid. You can change your email preferences in My Account.") };
    }
    await db.doc(`consents/${uid}`).set({
      marketing: false,
      version: CONSENT_VERSION,
      wording: "Unsubscribed using the link in an email.",
      source: "unsubscribe-link",
      updatedAt: FieldValue.serverTimestamp()
    });
    log.info("Marketing consent withdrawn via unsubscribe link.");
    return { status: 200, body: page("You have been unsubscribed from Sprinkle of Happiness updates. You will still receive essential account emails.") };
  }

  function page(message) {
    return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Email preferences | Sprinkle of Happiness</title><body style="font-family:system-ui,sans-serif;max-width:560px;margin:60px auto;padding:0 20px;color:#2b2140"><h1 style="font-size:1.6rem">Email preferences</h1><p>${escapeHtml(message)}</p><p><a href="${siteUrl}/account.html">Go to My Account</a></p></body></html>`;
  }

  return { queueWelcomeEmail, unsubscribeUrl, handleUnsubscribe };
}
