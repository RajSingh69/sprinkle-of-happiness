# Administrator bootstrap (manual, one-time)

Admin access comes from a Firebase Authentication **custom claim** (`admin: true`). Only the Firebase Admin SDK can set it. Registering with an approved email does **not** make anyone an admin, and the website never checks email addresses to decide admin access.

The admin dashboard requires **both** the `admin` claim **and** a verified email. This is enforced by `firestore.rules` and by the page.

Approved administrators (hard-coded in `set-admin.mjs`):
- kaansingh@sprinkleofhappiness.co.uk
- rajan@s3dsystems.com

## Recommended: sign in with Google (no key file)

This avoids creating a service-account private key altogether.

1. The person registers on the site (`register.html`) and **verifies their email** using the link they receive.
2. A Firebase project owner installs the Google Cloud CLI (https://cloud.google.com/sdk/docs/install) and signs in once:
   ```bash
   gcloud auth application-default login
   gcloud auth application-default set-quota-project sprinkle-of-happiness
   ```
3. Install the tool and check the account (this makes no changes):
   ```bash
   cd _tools/admin-bootstrap
   npm install
   node set-admin.mjs check --email rajan@s3dsystems.com
   ```
4. Confirm that the printed email, UID and `Email verified: true` belong to the right person (for example, ask them to read their UID from the Firebase Console, or confirm by phone).
5. Grant admin, passing the UID you confirmed:
   ```bash
   node set-admin.mjs grant --email rajan@s3dsystems.com --uid <UID>
   ```
6. The person logs out and back in. The **Admin dashboard** link then appears on My Account.
7. Optional: `gcloud auth application-default revoke` when you have finished.

## Alternative: a service-account key

Only if the Google sign-in route is not possible. Firebase Console → Project settings → Service accounts → *Generate new private key*. Store the file **outside this repository**, then set `GOOGLE_APPLICATION_CREDENTIALS` to its path (PowerShell: `$env:GOOGLE_APPLICATION_CREDENTIALS="C:\secure\key.json"`) and run steps 3 to 6. **Delete the key**, or disable it in Google Cloud IAM, when you have finished. Never paste key contents into chat or commit them.

## Removing access

`node set-admin.mjs revoke --email <email> --uid <UID>` removes the claim and signs the person out everywhere.

The script refuses to grant if the email is not on the approved list, is unverified or disabled, or if the UID does not match.
