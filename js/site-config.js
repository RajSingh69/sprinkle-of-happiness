// Free member accounts are live. Paid memberships stay off until the Stripe
// backend is deployed (see PAYMENTS_LIVE below). Local development hosts use
// the Firebase emulators unless ?production is added.
const DEV_HOSTS = ["localhost", "127.0.0.1", "[::1]"];

export const ACCOUNTS_LIVE = true;

export const isDevHost = DEV_HOSTS.includes(location.hostname);

export const accountsEnabled = ACCOUNTS_LIVE || isDevHost;

// Paid membership buttons stay hidden until the Stripe backend (Cloud
// Functions) is deployed and tested. Locally, add ?payments to a URL once to
// show them for testing against the Functions emulator.
export const PAYMENTS_LIVE = false;

function readPaymentsFlag() {
  if (!isDevHost) return false;
  try {
    if (new URLSearchParams(location.search).has("payments")) sessionStorage.setItem("soh-payments", "1");
    return sessionStorage.getItem("soh-payments") === "1";
  } catch {
    return false;
  }
}

export const paymentsEnabled = accountsEnabled && (PAYMENTS_LIVE || readPaymentsFlag());

// Local development always talks to the Firebase emulators, so testing can
// never create or change real users. Add ?production to a local URL to opt
// this browser session into the real project deliberately.
function readEmulatorFlag() {
  if (!isDevHost) return false;
  try {
    if (new URLSearchParams(location.search).has("production")) {
      sessionStorage.setItem("soh-production", "1");
    }
    return sessionStorage.getItem("soh-production") !== "1";
  } catch {
    return true;
  }
}

export const useEmulators = readEmulatorFlag();
