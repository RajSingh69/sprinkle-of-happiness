// Book a Session: show Kaan's Calendly times on this page, but only after the
// visitor asks, so nothing from Calendly loads (or sets cookies) until then.
const showButton = document.querySelector("[data-calendly-show]");
const embed = document.querySelector("#calendly-embed");
const CALENDLY_URL = "https://calendly.com/kaansingh-sprinkleofhappiness?hide_gdpr_banner=1";

if (showButton && embed) {
  showButton.addEventListener("click", () => {
    if (!embed.hidden) return;
    embed.hidden = false;
    const widget = document.createElement("div");
    widget.className = "calendly-inline-widget";
    widget.dataset.url = CALENDLY_URL;
    embed.append(widget);
    const script = document.createElement("script");
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    script.async = true;
    script.addEventListener("error", () => {
      embed.innerHTML = '<p class="form-status" data-tone="error">Calendly could not load here. Please use "Open Calendly" instead.</p>';
    });
    document.body.append(script);
    showButton.hidden = true;
    embed.setAttribute("tabindex", "-1");
    embed.focus();
  });
}
