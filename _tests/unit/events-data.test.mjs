// December 2026 schedule: dates, weekdays, alternation and exceptions.
import { test } from "node:test";
import assert from "node:assert/strict";
import { decemberEvents, PROGRAMMES, weekThemeFor, LAUNCH_DATE } from "../../js/events-data.js";

const events = decemberEvents();
const on = (day) => events.filter((e) => e.date === `2026-12-${String(day).padStart(2, "0")}`).map((e) => e.id);
const dates = (id) => events.filter((e) => e.id === id).map((e) => Number(e.date.slice(-2)));

test("launch day is Tuesday 1 December with Winter Blues at 7 PM", () => {
  assert.equal(LAUNCH_DATE, "2026-12-01");
  assert.equal(new Date("2026-12-01T12:00:00Z").getUTCDay(), 2);
  assert.deepEqual(on(1), ["launch", "winter-blues"]);
  assert.equal(PROGRAMMES["winter-blues"].time, "7 PM");
});

test("Monday circles alternate and stop for Quantum Leap on the 28th", () => {
  assert.deepEqual(dates("rebel-recovery"), [7, 21]);
  assert.deepEqual(dates("queer-rebel-recovery"), [14]);
  assert.deepEqual(on(28), ["quantum-leap"]);
});

test("weekly circles fall on the right weekdays", () => {
  assert.deepEqual(dates("winter-blues"), [1, 8, 15, 22, 29]);
  assert.deepEqual(dates("adhd"), [2, 9, 16, 23, 30]);
  assert.deepEqual(dates("queer-dreams"), [3, 10, 17, 24, 31]);
  assert.deepEqual(dates("bipolar"), [4, 11, 18]);
  assert.deepEqual(dates("survivor"), [5, 12, 19]);
  assert.deepEqual(dates("businesswoman"), [6, 13, 20, 27]);
});

test("special events replace the usual circle and overlap Quantum Leap correctly", () => {
  assert.deepEqual(on(25), ["christmas-social"]);
  assert.deepEqual(on(26), ["gift-to-yourself", "quantum-leap"]);
  assert.deepEqual(dates("quantum-leap"), [26, 27, 28, 29, 30, 31]);
  assert.deepEqual(events.filter((e) => e.id === "quantum-leap").map((e) => e.label), ["Day 1 of 6", "Day 2 of 6", "Day 3 of 6", "Day 4 of 6", "Day 5 of 6", "Day 6 of 6"]);
});

test("only Winter Blues has an exact time; no invented booking links or venues", () => {
  for (const [id, p] of Object.entries(PROGRAMMES)) {
    if (id !== "winter-blues" && p.time) assert.match(p.time, /to be confirmed/i, `${id} time must stay unconfirmed`);
    assert.equal(p.booking, undefined, `${id} has no confirmed booking link`);
    assert.equal(p.venue, undefined, `${id} has no confirmed venue`);
  }
});

test("Year of Becoming week themes cover December", () => {
  assert.equal(weekThemeFor("2026-12-01").title, "Arrive");
  assert.equal(weekThemeFor("2026-12-14").title, "Meet Your Shadow");
  assert.equal(weekThemeFor("2026-12-31").title, "Quantum Leap");
});
