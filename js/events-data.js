// December 2026 programme: the single source for What's On, the homepage
// preview and the schedule tests. Details come from Kaan's December posters.
// Only Winter Blues has a confirmed time; nothing else here should gain a
// time, venue, capacity or booking link until Kaan confirms it.

export const LAUNCH_DATE = "2026-12-01";
export const MONTH = { year: 2026, month: 11 }; // December (0-based month)

export const PAY_WHAT_YOU_CAN = "Pay what you can. Free if you can't.";
export const VENUE_TBC = "Venue to be confirmed";
export const NO_MEMBERSHIP = "No membership needed";

export const KINDS = {
  circle: { label: "Weekly circle", plural: "Weekly circles" },
  special: { label: "Special event", plural: "Special events" },
  course: { label: "Free course", plural: "Courses" },
  launch: { label: "Launch", plural: "Launch" }
};

export const REBEL = ["Recognise", "Explore", "Breathe", "Embody", "Liberate"];

// Registration links Kaan has confirmed, by programme id, e.g.
//   "christmas-social": { url: "https://lu.ma/…", provider: "Luma" }
// Leave empty until a real, event-specific link exists. Visitors then see
// "Booking not open yet" and can register interest by email instead.
export const BOOKING_LINKS = {};

export const PROGRAMMES = {
  launch: {
    title: "Official launch of Sprinkle of Happiness",
    kind: "launch",
    colour: "launch",
    when: "Tuesday 1 December 2026",
    summary: "The day Sprinkle of Happiness officially opens its doors.",
    details: ["December's programme of circles, workshops and special events begins today, with the first Winter Blues circle that evening at 7 PM."],
    audience: "Everyone",
    price: PAY_WHAT_YOU_CAN
  },
  "rebel-recovery": {
    title: "Rebel Recovery & Freedom",
    kind: "circle",
    colour: "rebel",
    when: "Every other Monday: 7 and 21 December",
    summary: "Recovery without shame, and without a mandatory 12-step approach.",
    details: ["A survivor-led circle that brings together Sikh wisdom, shadow work and body-based practices through the R.E.B.E.L. framework."],
    framework: REBEL,
    audience: "People in recovery, or considering it",
    price: PAY_WHAT_YOU_CAN,
    page: "rebel-recovery.html"
  },
  "queer-rebel-recovery": {
    title: "Queer Rebel Recovery & Freedom",
    kind: "circle",
    colour: "queer-rebel",
    when: "Every other Monday, alternating with Rebel Recovery: 14 December",
    summary: "A survivor-led recovery circle for LGBTQIA+ survivors.",
    details: ["The same R.E.B.E.L. framework, in a dedicated peer space where you don't have to explain yourself."],
    framework: REBEL,
    audience: "LGBTQIA+ survivors in recovery",
    price: PAY_WHAT_YOU_CAN,
    page: "rebel-recovery.html"
  },
  "winter-blues": {
    title: "How to Stay Happy in the Winter Blues",
    kind: "circle",
    colour: "winter",
    when: "Tuesdays at 7 PM: 1, 8, 15 and 22 December",
    time: "7 PM",
    summary: "Peer-led conversation and practical activities for getting through difficult winter moods.",
    details: ["Movement, warmth, connection and joy for the darker months, shared with people who understand."],
    audience: "Anyone finding winter difficult",
    price: PAY_WHAT_YOU_CAN
  },
  adhd: {
    title: "ADHD: Our Superpower",
    kind: "circle",
    colour: "adhd",
    when: "Wednesdays: 2, 9, 16 and 23 December",
    summary: "A welcoming circle for focus strategies, overwhelm and shame-free planning.",
    details: ["We also celebrate the strengths of thinking differently."],
    audience: "People with ADHD, diagnosed or exploring whether they may have it",
    price: PAY_WHAT_YOU_CAN,
    page: "experiences/adhd-our-superpower.html"
  },
  "queer-dreams": {
    title: "Queer Dreams & Futures",
    kind: "circle",
    colour: "queer-dreams",
    when: "Thursdays: 3, 10, 17 and 24 December",
    summary: "Creative time to imagine what's possible, together.",
    details: ["Vision boards, poetry and letters to your future self, focused on possibility, hope and community."],
    audience: "LGBTQIA+ and questioning people",
    price: PAY_WHAT_YOU_CAN,
    page: "lgbtq.html"
  },
  bipolar: {
    title: "Bipolar Fluctuations",
    kind: "circle",
    colour: "bipolar",
    when: "Fridays: 4, 11 and 18 December",
    summary: "Peer-led conversation about living with the highs and lows.",
    details: ["Routines, relationships, emotional highs and lows, warning signs, and the understanding that comes from shared experience."],
    audience: "People living with bipolar disorder",
    price: PAY_WHAT_YOU_CAN,
    page: "experiences/bipolar-fluctuations.html"
  },
  survivor: {
    title: "I Am a Survivor: Storytelling Workshop",
    kind: "circle",
    colour: "survivor",
    when: "Saturdays: 5, 12 and 19 December",
    summary: "Creative writing and storytelling with gentle prompts.",
    details: ["You never have to share personal experiences.", "No writing experience needed."],
    audience: "Survivors, whatever your writing experience",
    price: PAY_WHAT_YOU_CAN,
    page: "experiences/i-am-a-survivor.html"
  },
  businesswoman: {
    title: "To Do or To Die: She Is a Businesswoman",
    kind: "circle",
    colour: "business",
    when: "Sundays: 6, 13 and 20 December",
    summary: "Accountability and encouragement for ambitions of every size.",
    details: ["For anyone building a business, a side project or a personal ambition."],
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
    details: ["Open to everyone. However you feel about Christmas, you're welcome to come as you are."],
    audience: "Open to everyone",
    price: PAY_WHAT_YOU_CAN
  },
  "gift-to-yourself": {
    title: "Make a Gift to Yourself",
    kind: "special",
    colour: "gift",
    when: "Saturday 26 December 2026, evening",
    time: "Evening (time to be confirmed)",
    summary: "A Boxing Day creative workshop: letters, keepsakes and personal intentions.",
    details: ["Make something just for you to carry into the new year."],
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
    details: ["Reflection, identity and personal change, with prompts and creative exercises for each day."],
    audience: "Anyone ready for a fresh start",
    price: "Completely free"
  }
};

// Year of Becoming weekly themes and reflection questions from the posters.
export const WEEK_THEMES = [
  { week: 1, title: "Arrive", start: "2026-12-01", end: "2026-12-06", question: "What did it take for me to get here today?" },
  { week: 2, title: "The Inventory", start: "2026-12-07", end: "2026-12-13", question: "What am I carrying that was never mine?" },
  { week: 3, title: "Meet Your Shadow", start: "2026-12-14", end: "2026-12-20", question: "What do I judge in others that I hide in myself?" },
  { week: 4, title: "The Longest Night", start: "2026-12-21", end: "2026-12-27", question: "What does my darkness need from me tonight?" },
  { week: 5, title: "Quantum Leap", start: "2026-12-28", end: "2027-01-03", question: "Who am I when I stop being who I had to be?" }
];

const pad = (n) => String(n).padStart(2, "0");
export const isoDate = (day) => `${MONTH.year}-${pad(MONTH.month + 1)}-${pad(day)}`;

// Weekly circles by JavaScript weekday (0 = Sunday).
const WEEKLY = { 2: "winter-blues", 3: "adhd", 4: "queer-dreams", 5: "bipolar", 6: "survivor", 0: "businesswoman" };

// Monday circles alternate, exactly as shown on the poster calendar.
const MONDAYS = { 7: "rebel-recovery", 14: "queer-rebel-recovery", 21: "rebel-recovery" };

// Special events replace the usual circle on these dates.
const REPLACES = { 25: "christmas-social", 26: "gift-to-yourself" };

// The poster shows only Quantum Leap from 27 to 31 December, so the regular
// circles are not listed on those dates until Kaan confirms them.
const QUANTUM_LEAP_ONLY_FROM = 27;

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
    } else if (day < QUANTUM_LEAP_ONLY_FROM) {
      if (weekday === 1) {
        if (MONDAYS[day]) events.push({ date, id: MONDAYS[day] });
      } else if (WEEKLY[weekday]) {
        events.push({ date, id: WEEKLY[weekday] });
      }
    }
    if (day >= 26) events.push({ date, id: "quantum-leap", label: `Day ${day - 25} of 6` });
  }
  return events.map((event) => ({ ...event, programme: PROGRAMMES[event.id], booking: BOOKING_LINKS[event.id] ?? null }));
}

export function formatDate(date, options = { weekday: "long", day: "numeric", month: "long" }) {
  const [y, m, d] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", { ...options, timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d)));
}

// An email enquiry that names the exact event and date. It asks only for
// what we need to reply, and asks people not to share health details.
export function interestMailto(title, date, label) {
  const when = date ? `${formatDate(date)} ${date.slice(0, 4)}${label ? ` (${label})` : ""}` : "";
  const subject = `Register interest: ${title}${when ? `, ${when}` : ""}`;
  const body = [
    "Hello Sprinkle of Happiness,",
    "",
    `I'd like to hear when booking opens for ${title}${when ? ` on ${when}` : ""}.`,
    "",
    "Name:",
    "Best way to contact me:",
    "Anything that would help me take part (for example access needs):",
    "",
    "(Please don't include health details or personal history. You never need to share them to take part.)"
  ].join("\n");
  return `mailto:hello@sprinkleofhappiness.co.uk?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
