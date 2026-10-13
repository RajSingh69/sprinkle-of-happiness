# Administrator bootstrap (manual, one-time)

Admin access comes from a Firebase Authentication **custom claim** (`admin: true`). Only the Firebase Admin SDK can set it. Registering with an approved email does **not** make anyone an admin.

Approved administrators (hard-coded in `set-admin.mjs`):
- kaansingh@sprinkleofhappiness.co.uk
- rajan@s3dsystems.com

## Steps

1. The person registers on the site (`register.html`) and **verifies their email** using the link they receive.
2. A project owner downloads a service-account key: Firebase Console → Project settings → Service accounts → *Generate new private key*.
   **Store it outside this repository** (for example `C:\secure\soh-admin-key.json`). Never commit it.
3. Install and run the tool:
   ```bash
   cd _tools/admin-bootstrap
   npm install
   set GOOGLE_APPLICATION_CREDENTIALS=C:\secure\soh-admin-key.json   # PowerShell: $env:GOOGLE_APPLICATION_CREDENTIALS="C:\secure\soh-admin-key.json"
   node set-admin.mjs check --email rajan@s3dsystems.com
   ```
4. Confirm the printed email, UID and `Email verified: true` belong to the right person (for example, ask them to read their UID from the Firebase Console, or confirm by phone).
5. Grant, passing the UID you confirmed:
   ```bash
   node set-admin.mjs grant --email rajan@s3dsystems.com --uid <UID>
   ```
6. The person logs out and back in. The **Admin dashboard** link then appears on My Account.
7. **Delete the downloaded key file**, or disable it in Google Cloud IAM, when you have finished.

To remove access: `node set-admin.mjs revoke --email <email> --uid <UID>`. This also signs the person out everywhere.

The script refuses to grant if the email is not on the approved list, is unverified or disabled, or if the UID does not match.
