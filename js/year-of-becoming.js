// Year of Becoming: turn the four season sections into tabs. Without
// JavaScript every season stays visible and the tabs are plain anchor links.
const tabs = [...document.querySelectorAll(".yob-tab")];
const panels = [...document.querySelectorAll(".yob-season")];

if (tabs.length && panels.length) {
  const nav = document.querySelector(".yob-tabs");
  nav.setAttribute("role", "tablist");

  tabs.forEach((tab) => {
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", tab.dataset.season);
  });
  panels.forEach((panel) => {
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", `tab-${panel.dataset.season}`);
    panel.setAttribute("tabindex", "0");
  });

  function select(season, focus = false) {
    tabs.forEach((tab) => {
      const on = tab.dataset.season === season;
      tab.setAttribute("aria-selected", String(on));
      tab.tabIndex = on ? 0 : -1;
      if (on && focus) tab.focus();
    });
    panels.forEach((panel) => { panel.hidden = panel.dataset.season !== season; });
    document.querySelector(".yob-journey").dataset.active = season;
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener("click", (event) => {
      event.preventDefault();
      select(tab.dataset.season);
      history.replaceState(null, "", `#${tab.dataset.season}`);
    });
    tab.addEventListener("keydown", (event) => {
      const moves = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      let next = null;
      if (event.key in moves) next = (i + moves[event.key] + tabs.length) % tabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = tabs.length - 1;
      if (next === null) return;
      event.preventDefault();
      select(tabs[next].dataset.season, true);
    });
  });

  const fromHash = location.hash.slice(1);
  select(panels.some((p) => p.dataset.season === fromHash) ? fromHash : "winter");
}
