// December 2026 programme: the single source for What's On, the homepage
// preview and the schedule tests. Details come from Kaan's December posters.
// Only Winter Blues has a confirmed time; nothing else here should gain a
// time, venue, capacity or booking link until Kaan confirms it.

export const LAUNCH_DATE = "2026-12-01";
export const MONTH = { year: 2026, month: 11 }; // December (0-based month)

export const PAY_WHAT_YOU_CAN = "Pay what you can. Free if you can't.";
export const VENUE_TBC = "Venue to be confirmed";

export const KINDS = {
  circle: { label: "Weekly circle", plural: "Weekly circles" },
  special: { label: "Special event", plural: "Special events" },
  course: { label: "Free course", plural: "Courses" },
  launch: { label: "Launch", plural: "Launch" }
};

export const REBEL = ["Recognise", "Explore", "Breathe", "Embody", "Liberate"];

export const PROGRAMMES = {
  launch: {
    title: "Official launch of Sprinkle of Happiness",
    kind: "launch",
    colour: "launch",
    when: "Tuesday 1 December 2026",
    summary: "Sprinkle of Happiness officially opens its doors, with the first Winter Blues session that evening.",
    details: ["Join us as December's programme of circles, workshops and special events begins."],
    audience: "Everyone",
    price: PAY_WHAT_YOU_CAN
  },
  "rebel-recovery": {
    title: "Rebel Recovery & Freedom",
    kind: "circle",
    colour: "rebel",
    when: "Every other Monday",
    summary: "Recovery without shame and without a mandatory 12-step approach.",
    details: ["Combines Sikh wisdom, shadow work and body-based practices through the R.E.B.E.L. framework."],
    framework: REBEL,
    audience: "People in recovery, or considering it",
    price: PAY_WHAT_YOU_CAN,
    page: "rebel-recovery.html"
  },
  "queer-rebel-recovery": {
    title: "Queer Rebel Recovery & Freedom",
    kind: "circle",
    colour: "queer-rebel",
    when: "Every other Monday, alternating with Rebel Recovery",
    summary: "A survivor-led recovery circle for LGBTQIA+ survivors.",
    details: ["Uses the same R.E.B.E.L. framework in a dedicated peer space."],
    framework: REBEL,
    audience: "LGBTQIA+ survivors in recovery",
    price: PAY_WHAT_YOU_CAN,
    page: "rebel-recovery.html"
  },
  "winter-blues": {
    title: "How to Stay Happy in the Winter Blues",
    kind: "circle",
    colour: "winter",
    when: "Every Tuesday at 7 PM",
    time: "7 PM",
    summary: "Peer-led discussion and practical activities for difficult winter moods.",
    details: ["Movement, warmth, connection and joy for the darker months."],
    audience: "Anyone finding winter difficult",
    price: PAY_WHAT_YOU_CAN
  },
  adhd: {
    title: "ADHD: Our Superpower",
    kind: "circle",
    colour: "adhd",
    when: "Every Wednesday",
    summary: "A welcoming circle about focus strategies, overwhelm and shame-free planning.",
    details: ["Celebrates the strengths of different ways of thinking."],
    audience: "People with ADHD, diagnosed or exploring whether they may have it",
    price: PAY_WHAT_YOU_CAN,
    page: "experiences/adhd-our-superpower.html"
  },
  "queer-dreams": {
    title: "Queer Dreams & Futures",
    kind: "circle",
    colour: "queer-dreams",
    when: "Every Thursday",
    summary: "Creative activities focused on possibility, hope and community.",
    details: ["Vision boards, poetry and letters to your future self."],
    audience: "LGBTQIA+ and questioning people",
    price: PAY_WHAT_YOU_CAN,
    page: "lgbtq.html"
  },
  bipolar: {
    title: "Bipolar Fluctuations",
    kind: "circle",
    colour: "bipolar",
    when: "Every Friday (not on Christmas Day)",
    summary: "Peer-led discussion about living with highs and lows.",
    details: ["Routines, relationships, emotional highs and lows, warning signs and mutual understanding."],
    audience: "People living with bipolar disorder",
    price: PAY_WHAT_YOU_CAN,
    page: "experiences/bipolar-fluctuations.html"
  },
  survivor: {
    title: "I Am a Survivor: Storytelling Workshop",
    kind: "circle",
    colour: "survivor",
    when: "Every Saturday (not on Boxing Day)",
    summary: "Creative writing and storytelling with gentle prompts.",
    details: ["There is no obligation to share personal experiences.", "No writing experience needed."],
    audience: "Survivors, regardless of writing experience",
    price: PAY_WHAT_YOU_CAN,
    page: "experiences/i-am-a-survivor.html"
  },
  businesswoman: {
    title: "To Do or To Die: She Is a Businesswoman",
    kind: "circle",
    colour: "business",
    when: "Every Sunday",
    summary: "An accountability and encouragement circle for ambitions of every size.",
    details: ["For businesses, side projects and personal ambitions."],
    audience: "Everyone welcome",
    price: PAY_WHAT_YOU_CAN,
    page: "experiences/businesswoman-circle.html"
  },
  "christmas-social": {
    title: "Christmas Social",
    kind: "special",
    colour: "christmas",
    when: "Friday 25 December 2026, evening",
    time: "Evening (time to be confirmed)",
    summary: "A relaxed festive gathering with warm drinks and good company.",
    details: ["Open to everyone. Come as you are."],
    audience: "Open to everyone",
    price: PAY_WHAT_YOU_CAN
  },
  "gift-to-yourself": {
    title: "Make a Gift to Yourself",
    kind: "special",
    colour: "gift",
    when: "Saturday 26 December 2026, evening",
    time: "Evening (time to be confirmed)",
    summary: "A Boxing Day creative workshop for letters, keepsakes and personal intentions.",
    details: ["Make something for yourself to carry into the new year."],
    audience: "Everyone welcome",
    price: PAY_WHAT_YOU_CAN
  },
  "quantum-leap": {
    title: "New Year Quantum Leap",
    kind: "course",
    colour: "quantum",
    when: "Daily, 26 to 31 December 2026",
    time: "Daily (times to be confirmed)",
    summary: "A free six-day course for anyone ready for a fresh start.",
    details: ["Reflection, identity and personal change, with prompts and creative exercises."],
    audience: "Anyone ready for a fresh start",
    price: "Completely free"
  }
};

// Year of Becoming weekly themes that fall in this calendar.
export const WEEK_THEMES = [
  { week: 1, title: "Arrive", start: "2026-12-01", end: "2026-12-06" },
  { week: 2, title: "The Inventory", start: "2026-12-07", end: "2026-12-13" },
  { week: 3, title: "Meet Your Shadow", start: "2026-12-14", end: "2026-12-20" },
  { week: 4, title: "The Longest Night", start: "2026-12-21", end: "2026-12-27" },
  { week: 5, title: "Quantum Leap", start: "2026-12-28", end: "2027-01-03" }
];

const pad = (n) => String(n).padStart(2, "0");
export const isoDate = (day) => `${MONTH.year}-${pad(MONTH.month + 1)}-${pad(day)}`;

// Weekly circles by JavaScript weekday (0 = Sunday).
const WEEKLY = { 2: "winter-blues", 3: "adhd", 4: "queer-dreams", 5: "bipolar", 6: "survivor", 0: "businesswoman" };

// Monday circles alternate, exactly as shown on the poster calendar. There is
// deliberately no Monday circle on 28 December: the calendar shows Quantum Leap.
const MONDAYS = { 7: "rebel-recovery", 14: "queer-rebel-recovery", 21: "rebel-recovery" };

// Special events replace the usual circle on these dates.
const REPLACES = { 25: "christmas-social", 26: "gift-to-yourself" };

export function weekThemeFor(date) {
  return WEEK_THEMES.find((w) => date >= w.start && date <= w.end) ?? null;
}

// Every December 2026 occurrence, in date order. Overlapping events on the
// same date are separate entries.
export function decemberEvents() {
  const events = [];
  const days = new Date(Date.UTC(MONTH.year, MONTH.month + 1, 0)).getUTCDate();
  for (let day = 1; day <= days; day += 1) {
    const date = isoDate(day);
    const weekday = new Date(Date.UTC(MONTH.year, MONTH.month, day)).getUTCDay();
    if (date === LAUNCH_DATE) events.push({ date, id: "launch" });
    if (REPLACES[day]) {
      events.push({ date, id: REPLACES[day] });
    } else if (weekday === 1) {
      if (MONDAYS[day]) events.push({ date, id: MONDAYS[day] });
    } else if (WEEKLY[weekday]) {
      events.push({ date, id: WEEKLY[weekday] });
    }
    if (day >= 26) events.push({ date, id: "quantum-leap", label: `Day ${day - 25} of 6` });
  }
  return events.map((event) => ({ ...event, programme: PROGRAMMES[event.id] }));
}

export function formatDate(date, options = { weekday: "long", day: "numeric", month: "long" }) {
  const [y, m, d] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", { ...options, timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d)));
}

export function interestMailto(title) {
  return `mailto:hello@sprinkleofhappiness.co.uk?subject=${encodeURIComponent(`Register interest: ${title}`)}`;
}
