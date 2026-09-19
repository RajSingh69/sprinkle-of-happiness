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

document.querySelectorAll("[data-placeholder]").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    alert("This feature will be connected in a later phase of the website.");
  });
});

document.querySelectorAll("form[data-demo-form]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    alert("The frontend form is working. Email/database functionality will be connected later.");
  });
});


document.querySelectorAll("form[data-support-request]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    alert("The secure request system is being connected and is not yet available. Your request has not been sent or received. If you may act on suicidal thoughts or cannot keep yourself safe, call 999, go to A&E, or call Samaritans on 116 123.");
  });
});
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


