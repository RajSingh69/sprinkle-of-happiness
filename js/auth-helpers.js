// Pure helpers with no Firebase imports, so they can be unit-tested in Node.

export const DISPLAY_NAME_MAX = 60;
export const PASSWORD_MIN = 8;

export function cleanDisplayName(value) {
  return String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function validateDisplayName(value) {
  const name = cleanDisplayName(value);
  if (!name) return "Please enter a name.";
  if (name.length > DISPLAY_NAME_MAX) return `Please use ${DISPLAY_NAME_MAX} characters or fewer.`;
  return "";
}

export function validateEmail(value) {
  const email = String(value ?? "").trim();
  if (!email) return "Please enter your email address.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please enter a valid email address.";
  return "";
}

export function validatePassword(password, confirm) {
  const pw = String(password ?? "");
  if (pw.length < PASSWORD_MIN) return `Please use at least ${PASSWORD_MIN} characters.`;
  if (confirm !== undefined && pw !== String(confirm ?? "")) return "The passwords do not match.";
  return "";
}

// Map Firebase error codes to calm, non-revealing messages. Sign-in failures
// never say whether an account exists.
export function friendlyAuthError(error) {
  const code = error && typeof error === "object" ? error.code : "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "That email and password combination did not work. Please try again.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/email-already-in-use":
      return "We could not create an account with that email. If you already have one, try logging in or resetting your password.";
    case "auth/weak-password":
      return `Please choose a stronger password of at least ${PASSWORD_MIN} characters.`;
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a few minutes and try again.";
    case "auth/network-request-failed":
      return "We could not reach the server. Please check your connection and try again.";
    case "auth/operation-not-allowed":
    case "auth/admin-restricted-operation":
      return "New accounts are not open yet.";
    case "auth/user-disabled":
      return "This account is not available. Please contact us for help.";
    case "permission-denied":
      return "You do not have permission to do that.";
    default:
      return "Something went wrong. Please try again.";
  }
}
