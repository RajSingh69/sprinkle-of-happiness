// December 2026 schedule: dates, weekdays, alternation, exceptions and enquiries.
import { test } from "node:test";
import assert from "node:assert/strict";
import { decemberEvents, PROGRAMMES, BOOKING_LINKS, WEEK_THEMES, weekThemeFor, interestMailto, LAUNCH_DATE } from "../../js/events-data.js";

const events = decemberEvents();
const on = (day) => events.filter((e) => e.date === `2026-12-${String(day).padStart(2, "0")}`).map((e) => e.id);
const dates = (id) => events.filter((e) => e.id === id).map((e) => Number(e.date.slice(-2)));

test("launch day is Tuesday 1 December with Winter Blues at 7 PM", () => {
  assert.equal(LAUNCH_DATE, "2026-12-01");
  assert.equal(new Date("2026-12-01T12:00:00Z").getUTCDay(), 2);
  assert.deepEqual(on(1), ["launch", "winter-blues"]);
  assert.equal(PROGRAMMES["winter-blues"].time, "7 PM");
});

test("Monday circles alternate exactly as on the poster", () => {
  assert.deepEqual(dates("rebel-recovery"), [7, 21]);
  assert.deepEqual(dates("queer-rebel-recovery"), [14]);
  assert.deepEqual(on(28), ["quantum-leap"]);
});

test("weekly circles fall on the right weekdays and stop before Quantum Leap week", () => {
  assert.deepEqual(dates("winter-blues"), [1, 8, 15, 22]);
  assert.deepEqual(dates("adhd"), [2, 9, 16, 23]);
  assert.deepEqual(dates("queer-dreams"), [3, 10, 17, 24]);
  assert.deepEqual(dates("bipolar"), [4, 11, 18]);
  assert.deepEqual(dates("survivor"), [5, 12, 19]);
  assert.deepEqual(dates("businesswoman"), [6, 13, 20]);
});

test("27 to 31 December list only the advertised Quantum Leap", () => {
  for (const day of [27, 28, 29, 30, 31]) assert.deepEqual(on(day), ["quantum-leap"], `${day} December`);
});

test("Christmas and Boxing Day specials replace the usual circle", () => {
  assert.deepEqual(on(24), ["queer-dreams"]);
  assert.deepEqual(on(25), ["christmas-social"]);
  assert.deepEqual(on(26), ["gift-to-yourself", "quantum-leap"]);
  assert.deepEqual(dates("quantum-leap"), [26, 27, 28, 29, 30, 31]);
  assert.deepEqual(events.filter((e) => e.id === "quantum-leap").map((e) => e.label), ["Day 1 of 6", "Day 2 of 6", "Day 3 of 6", "Day 4 of 6", "Day 5 of 6", "Day 6 of 6"]);
  assert.equal(events.length, 33);
});

test("descriptions match the dates the calendar actually shows", () => {
  const listed = { "winter-blues": "1, 8, 15 and 22", adhd: "2, 9, 16 and 23", "queer-dreams": "3, 10, 17 and 24", bipolar: "4, 11 and 18", survivor: "5, 12 and 19", businesswoman: "6, 13 and 20", "rebel-recovery": "7 and 21", "queer-rebel-recovery": "14" };
  for (const [id, text] of Object.entries(listed)) assert.ok(PROGRAMMES[id].when.includes(text), `${id}: ${PROGRAMMES[id].when}`);
});

test("only Winter Blues has an exact time; no invented venues", () => {
  for (const [id, p] of Object.entries(PROGRAMMES)) {
    if (id !== "winter-blues" && p.time) assert.match(p.time, /to be confirmed/i, `${id} time must stay unconfirmed`);
    assert.equal(p.venue, undefined, `${id} has no confirmed venue`);
    assert.ok(p.price, `${id} shows a price`);
  }
  assert.equal(PROGRAMMES["quantum-leap"].price, "Completely free");
});

test("booking links are only real, secure, event-specific URLs", () => {
  for (const [id, link] of Object.entries(BOOKING_LINKS)) {
    assert.ok(PROGRAMMES[id], `${id} is a real programme`);
    assert.match(link.url, /^https:\/\/[^/]+\/.+/, `${id} link must be a full https URL`);
    assert.ok(link.provider, `${id} names its provider`);
    assert.doesNotMatch(link.url, /calendly\.com\/kaansingh-sprinkleofhappiness\/?$/, "the general one-to-one Calendly page is not an event booking");
  }
  for (const e of events) assert.equal(e.booking, BOOKING_LINKS[e.id] ?? null);
});

test("interest emails name the event and date and ask for no health details", () => {
  const href = interestMailto("ADHD: Our Superpower", "2026-12-02");
  assert.ok(href.startsWith("mailto:hello@sprinkleofhappiness.co.uk?"));
  const params = new URLSearchParams(href.split("?")[1]);
  assert.equal(params.get("subject"), "Register interest: ADHD: Our Superpower, Wednesday 2 December 2026");
  assert.match(params.get("body"), /don't include health details/);
  assert.match(new URLSearchParams(interestMailto("New Year Quantum Leap", "2026-12-28", "Day 3 of 6").split("?")[1]).get("subject"), /Monday 28 December 2026 \(Day 3 of 6\)/);
});

test("Year of Becoming weeks carry the poster reflection questions", () => {
  assert.equal(weekThemeFor("2026-12-01").title, "Arrive");
  assert.equal(weekThemeFor("2026-12-14").question, "What do I judge in others that I hide in myself?");
  assert.equal(weekThemeFor("2026-12-31").title, "Quantum Leap");
  for (const w of WEEK_THEMES) assert.match(w.question, /\?$/);
});
