// What's On: December 2026 calendar and list, filters and event details.
// Everything renders from events-data.js; the static weekly schedule further
// down the page stays as the no-JavaScript fallback.
import {
  decemberEvents, PROGRAMMES, KINDS, WEEK_THEMES, VENUE_TBC, MONTH, NO_MEMBERSHIP,
  weekThemeFor, formatDate, interestMailto, isoDate
} from "./events-data.js";

const root = document.querySelector("[data-whats-on]");

if (root) {
  const allEvents = decemberEvents().map((event, index) => ({ ...event, key: `e${index}` }));
  const state = { view: "calendar", kind: "all", week: "all", selected: "2026-12-01" };

  const calendar = root.querySelector("#wo-calendar");
  const dayPanel = root.querySelector("#wo-day-panel");
  const list = root.querySelector("#wo-list");
  const count = root.querySelector("#wo-count");
  const dialog = document.querySelector("#wo-dialog");
  const dialogBody = dialog.querySelector("[data-dialog-body]");
  let opener = null;

  const el = (tag, attrs = {}, ...children) => {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (value === false || value == null) continue;
      if (key === "class") node.className = value;
      else if (key === "text") node.textContent = value;
      else if (key.startsWith("data-") || key.startsWith("aria-") || ["role", "type", "href", "id", "hidden", "tabindex", "title", "datetime"].includes(key)) node.setAttribute(key, value === true ? "" : value);
      else node[key] = value;
    }
    node.append(...children.filter((c) => c != null));
    return node;
  };

  // replaceChildren() would print "null" for optional parts that are absent.
  const fill = (node, ...children) => node.replaceChildren(...children.filter((c) => c != null));

  const visible = (event) =>
    (state.kind === "all" || event.programme.kind === state.kind || (state.kind === "special" && event.programme.kind === "launch")) &&
    (state.week === "all" || weekThemeFor(event.date)?.week === Number(state.week));

  const shortTitle = (event) => event.programme.title.replace(" & Freedom", "").replace("How to Stay Happy in the ", "").replace(": Storytelling Workshop", "").replace("To Do or To Die: She Is a Businesswoman", "To Do or To Die").replace("Official launch of Sprinkle of Happiness", "Launch day");

  function eventButton(event, className) {
    const p = event.programme;
    const label = `${p.title}${event.label ? `, ${event.label}` : ""}, ${formatDate(event.date)}${p.time ? `, ${p.time}` : ""}`;
    return el("button", { type: "button", class: className, "data-colour": p.colour, "data-key": event.key, "aria-label": `${label}. Show details` },
      el("span", { class: "chip-title", text: shortTitle(event) }),
      p.time === "7 PM" ? el("span", { class: "chip-time", text: "7 PM" }) : null);
  }

  // ---------- Calendar ----------
  function renderCalendar() {
    calendar.replaceChildren();
    const grid = el("div", { class: "cal-grid", role: "grid", "aria-label": "December 2026" });
    const head = el("div", { class: "cal-row cal-head", role: "row" });
    ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].forEach((day) =>
      head.append(el("div", { role: "columnheader", class: "cal-dayname" }, el("abbr", { title: day, text: day.slice(0, 3) }))));
    grid.append(head);

    // Weeks run Monday 30 November to Sunday 3 January.
    const start = Date.UTC(MONTH.year, MONTH.month, 1) - 1 * 86400000;
    WEEK_THEMES.forEach((theme, w) => {
      if (state.week !== "all" && Number(state.week) !== theme.week) return;
      grid.append(el("div", { class: "cal-week-label", role: "row" }, el("div", { role: "rowheader" },
        el("strong", { text: `Week ${theme.week}` }), ` · ${theme.title}`)));
      const row = el("div", { class: "cal-row", role: "row" });
      for (let d = 0; d < 7; d += 1) {
        const date = new Date(start + (w * 7 + d) * 86400000);
        const inMonth = date.getUTCMonth() === MONTH.month;
        const iso = date.toISOString().slice(0, 10);
        const dayEvents = inMonth ? allEvents.filter((e) => e.date === iso && visible(e)) : [];
        const cell = el("div", { role: "gridcell", class: `cal-day${inMonth ? "" : " is-outside"}${iso === state.selected ? " is-selected" : ""}${iso === "2026-12-01" ? " is-launch" : ""}` });
        if (inMonth) {
          const n = dayEvents.length;
          cell.append(el("button", { type: "button", class: "cal-date", "data-date": iso, "aria-pressed": String(iso === state.selected),
            "aria-label": `${formatDate(iso)}: ${n ? `${n} event${n > 1 ? "s" : ""}` : "no events"}` }, el("span", { text: String(date.getUTCDate()) })));
          const chips = el("ul", { class: "cal-events" });
          dayEvents.forEach((e) => chips.append(el("li", {}, eventButton(e, "cal-chip"))));
          const dots = el("div", { class: "cal-dots", "aria-hidden": "true" });
          dayEvents.forEach((e) => dots.append(el("span", { class: "cal-dot", "data-colour": e.programme.colour })));
          cell.append(chips, dots);
        } else {
          cell.append(el("span", { class: "cal-date-out", "aria-hidden": "true", text: String(date.getUTCDate()) }));
        }
        row.append(cell);
      }
      grid.append(row);
    });
    calendar.append(grid);
    renderDayPanel();
  }

  function renderDayPanel() {
    const dayEvents = allEvents.filter((e) => e.date === state.selected && visible(e));
    const theme = weekThemeFor(state.selected);
    fill(dayPanel,
      el("h3", { class: "day-panel-title", text: formatDate(state.selected) }),
      theme ? el("p", { class: "day-panel-theme", text: `Year of Becoming · Week ${theme.week}: ${theme.title}` }) : null,
      theme ? el("p", { class: "reflection-question" }, el("span", { class: "visually-hidden", text: "This week's reflection: " }), `“${theme.question}”`) : null,
      dayEvents.length
        ? el("ul", { class: "day-panel-list" }, ...dayEvents.map((e) => el("li", {}, card(e))))
        : el("p", { class: "day-panel-empty", text: "Nothing listed on this day for the current filters." })
    );
  }

  // ---------- List ----------
  function card(event) {
    const p = event.programme;
    return el("article", { class: "wo-card", "data-colour": p.colour },
      el("p", { class: "wo-card-kind", text: KINDS[p.kind].label }),
      el("h4", { class: "wo-card-title", text: p.title }),
      el("p", { class: "wo-card-when" },
        el("time", { datetime: event.date, text: formatDate(event.date) }),
        p.time ? ` · ${p.time}` : " · Time to be confirmed",
        event.label ? ` · ${event.label}` : ""),
      el("p", { class: "wo-card-summary", text: p.summary }),
      el("p", { class: "wo-card-price", text: `${p.price} ${NO_MEMBERSHIP}.` }),
      el("p", { class: `booking-pill ${event.booking ? "is-open" : "is-soon"}`, text: event.booking ? `Booking open on ${event.booking.provider}` : "Booking not open yet" }),
      el("button", { type: "button", class: "btn btn-secondary wo-card-more", "data-key": event.key, "aria-label": `Details: ${p.title}, ${formatDate(event.date)}` }, "Details"));
  }

  function renderList() {
    list.replaceChildren();
    WEEK_THEMES.forEach((theme) => {
      if (state.week !== "all" && Number(state.week) !== theme.week) return;
      const weekEvents = allEvents.filter((e) => weekThemeFor(e.date)?.week === theme.week && visible(e));
      if (!weekEvents.length) return;
      const endDay = theme.end > isoDate(31) ? "31 December" : formatDate(theme.end, { day: "numeric", month: "long" });
      list.append(el("section", { class: "wo-week", "aria-label": `Week ${theme.week}: ${theme.title}` },
        el("h3", { class: "wo-week-title" }, el("span", { class: "wo-week-num", text: `Week ${theme.week}` }), ` ${theme.title}`,
          el("span", { class: "wo-week-dates", text: ` ${formatDate(theme.start, { day: "numeric", month: "long" })} to ${endDay}` })),
        el("p", { class: "reflection-question" }, el("span", { class: "visually-hidden", text: "This week's reflection: " }), `“${theme.question}”`),
        el("ul", { class: "wo-week-list" }, ...weekEvents.map((e) => el("li", {}, card(e))))));
    });
    if (!list.children.length) list.append(el("p", { class: "day-panel-empty", text: "No events match these filters." }));
  }

  // ---------- Details dialog ----------
  function openDetails(key, trigger) {
    const event = allEvents.find((e) => e.key === key);
    if (!event) return;
    const p = event.programme;
    const theme = weekThemeFor(event.date);
    dialog.dataset.colour = p.colour;
    fill(dialogBody,
      el("p", { class: "wo-dialog-kind", text: KINDS[p.kind].label }),
      el("h2", { id: "wo-dialog-title", class: "wo-dialog-title", text: p.title }),
      el("p", { class: "wo-dialog-summary", text: p.summary }),
      ...p.details.map((text) => el("p", { text })),
      p.framework ? el("div", { class: "rebel-framework" },
        el("p", { class: "rebel-label", text: "The R.E.B.E.L. framework" }),
        el("ol", { class: "rebel-list" }, ...p.framework.map((word) => el("li", {}, el("strong", { text: word[0] }), word.slice(1))))) : null,
      el("dl", { class: "wo-dialog-facts" },
        fact("Date", `${formatDate(event.date)}${event.label ? ` (${event.label})` : ""}`),
        fact("How often", p.when),
        fact("Time", p.time ?? "Time to be confirmed"),
        fact("Where", VENUE_TBC),
        fact("Who it's for", p.audience),
        fact("Price", `${p.price} ${NO_MEMBERSHIP}.`),
        theme ? fact("Year of Becoming", `Week ${theme.week}: ${theme.title}`) : null),
      theme ? el("p", { class: "reflection-question" }, el("span", { class: "visually-hidden", text: "This week's reflection: " }), `“${theme.question}”`) : null,
      bookingBlock(event),
      el("p", { class: "wo-dialog-safety" }, "A community, peer-led space: not therapy, clinical treatment or crisis support. If you need help now, see ", el("a", { href: "support.html", text: "Need Support?" }), ".")
    );
    opener = trigger;
    dialog.showModal();
    dialog.querySelector(".wo-dialog-close").focus();
  }

  // A real registration link only appears once Kaan has confirmed one for this
  // programme; until then the status says so plainly and offers an enquiry.
  function bookingBlock(event) {
    const p = event.programme;
    const about = p.page ? el("a", { class: "btn btn-secondary", href: p.page }, "About this programme") : null;
    if (event.booking) {
      return el("div", { class: "wo-dialog-booking" },
        el("p", { class: "booking-pill is-open", text: `Booking open on ${event.booking.provider}` }),
        el("p", { text: `You'll register with ${event.booking.provider}. Your place is confirmed when they email you.` }),
        el("div", { class: "actions" },
          el("a", { class: "btn", href: event.booking.url, rel: "noopener", target: "_blank" }, `Register on ${event.booking.provider}`, el("span", { class: "visually-hidden", text: " (opens in a new tab)" })),
          about));
    }
    return el("div", { class: "wo-dialog-booking" },
      el("p", { class: "booking-pill is-soon", text: "Booking not open yet" }),
      el("p", {}, "Times, venue and booking are still being confirmed. Send us an email and we'll tell you when booking opens. ",
        el("strong", { text: "An email isn't a booked place." })),
      el("div", { class: "actions" },
        el("a", { class: "btn", href: interestMailto(p.title, event.date, event.label) }, "Email to register interest"),
        about));
  }

  function fact(term, value) {
    return el("div", {}, el("dt", { text: term }), el("dd", { text: value }));
  }

  dialog.querySelector(".wo-dialog-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener("close", () => { opener?.focus(); opener = null; });

  // ---------- Controls ----------
  function render() {
    root.dataset.view = state.view;
    calendar.hidden = state.view !== "calendar";
    dayPanel.hidden = state.view !== "calendar";
    list.hidden = state.view !== "list";
    root.querySelectorAll("[data-view]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === state.view)));
    root.querySelectorAll("[data-kind]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.kind === state.kind)));
    if (state.view === "calendar") renderCalendar(); else renderList();
    const n = allEvents.filter(visible).length;
    count.textContent = `Showing ${n} event${n === 1 ? "" : "s"}.`;
  }

  root.addEventListener("click", (event) => {
    const target = event.target.closest("button");
    if (!target || !root.contains(target)) return;
    if (target.dataset.view) { state.view = target.dataset.view; render(); }
    else if (target.dataset.kind) { state.kind = target.dataset.kind; render(); }
    else if (target.dataset.date) {
      state.selected = target.dataset.date;
      renderCalendar();
      calendar.querySelector(`[data-date="${state.selected}"]`)?.focus();
      if (window.matchMedia("(max-width: 700px)").matches) dayPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } else if (target.dataset.key) openDetails(target.dataset.key, target);
  });

  root.querySelector("#wo-week").addEventListener("change", (event) => {
    state.week = event.target.value;
    if (state.week !== "all") {
      const theme = WEEK_THEMES.find((w) => w.week === Number(state.week));
      state.selected = theme.start;
    }
    render();
  });

  // Links such as whats-on.html#adhd open that programme's first date.
  function openFromHash() {
    const id = location.hash.slice(1);
    const first = PROGRAMMES[id] && allEvents.find((e) => e.id === id);
    if (!first) return;
    Object.assign(state, { view: "calendar", kind: "all", week: "all", selected: first.date });
    root.querySelector("#wo-week").value = "all";
    render();
    root.scrollIntoView({ block: "start" });
    openDetails(first.key, calendar.querySelector(`[data-key="${first.key}"]`) ?? root.querySelector("[data-view]"));
  }

  root.hidden = false;
  render();
  openFromHash();
  window.addEventListener("hashchange", openFromHash);
}
