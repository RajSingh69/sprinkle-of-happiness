// Contact form. Until direct delivery is set up, the enquiry is prepared as an
// email to hello@ in the visitor's own email app; it is only sent when they
// press Send there.
//
// Direct delivery uses Web3Forms (free, 250 messages a month). Its access key
// is requested at web3forms.com with hello@sprinkleofhappiness.co.uk and is
// emailed to that inbox, so only the inbox owner can obtain it. The key is
// designed to be public in website code. Paste it below to switch the form to
// direct delivery; success is then only shown when Web3Forms confirms receipt.
import { validateEmail, validateDisplayName } from "./auth-helpers.js";

export const CONTACT_ADDRESS = "hello@sprinkleofhappiness.co.uk";
export const WEB3FORMS_ACCESS_KEY = "ea5070b0-68d5-4cb4-855d-ed28623b34e0";
export const FORM_ENDPOINT = WEB3FORMS_ACCESS_KEY ? "https://api.web3forms.com/submit" : "";
export const MESSAGE_MAX = 3000;
// Submissions faster than this are treated as automated.
const MIN_FILL_MS = 3000;

export function validateEnquiry({ name, email, topic, message, website }) {
  if (website) return { field: "website", error: "spam" };
  const nameError = validateDisplayName(name);
  if (nameError) return { field: "name", error: nameError };
  const emailError = validateEmail(email);
  if (emailError) return { field: "email", error: emailError };
  if (!topic) return { field: "topic", error: "Please choose what your message is about." };
  const text = String(message ?? "").trim();
  if (text.length < 10) return { field: "message", error: "Please write a little more so we can help (at least 10 characters)." };
  if (text.length > MESSAGE_MAX) return { field: "message", error: `Please keep your message under ${MESSAGE_MAX} characters.` };
  return null;
}

// The fields Web3Forms receives: the visitor's details plus a subject line,
// and its own empty "botcheck" spam trap.
export function deliveryPayload({ name, email, topic, message }) {
  return {
    access_key: WEB3FORMS_ACCESS_KEY,
    subject: `${topic}: message from ${String(name).trim()} (areyouasurvivor.com)`,
    from_name: "Sprinkle of Happiness website",
    name: String(name).trim(),
    email: String(email).trim(),
    topic,
    message: String(message).trim(),
    botcheck: ""
  };
}

export function enquiryMailto({ name, email, topic, message }) {
  const subject = `${topic}: message from ${String(name).trim()}`;
  const body = `${String(message).trim()}\n\n---\nName: ${String(name).trim()}\nEmail: ${String(email).trim()}\nAbout: ${topic}\nSent from the Contact page at areyouasurvivor.com`;
  return `mailto:${CONTACT_ADDRESS}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

const form = typeof document !== "undefined" ? document.querySelector("#contact-form") : null;

if (form) {
  const status = form.querySelector("#contact-status");
  const button = form.querySelector("button[type=submit]");
  const counter = form.querySelector("[data-message-count]");
  const startedAt = Date.now();
  const say = (text, tone) => { status.textContent = text; status.dataset.tone = tone; };

  // Show the explanation that matches how the form currently delivers.
  const mode = FORM_ENDPOINT ? "direct" : "mailto";
  form.querySelectorAll("[data-delivery]").forEach((el) => { el.hidden = el.dataset.delivery !== mode; });

  // Pathway links such as "Volunteering" pre-select the enquiry type.
  document.querySelectorAll("[data-enquiry]").forEach((link) => {
    link.addEventListener("click", () => {
      form.elements.topic.value = link.dataset.enquiry;
    });
  });

  form.elements.message.addEventListener("input", () => {
    counter.textContent = `${form.elements.message.value.length} / ${MESSAGE_MAX}`;
  });

  let sending = false;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    // Ignore repeat presses (or Enter) while a message is already on its way.
    if (sending) return;
    form.querySelectorAll("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));
    say("", "");
    const data = Object.fromEntries(new FormData(form));
    const problem = validateEnquiry(data);
    if (problem?.field === "website" || Date.now() - startedAt < MIN_FILL_MS) {
      // Likely automated: do nothing visible beyond a neutral message.
      say("Sorry, that didn't go through. Please wait a moment and try again.", "error");
      return;
    }
    if (problem) {
      const input = form.elements[problem.field];
      input.setAttribute("aria-invalid", "true");
      input.focus();
      say(problem.error, "error");
      return;
    }

    if (!FORM_ENDPOINT) {
      location.href = enquiryMailto(data);
      say(`Your email app should now open with your message ready to send to ${CONTACT_ADDRESS}. It's only sent when you press Send there. If nothing opened, please email us directly.`, "info");
      return;
    }

    sending = true;
    button.disabled = true;
    form.setAttribute("aria-busy", "true");
    const label = button.textContent;
    button.textContent = "Sending…";
    say("Sending your message…", "info");
    try {
      const response = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(deliveryPayload(data))
      });
      const result = await response.json().catch(() => ({}));
      // Only an explicit confirmation from the service counts as delivered.
      if (!response.ok || result.success !== true) throw new Error("not delivered");
      form.reset();
      counter.textContent = `0 / ${MESSAGE_MAX}`;
      say("Thank you. Your message has been sent and we'll reply when we can.", "success");
    } catch {
      say(`Sorry, we couldn't confirm your message was sent. Please try again in a moment, or email us at ${CONTACT_ADDRESS}.`, "error");
    } finally {
      sending = false;
      button.disabled = false;
      form.removeAttribute("aria-busy");
      button.textContent = label;
    }
  });
}
