// Donate page. Online giving only appears when donations are switched on
// (js/site-config.js); until then the page explains how to give by email.
import { donationsEnabled } from "./site-config.js";

const status = document.querySelector("#donation-status");
const say = (message, tone = "info") => {
  status.textContent = message;
  status.dataset.tone = tone;
};

if (donationsEnabled) {
  document.querySelectorAll("[data-donations-off]").forEach((el) => { el.hidden = true; });
  document.querySelectorAll("[data-donations-on]").forEach((el) => { el.hidden = false; });

  const result = new URLSearchParams(location.search).get("donation");
  if (result === "success") {
    say("Thank you for your donation. Stripe will email you a receipt.", "success");
    status.focus();
  } else if (result === "cancelled") {
    say("Your donation was cancelled. You have not been charged.");
  }

  const billing = await import("./billing-service.js");
  const form = document.querySelector("#donate-form");
  const options = form.querySelector("[data-amount-options]");
  const custom = form.elements.custom;

  const renderAmounts = () => {
    const frequency = form.elements.frequency.value;
    const amounts = billing.DONATION_AMOUNTS[frequency];
    options.replaceChildren(...amounts.map((amount, i) => {
      const label = document.createElement("label");
      label.className = "donate-amount";
      label.innerHTML = `<input type="radio" name="amount" value="${amount}"${i === 1 ? " checked" : ""}> £${amount}${frequency === "monthly" ? "/month" : ""}`;
      return label;
    }));
    // Custom amounts are for one-off gifts only.
    form.querySelector("[data-custom-amount]").hidden = frequency === "monthly";
    custom.value = "";
  };
  form.addEventListener("change", (event) => {
    if (event.target.name === "frequency") renderAmounts();
    if (event.target.name === "amount") custom.value = "";
  });
  custom.addEventListener("input", () => {
    form.querySelectorAll('input[name="amount"]').forEach((r) => { r.checked = false; });
  });
  renderAmounts();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const frequency = form.elements.frequency.value;
    let amount = Number(form.querySelector('input[name="amount"]:checked')?.value);
    if (!amount && frequency === "once") amount = Math.round(Number(custom.value));
    if (!amount || (frequency === "once" && (amount < 3 || amount > 1000))) {
      say("Please choose an amount between £3 and £1,000.", "error");
      custom.focus();
      return;
    }
    const button = form.querySelector('button[type="submit"]');
    const label = button.textContent;
    button.disabled = true;
    button.textContent = "Opening secure checkout…";
    try {
      await billing.startDonation(frequency, amount);
    } catch (error) {
      say(billing.friendlyBillingError(error), "error");
      button.disabled = false;
      button.textContent = label;
    }
  });
}
