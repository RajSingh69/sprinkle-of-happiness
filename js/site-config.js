// Account features are switched off on the public site until the Privacy,
// Terms and Safeguarding policies are approved and sign-up is enabled in the
// Firebase Console. Local development hosts can use them for testing.
const DEV_HOSTS = ["localhost", "127.0.0.1", "[::1]"];

export const ACCOUNTS_LIVE = false;

export const isDevHost = DEV_HOSTS.includes(location.hostname);

export const accountsEnabled = ACCOUNTS_LIVE || isDevHost;

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
