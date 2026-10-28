// Homepage: a December preview drawn from the shared event data.
import { PROGRAMMES } from "./events-data.js";

const mount = document.querySelector("[data-december-preview]");

if (mount) {
  const week = [
    ["Mon", ["rebel-recovery", "queer-rebel-recovery"]],
    ["Tue", ["winter-blues"]],
    ["Wed", ["adhd"]],
    ["Thu", ["queer-dreams"]],
    ["Fri", ["bipolar"]],
    ["Sat", ["survivor"]],
    ["Sun", ["businesswoman"]]
  ];
  const list = document.createElement("ul");
  list.className = "home-week";
  for (const [day, ids] of week) {
    const item = document.createElement("li");
    item.dataset.colour = PROGRAMMES[ids[0]].colour;
    const name = document.createElement("span");
    name.className = "home-week-day";
    name.textContent = day;
    const link = document.createElement("a");
    link.href = `whats-on.html#${ids[0]}`;
    link.textContent = ids.map((id) => PROGRAMMES[id].title).join(" / ");
    item.append(name, link);
    if (PROGRAMMES[ids[0]].time) {
      const time = document.createElement("span");
      time.className = "home-week-time";
      time.textContent = PROGRAMMES[ids[0]].time;
      item.append(time);
    }
    list.append(item);
  }
  mount.replaceChildren(list);
}
