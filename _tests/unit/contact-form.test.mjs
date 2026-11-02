// Contact form validation, spam trap and email composition.
import { test } from "node:test";
import assert from "node:assert/strict";
import { validateEnquiry, enquiryMailto, deliveryPayload, CONTACT_ADDRESS, FORM_ENDPOINT, WEB3FORMS_ACCESS_KEY, MESSAGE_MAX } from "../../js/contact-form.js";

const good = { name: "Amy", email: "amy@example.com", topic: "Volunteering", message: "I'd love to help at a workshop.", website: "" };

test("a complete enquiry passes validation", () => {
  assert.equal(validateEnquiry(good), null);
});

test("each required field is checked with a clear message", () => {
  assert.equal(validateEnquiry({ ...good, name: " " }).field, "name");
  assert.equal(validateEnquiry({ ...good, email: "not-an-email" }).field, "email");
  assert.equal(validateEnquiry({ ...good, topic: "" }).field, "topic");
  assert.equal(validateEnquiry({ ...good, message: "hi" }).field, "message");
  assert.equal(validateEnquiry({ ...good, message: "x".repeat(MESSAGE_MAX + 1) }).field, "message");
});

test("the hidden spam-trap field rejects automated submissions", () => {
  assert.equal(validateEnquiry({ ...good, website: "http://spam.example" }).field, "website");
});

test("the email-app fallback still addresses the approved inbox", () => {
  assert.equal(CONTACT_ADDRESS, "hello@sprinkleofhappiness.co.uk");
  const href = enquiryMailto(good);
  assert.ok(href.startsWith("mailto:hello@sprinkleofhappiness.co.uk?"));
  const params = new URLSearchParams(href.split("?")[1]);
  assert.equal(params.get("subject"), "Volunteering: message from Amy");
  assert.match(params.get("body"), /I'd love to help at a workshop\.[\s\S]*Email: amy@example\.com/);
});

test("direct delivery posts to Web3Forms with the configured public access key", () => {
  assert.match(WEB3FORMS_ACCESS_KEY, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  assert.equal(FORM_ENDPOINT, "https://api.web3forms.com/submit");
  assert.equal(deliveryPayload(good).access_key, WEB3FORMS_ACCESS_KEY);
});

test("the Web3Forms payload carries only the enquiry, a subject and an empty spam trap", () => {
  const payload = deliveryPayload(good);
  assert.deepEqual(Object.keys(payload).sort(), ["access_key", "botcheck", "email", "from_name", "message", "name", "subject", "topic"]);
  assert.equal(payload.subject, "Volunteering: message from Amy (areyouasurvivor.com)");
  assert.equal(payload.botcheck, "");
  assert.equal(payload.email, "amy@example.com");
});
