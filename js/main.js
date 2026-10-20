const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".nav-links");

if (menuButton && navigation) {
  menuButton.setAttribute("aria-expanded", "false");

  menuButton.addEventListener("click", () => {
    const isOpen = navigation.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
    menuButton.setAttribute(
      "aria-label",
      isOpen ? "Close navigation" : "Open navigation"
    );
  });

  navigation.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navigation.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-label", "Open navigation");
    });
  });
}




const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const revealItems = document.querySelectorAll(".reveal");

if (revealItems.length) {
  if (motionQuery.matches || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.16,
        rootMargin: "0px 0px -8% 0px"
      }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  }
}

const intro = document.querySelector("[data-site-intro]");
const introPanels = document.querySelectorAll("[data-intro-panel]");

// While the gate is open, everything behind it is inert so keyboard and
// screen-reader users stay inside the gate (which has its own support link).
const gateBackground = intro
  ? [...document.body.children].filter((el) => el !== intro && el.tagName !== "SCRIPT")
  : [];
const setGateBackgroundInert = (on) => gateBackground.forEach((el) => { el.inert = on; });
if (intro) setGateBackgroundInert(true);

function showIntroPanel(panelName) {
  introPanels.forEach((panel) => {
    const isActive = panel.dataset.introPanel === panelName;

    panel.classList.toggle("intro-panel-active", isActive);
    panel.setAttribute("aria-hidden", String(!isActive));

    if (isActive) {
      const firstButton = panel.querySelector("button");

      if (firstButton) {
        window.setTimeout(() => firstButton.focus(), 340);
      }
    }
  });
}

function enterWebsite() {
  if (!intro) {
    document.body.classList.remove("intro-active");
    return;
  }

  document.body.classList.add("dream-transition");
  intro.classList.add("intro-exiting");

  window.setTimeout(() => {
    intro.remove();
    setGateBackgroundInert(false);
    document.dispatchEvent(new CustomEvent("soh:gate-closed"));
    document.body.classList.remove("intro-active");

    const firstHeading = document.querySelector("#home-title");

    if (firstHeading) {
      firstHeading.setAttribute("tabindex", "-1");
      firstHeading.focus({ preventScroll: true });
    }
  }, motionQuery.matches ? 20 : 520);

  window.setTimeout(() => {
    document.body.classList.remove("dream-transition");
  }, motionQuery.matches ? 40 : 1150);
}

if (intro) {
  document.querySelectorAll("[data-intro-next]").forEach((button) => {
    button.addEventListener("click", () => {
      showIntroPanel(button.dataset.introNext);
    });
  });

  document.querySelectorAll("[data-intro-enter]").forEach((button) => {
    button.addEventListener("click", enterWebsite);
  });

  window.addEventListener("load", () => {
    const firstButton = intro.querySelector("button");

    if (firstButton) {
      firstButton.focus();
    }
  });
}



// Homepage welcome question: an on-page panel (not a second modal), shown once
// per browser session and dismissed with its close button or Escape.
const welcomeQuestion = document.querySelector("[data-welcome-question]");

if (welcomeQuestion) {
  const storageKey = "soh-welcome-question-dismissed";
  let dismissed = false;
  try {
    dismissed = sessionStorage.getItem(storageKey) === "1";
  } catch {
    dismissed = false;
  }

  if (!dismissed) {
    welcomeQuestion.hidden = false;

    const dismiss = () => {
      const hadFocus = welcomeQuestion.contains(document.activeElement);
      welcomeQuestion.hidden = true;
      try {
        sessionStorage.setItem(storageKey, "1");
      } catch {
        // Storage unavailable: the panel simply reappears next visit.
      }
      if (hadFocus) {
        const next = document.querySelector("#why-exist");
        if (next) {
          next.setAttribute("tabindex", "-1");
          next.focus();
        }
      }
    };

    welcomeQuestion.querySelector("[data-welcome-close]")?.addEventListener("click", dismiss);
    welcomeQuestion.addEventListener("keydown", (event) => {
      if (event.key === "Escape") dismiss();
    });
  }
}

// Entrance demo: a purely visual cursor glides to "CLICK TO SURVIVE" and
// mimics a click, so visitors can see the button is clickable. It never
// clicks anything, ignores pointer events and stops at the first interaction.
const introStartButton = intro?.querySelector("[data-intro-panel='start'] .intro-button-primary");

if (intro && introStartButton) {
  const touchOnly = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  const cursor = document.createElement("span");
  cursor.className = "intro-demo-cursor";
  cursor.setAttribute("aria-hidden", "true");
  cursor.innerHTML = '<svg viewBox="0 0 24 24" width="34" height="34"><path d="M3 2l17 9.5-7.4 1.6 4.2 7.6-3 1.6-4.2-7.6L4 20z" fill="#fff" stroke="#2b2140" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  const ripple = document.createElement("span");
  ripple.className = "intro-demo-ripple";
  ripple.setAttribute("aria-hidden", "true");
  intro.append(cursor, ripple);

  let stopped = false;
  let timer;
  const running = [];
  const sleep = (ms) => new Promise((resolve) => { timer = window.setTimeout(resolve, ms); });
  const play = (el, frames, options) => {
    const animation = el.animate(frames, { fill: "forwards", ...options });
    running.push(animation);
    return animation.finished.catch(() => {});
  };

  // Point the cursor tip just right of the button's centre.
  const targetPoint = () => {
    const r = introStartButton.getBoundingClientRect();
    return { x: r.left + r.width * 0.62, y: r.top + r.height * 0.58 };
  };

  const stopDemo = () => {
    if (stopped) return;
    stopped = true;
    window.clearTimeout(timer);
    running.forEach((animation) => animation.cancel());
    introStartButton.classList.remove("is-demo-pressed", "is-demo-hint");
    cursor.remove();
    ripple.remove();
    ["pointerdown", "keydown", "touchstart", "wheel"].forEach((type) => intro.removeEventListener(type, stopDemo, true));
    intro.removeEventListener("pointermove", onPointerMove, true);
  };

  // Ignore tiny jitters so only a real mouse movement counts as interaction.
  let firstMove = null;
  function onPointerMove(event) {
    if (event.pointerType !== "mouse") return;
    if (!firstMove) { firstMove = { x: event.clientX, y: event.clientY }; return; }
    if (Math.hypot(event.clientX - firstMove.x, event.clientY - firstMove.y) > 8) stopDemo();
  }

  ["pointerdown", "keydown", "touchstart", "wheel"].forEach((type) => intro.addEventListener(type, stopDemo, { capture: true, passive: true }));
  intro.addEventListener("pointermove", onPointerMove, { capture: true, passive: true });

  const pressButton = async (point) => {
    introStartButton.classList.add("is-demo-pressed");
    ripple.style.left = `${point.x}px`;
    ripple.style.top = `${point.y}px`;
    play(ripple, [{ opacity: 0.9, transform: "scale(0.3)" }, { opacity: 0, transform: "scale(1.6)" }], { duration: 650, easing: "ease-out" });
    await sleep(160);
    introStartButton.classList.remove("is-demo-pressed");
  };

  async function runCycle() {
    const target = targetPoint();
    if (touchOnly) {
      await pressButton({ x: target.x - introStartButton.offsetWidth * 0.12, y: target.y });
      return;
    }
    const start = {
      x: Math.min(target.x + 150, window.innerWidth - 40),
      y: Math.min(target.y + 120, window.innerHeight - 40)
    };
    const at = (p, scale = 1) => `translate(${p.x}px, ${p.y}px) scale(${scale})`;
    await play(cursor, [{ opacity: 0, transform: at(start) }, { opacity: 1, transform: at(start) }], { duration: 300 });
    if (stopped) return;
    await play(cursor, [{ opacity: 1, transform: at(start) }, { opacity: 1, transform: at(target) }], { duration: 950, easing: "cubic-bezier(.45,0,.2,1)" });
    if (stopped) return;
    await sleep(380);
    if (stopped) return;
    await play(cursor, [{ transform: at(target) }, { transform: at(target, 0.82) }], { duration: 110, easing: "ease-in" });
    pressButton(target);
    await play(cursor, [{ transform: at(target, 0.82) }, { transform: at(target) }], { duration: 160, easing: "ease-out" });
    if (stopped) return;
    await sleep(450);
    if (stopped) return;
    const away = { x: target.x + 60, y: target.y + 70 };
    await play(cursor, [{ opacity: 1, transform: at(target) }, { opacity: 0, transform: at(away) }], { duration: 600, easing: "ease-in" });
  }

  async function startDemo() {
    // Reduced motion: a static cursor resting on the button plus a soft ring.
    if (motionQuery.matches) {
      if (touchOnly) {
        introStartButton.classList.add("is-demo-hint");
        return;
      }
      const target = targetPoint();
      cursor.style.transform = `translate(${target.x}px, ${target.y}px)`;
      cursor.style.opacity = "1";
      introStartButton.classList.add("is-demo-hint");
      return;
    }
    await sleep(1000);
    while (!stopped && intro.isConnected && introStartButton.closest(".intro-panel-active")) {
      await runCycle();
      if (stopped) break;
      await sleep(6000);
    }
  }

  // The start panel goes away once the button is used, so stop with it.
  introStartButton.addEventListener("click", stopDemo);
  startDemo();
}
