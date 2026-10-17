# Stripe membership backend (Cloud Functions)

Region: `europe-west2` (London). Code: `index.js` (wiring) and `src/billing.js` (logic). Tests: `npm test` (Firestore emulator and a fake Stripe client).

| Function | Type | Purpose |
|---|---|---|
| `createCheckoutSession` | Callable (logged-in, verified) | Creates a Stripe Checkout Session (subscription mode) for an allowlisted tier |
| `createPortalSession` | Callable (logged-in, verified) | Opens the Stripe Customer Portal (change plan, update card, cancel) |
| `stripeWebhook` | HTTPS (Stripe only, signature-checked) | Records subscription state in `subscriptions/{uid}` and `users/{uid}.membershipTier` |
| `cleanUpDeletedUser` | Auth trigger | When a login is deleted anywhere, cancels live subscriptions, deletes the Stripe customer and removes billing data |

Secrets (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) live only in Firebase Secret Manager. **Never commit them.** For local emulator runs, put them in `functions/.secret.local` (git-ignored). Price IDs and `SITE_URL` are non-secret and live in `functions/.env`.

## 1. One-time setup
1. **Blaze plan:** Firebase Console → Usage and billing → upgrade `sprinkle-of-happiness` to Blaze (pay as you go; Cloud Functions requires it). Set a **budget alert** in Google Cloud Billing, for example £10 per month.
2. **Test-mode prices:** in the Stripe Dashboard (**Test mode**), create Spark £27, Glow £97 and Radiance £497 as monthly GBP recurring prices. Test and live price IDs differ, so put the test IDs in `functions/.env.sprinkle-of-happiness` while testing (it overrides `.env`).
3. **Customer Portal:** Stripe Dashboard → Settings → Billing → Customer portal. Enable cancellation (at period end), payment method updates and invoice history, and allow switching between the three products for upgrades and downgrades. Add the business details and links to the approved Terms and Privacy Policy.
4. **Failed payments:** Settings → Billing → Subscriptions and emails → set retries, then "mark subscription as unpaid" or "cancel" after the final retry. Paid benefits stop at `unpaid` or `canceled`; `past_due` is a short grace period.

## 2. Deploy (test mode)
```bash
firebase functions:secrets:set STRIPE_SECRET_KEY --project sprinkle-of-happiness       # paste sk_test_...
firebase deploy --only functions --project sprinkle-of-happiness
```
Then in Stripe (**Test mode**) → Developers → Webhooks → Add endpoint:
- URL: `https://europe-west2-sprinkle-of-happiness.cloudfunctions.net/stripeWebhook`
- Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `customer.subscription.paused`, `customer.subscription.resumed`, `invoice.paid`, `invoice.payment_failed`, `charge.refunded`

Copy the endpoint's signing secret, then run:
```bash
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET --project sprinkle-of-happiness   # paste whsec_...
firebase deploy --only functions --project sprinkle-of-happiness
firebase deploy --only firestore:rules --project sprinkle-of-happiness
```

## 3. Test-mode validation (before any real payment)
Locally, with `ACCOUNTS_LIVE = false`, open `http://localhost:8080/membership.html?payments&production` (uses the real project; test-mode keys only) or deploy behind the flag.
- Card `4242 4242 4242 4242`: subscribe to Spark. The dashboard shows Spark · Active · Renews on…
- Portal: upgrade to Glow; then cancel at period end ("Membership ends on…"); then cancel immediately in the Stripe Dashboard (the member returns to Free).
- Card `4000 0000 0000 0341` (attaches, then fails): past_due, then unpaid, after retries.
- Stripe Dashboard → resend a webhook event: the duplicate is ignored (logs "Duplicate event ignored").
- Delete a test account from Firebase Auth: its test subscription is cancelled in Stripe.

## 4. Production activation (only after approval)
1. Approved Privacy Policy, Terms (including subscription, cancellation and refund terms) and Safeguarding Policy are published.
2. Stripe account activated (business details, bank account). Create **live** prices and put their IDs in `.env.sprinkle-of-happiness`.
3. Set the live `STRIPE_SECRET_KEY` (restricted key recommended), create the live webhook endpoint, set the live `STRIPE_WEBHOOK_SECRET`, then redeploy functions.
4. Set `ACCOUNTS_LIVE = true` and `PAYMENTS_LIVE = true` in `js/site-config.js`, commit and push.
5. Make one small live purchase and refund it, then check the dashboard, admin view and portal.
