// Whole-site integrity: catches emptied or truncated pages and missing shared
// navigation, safety signposting or key features.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const pages = [
  ...readdirSync(root).filter((f) => f.endsWith(".html")),
  ...readdirSync(join(root, "experiences")).filter((f) => f.endsWith(".html")).map((f) => `experiences/${f}`)
];
const read = (page) => readFileSync(join(root, page), "utf8");

test("every page is complete, with one title, one h1, the shared nav and footer", () => {
  assert.ok(pages.length >= 40, `found ${pages.length} pages`);
  for (const page of pages) {
    const html = read(page);
    assert.ok(html.length > 4000, `${page} looks truncated (${html.length} bytes)`);
    assert.match(html, /<\/html>\s*$/, `${page} ends properly`);
    assert.equal((html.match(/<title>/g) ?? []).length, 1, `${page} title`);
    assert.equal((html.match(/<h1[\s>]/g) ?? []).length, 1, `${page} h1`);
    assert.match(html, /name="description"\s+content="[^"]{20,}"/, `${page} description`);
    for (const link of ["whats-on.html", "membership.html", "bookings.html", "donate.html", "support.html", "contact.html"]) {
      assert.ok(html.includes(`${link}"`), `${page} links to ${link}`);
    }
    assert.match(html, /tel:116123/, `${page} keeps Samaritans signposting`);
    assert.match(html, /mailto:hello@sprinkleofhappiness\.co\.uk/, `${page} contact email`);
    assert.doesNotMatch(html, /sprinkleofhappines\.org/, `${page} has no old email`);
  }
});

test("key features are still on their pages", () => {
  const expect = {
    "index.html": ["data-site-intro", "data-intro-enter", "data-welcome-question", "data-december-preview", "auth-nav.js"],
    "register.html": ['name="marketing"', 'name="agree"'],
    "membership.html": ['data-checkout-tier="spark"', 'data-checkout-tier="glow"', 'data-checkout-tier="radiance"'],
    "account.html": ["manage-billing", "consent-form", "delete-form"],
    "bookings.html": ["calendly.com/kaansingh-sprinkleofhappiness", "data-calendly-show"],
    "donate.html": ["data-donations-off", "donate-form"],
    "whats-on.html": ["data-whats-on", "wo-dialog", "whats-on.js"],
    "year-of-becoming.html": ['id="winter"', 'id="spring"', 'id="summer"', 'id="autumn"', "yob-question"],
    "kaan.html": ["Buy on Lulu", "Buy on Amazon"]
  };
  for (const [page, needles] of Object.entries(expect)) {
    const html = read(page);
    for (const needle of needles) assert.ok(html.includes(needle), `${page} is missing ${needle}`);
  }
});
