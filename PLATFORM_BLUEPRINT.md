# Sprinkle of Happiness Platform Blueprint

Phase 9 document-only product and technical specification for the future Sprinkle of Happiness platform.

This blueprint is based on the current static website in `C:\Users\rajan\SprinkleOfHappinessWebsite`. It must not be treated as an implementation. No backend, Firebase, Stripe, authentication, email provider, admin dashboard, or database has been built in this phase.

## 1. Current Website Context

The current site is a static HTML/CSS/JavaScript website with these public areas:

- Intro / survivor gate on the homepage.
- Home: dreamland journey through survival, expression, connection, hope and joy.
- About: vision, mission, who is welcomed, whole-person ethos.
- Meet Kaan: founder story, creativity, spirituality, values, founder note.
- Our Values: Sikh-inspired values, Five Thieves, Five Values, lived values.
- Experiences: landing page for Workshops, Circles, Walks and Yoga.
- Workshops: four future workshop concepts.
- Circles: five future circle concepts.
- Walks: two future walk concepts.
- Yoga: future daily yoga, curriculum, kit, teachers, learning pathways and booking placeholders.
- Community: belonging, volunteering, collaboration, future membership, support pathways.
- Need Support: suicide-prevention information, urgent support, faith/compassion framing, bereavement, worried-about-someone guidance.
- Let's Get a Coffee: high-sensitivity support request pathway for one-to-one conversation with Kaan.
- Contact: general enquiries, collaboration, volunteering, programmes and Yoga questions.

Current dynamic behavior is intentionally minimal:

- `data-placeholder` links show a frontend alert.
- `data-demo-form` contact form shows a frontend alert.
- `data-support-request` Coffee form shows a frontend alert and does not submit data.
- Reveal animations and mobile navigation are handled by `js/main.js`.

Future platform work should preserve the static site as the public content layer unless and until a CMS is deliberately chosen.

## 2. Future Platform Objective

The future platform may support user accounts, member profiles, optional membership, events, yoga classes, workshops, circles, walks, community events, bookings, capacity management, Stripe payments, yoga kit purchases, donations, transactional emails, newsletters, communication preferences, admin tools, teacher/facilitator management, and privacy/consent records.

The near-term objective should be smaller: allow people to create accounts and book a limited set of real activities safely.

## 3. Proposed Technology Architecture

### Frontend

Use the existing static HTML/CSS/JavaScript website initially. Add dynamic account, booking and dashboard areas incrementally rather than replacing the whole site.

Possible future approaches:

- Keep public pages static and add dynamic pages for account/admin flows.
- Use Firebase client SDK only for authentication/session-aware UI and reads allowed by security rules.
- Keep payment, privileged writes and sensitive workflows server-authoritative through Cloud Functions.

### Authentication

Use Firebase Authentication for email/password sign-up, email verification, password reset and session management. Additional providers such as Google sign-in should be a later business decision.

### Database

Use Cloud Firestore for users, profiles, public event records, bookings, membership status references, payment references, facilitators, products/orders, donations, consent and preference records.

### Server Logic

Use Firebase Cloud Functions where trust boundaries matter: Stripe Checkout session creation, Stripe webhooks, booking capacity transactions, paid booking confirmation, refunds/cancellations, transactional email, and privileged admin operations.

### Payments

Use Stripe for event/class payments, membership subscriptions, yoga kit purchases and donations. Never store card numbers or sensitive payment-card details in Firestore. Store Stripe references and reconciled statuses only.

### Email

Email provider is to be selected later. Do not assume Mailchimp.

Transactional provider requirements: reliable API, sender/domain verification, templates, delivery logs, webhook/delivery status if needed, and ability to send account and booking emails independently of marketing consent.

Marketing/newsletter requirements: consent-aware subscriber management, unsubscribe handling, campaign templates, basic reporting, and strong separation from sensitive support-request data.

One provider could handle both transactional and marketing email if it meets requirements. Separation may be preferable if marketing needs grow.

### Hosting

Consider the existing hosting arrangement. Static public pages can remain on the current host if compatible with Firebase-backed dynamic functionality, or hosting can later be consolidated. Decision required before implementation.

## 4. Proposed Role Model

Keep roles simple and explicit. Do not overbuild RBAC.

### Visitor

Permissions: view public pages and published public event summaries, submit public forms if implemented, and start account sign-up.

Prohibited actions: book account-required events without signing in, access member/admin dashboards, or view private attendee/member/support data.

### Registered User / Member

Membership is optional. A registered user may or may not have an active membership.

Permissions: manage profile, manage email preferences, book eligible events, view own bookings/orders, cancel own bookings where policy allows, purchase membership/events/kit/donations when implemented, request account deletion.

Dashboard areas: Overview, My Bookings, Upcoming, Past Activities, Membership, Orders, Email Preferences, Profile, Account / Privacy.

Prohibited actions: grant themselves roles, mark themselves paid, alter booking confirmation, alter attendance/refund status, read other users' data.

### Teacher / Facilitator

A facilitator can support Yoga, workshops, circles, walks or community events.

Permissions, depending on policy: view assigned events, view attendee lists for assigned events if needed, record attendance if allowed, view access notes only if necessary and policy-approved, maintain own public profile if later enabled.

Prohibited actions: access all members by default, access Coffee/support requests unless explicitly assigned by policy, manage payments/refunds/memberships/admin roles, publish/cancel events unless permitted.

### Admin

Permissions: create/edit/publish/cancel events, manage bookings and attendees, assign facilitators, view members as operationally required, manage products/orders, view donation/payment references, trigger refunds through approved server-side flows, and manage communications if assigned.

Dashboard areas: Dashboard, Events, Bookings, Members, Teachers / Facilitators, Memberships, Payments, Orders / Yoga Kit, Donations, Communications, policy/content settings where genuinely needed.

### Super Admin

Only needed if role changes must be restricted beyond normal admin access. Can manage admin/facilitator roles, platform settings and audit logs. Defer if unnecessary.

## 5. Account Lifecycle

Recommended flow:

1. Visitor chooses to sign up.
2. User creates account with email/password.
3. Firebase sends email verification.
4. User verifies email.
5. User completes minimal profile.
6. User may optionally purchase or activate membership if membership exists.
7. User books eligible activities.
8. User manages bookings.
9. User manages email preferences.
10. User may request account deletion.

Required account features: sign up, login, logout, forgot password, email verification, profile update, marketing preferences, account deletion request.

Do not make membership mandatory unless Kaan later confirms it.

## 6. Membership Model

Membership is not yet defined. The data architecture should support no membership, free membership, paid recurring membership, multiple membership products later, and event requirements or discounts if later decided.

Do not invent plans, prices or benefits.

Possible membership fields:

- `membershipId`
- `userId`
- `type`: `FREE`, `PAID_RECURRING`, `MANUAL`, `TRIAL` if needed.
- `status`: `NONE`, `PENDING`, `ACTIVE`, `PAST_DUE`, `CANCELLED`, `EXPIRED`.
- `productId`
- `stripeCustomerId`
- `stripeSubscriptionId`
- `currentPeriodStart`
- `currentPeriodEnd`
- `cancelAtPeriodEnd`
- `createdAt`
- `updatedAt`
- `adminNote` only if operationally needed.

DECISION REQUIRED: what membership is, whether it is free or paid, monthly/yearly pricing, benefits, whether it is required for anything, renewal and cancellation rules.

## 7. Unified Event Model

Use one reusable event model for Yoga classes, workshops, circles, walks, community events and other future events. Avoid separate incompatible booking systems.

Suggested `events` fields:

- `eventId`
- `type`: `YOGA_CLASS`, `WORKSHOP`, `CIRCLE`, `WALK`, `COMMUNITY_EVENT`, `OTHER`.
- `categorySlug`: `yoga`, `workshops`, `circles`, `walks`, etc.
- `title`, `slug`, `shortDescription`, `longDescription`, `themes`.
- `facilitatorIds`.
- `locationType`: `IN_PERSON`, `ONLINE`, `HYBRID`, `TBC`.
- `venueName`, `addressSummary`, private `onlineMeetingInstructions` if needed.
- `timezone`: default `Europe/London`.
- `startAt`, `endAt` as timestamps.
- `arrivalInstructions`.
- `capacity`.
- Server-controlled reserved/confirmed count or derived aggregate.
- `waitlistEnabled`.
- `bookingOpenAt`, `bookingCloseAt`.
- `priceModel`: `FREE`, `FIXED`, `PAY_WHAT_YOU_CAN`, `MEMBER_INCLUDED`.
- `priceAmount`, `currency`, `suggestedAmounts`, `minimumAmount` where relevant.
- `membershipRequirement`: `NONE`, `ACTIVE_MEMBER`, `MEMBER_DISCOUNT` if later required.
- `accessibilityInformation`, `whatToBring`.
- Yoga fields: `kitRequirement`, `houseRulesAcknowledgementRequired`.
- `cancellationPolicyId`.
- `status`.
- `publiclyListed`.
- `createdBy`, `createdAt`, `updatedAt`.

Avoid collecting health or diagnostic information as part of event records.

## 8. Event Status

Recommended stored statuses:

- `DRAFT`: admin is preparing; not visible publicly.
- `PUBLISHED`: visible publicly, but booking may not be open yet.
- `CANCELLED`: event cancelled.
- `COMPLETED`: event has happened and attendance can be finalized.
- `ARCHIVED`: hidden from normal admin lists but retained.

Derived states, not necessarily stored:

- `BOOKING_OPEN`: derived from status, booking window and capacity.
- `FULL`: derived from capacity and confirmed/waitlisted counts.
- `BOOKING_CLOSED`: derived from booking close date or status.

Store less, derive more where reliable. Store only statuses that represent admin intent or operational lifecycle.

## 9. Booking Model

Suggested `bookings` fields:

- `bookingId`
- `eventId`
- `userId`
- `status`
- `quantity`: usually 1 at MVP.
- `createdAt`, `updatedAt`, `confirmedAt`, `cancelledAt`, `cancelledBy`.
- `paymentRequired`.
- `paymentId`.
- `stripeCheckoutSessionId`.
- `priceModelSnapshot`, `amountDueSnapshot`, `currencySnapshot`.
- `attendanceStatus`: `NOT_RECORDED`, `ATTENDED`, `NO_SHOW`.
- `accessNote`: optional, privacy-reviewed.
- `adminNote`: private admin-only operational note.

Recommended booking statuses:

- `PENDING`: booking intent created, payment or admin action pending.
- `CONFIRMED`: place secured.
- `WAITLISTED`: no confirmed space; waiting for promotion.
- `CANCELLED_BY_USER`
- `CANCELLED_BY_ADMIN`
- `REFUNDED`: only if payment refund completed or recorded.
- `EXPIRED`: pending payment/session expired.

Attendance should be separate from booking status through `attendanceStatus`.

Rules:

- Prevent duplicate active bookings for the same user/event.
- Enforce capacity server-side with transactions.
- Admins may manually add attendees where appropriate, still respecting capacity unless overriding with explicit reason.
- Free bookings should not use Stripe.
- Paid bookings are confirmed only after server-side Stripe webhook verification.

## 10. Capacity Logic

Do not rely on the frontend reading “8 spaces remaining” and then writing a booking. Concurrent users could overbook.

Safe conceptual flow:

1. User requests booking.
2. Server-side function starts a transaction.
3. Transaction reads event capacity and confirmed count/counter.
4. Transaction checks duplicate active booking.
5. If capacity is available, create booking or booking intent and update server-controlled count.
6. If full and waitlist enabled, create waitlisted booking.
7. If full and no waitlist, return a full response.

For paid events, capacity handling needs extra care because checkout may take time. Recommended approach: short-lived `PENDING` booking reservation with expiry. Expired reservations release capacity through scheduled cleanup or during new booking attempts.

## 11. Free Events

Free event flow:

1. User signs in.
2. User clicks book.
3. Server checks event status, booking window, eligibility, duplicate booking and capacity.
4. Server creates `CONFIRMED` booking.
5. Confirmation email is queued/sent.
6. User sees booking in dashboard.

A true zero-price event should not go through Stripe unnecessarily.

## 12. Paid Events

Paid event flow:

1. User signs in.
2. Server creates booking intent or pending reservation.
3. Server creates Stripe Checkout Session.
4. User pays through Stripe.
5. Stripe redirects user, but redirect alone is not trusted.
6. Stripe webhook confirms successful payment server-side.
7. Server updates payment and booking to confirmed.
8. Confirmation email is queued/sent.

Never trust frontend success redirects as proof of payment.

## 13. Pay-What-You-Can

Potential price models:

- `FREE`: no payment.
- `FIXED`: fixed amount.
- `PAY_WHAT_YOU_CAN`: user chooses amount within configured rules.
- `MEMBER_INCLUDED`: included for eligible active members.

PWYC decisions required:

- Is there a minimum amount?
- Are suggested amounts shown?
- Can users enter zero?
- Is PWYC available to all users or only specific events?
- Does Stripe process PWYC amounts over zero only?

## 14. Stripe Architecture

Payment purposes should be explicit:

- `EVENT_BOOKING`
- `MEMBERSHIP_SUBSCRIPTION`
- `KIT_ORDER`
- `DONATION_ONE_OFF`
- `DONATION_RECURRING`

Suggested `payments` fields:

- `paymentId`
- `purpose`
- `userId`
- `relatedType`: `booking`, `membership`, `order`, `donation`.
- `relatedId`
- `stripeCustomerId`
- `stripeCheckoutSessionId`
- `stripePaymentIntentId`
- `stripeSubscriptionId`
- `amount`
- `currency`
- `status`: `PENDING`, `SUCCEEDED`, `FAILED`, `EXPIRED`, `REFUNDED`, `PARTIALLY_REFUNDED`.
- `createdAt`, `updatedAt`.

Store useful references and statuses, not full Stripe payloads.

## 15. Stripe Customer IDs

Storing `stripeCustomerId` against a user can help reuse customer identity, link subscriptions/payments, improve reconciliation and support a Stripe customer portal later.

Risks/requirements:

- Users must not alter it directly.
- Do not store card details in Firestore.
- Handle users without Stripe customers until first paid action.
- Handle duplicate customer cleanup operationally.

## 16. Stripe Webhooks

Useful webhook concepts:

- Checkout session completed: confirm paid booking/order/donation or start membership handling.
- Checkout session expired: expire pending booking/order intent and release reservation.
- Payment failed: mark payment failed; notify user if needed.
- Subscription created/updated/deleted: update membership status.
- Invoice paid/payment failed: maintain recurring membership status.
- Refund updated: record refund status and update related booking/order/donation.

Webhook handlers must be idempotent. The same Stripe event can arrive more than once. Processing twice must not create duplicate bookings, duplicate orders, duplicate donation records or extend membership twice.

Use a `webhookEvents` collection to record processed Stripe event IDs.

## 17. Donations

Donation architecture should be separate from event bookings.

Possible donation types:

- One-off donation.
- Recurring donation.

Suggested `donations` fields:

- `donationId`
- `userId`: optional for guest donations if allowed.
- `donorEmail`
- `amount`, `currency`
- `recurring`
- `stripeCustomerId`, `stripeCheckoutSessionId`, `stripePaymentIntentId`, `stripeSubscriptionId`
- `status`
- `message`: optional; avoid sensitive information.
- `createdAt`

DECISION REQUIRED: suggested amounts, one-off or recurring, guest donations, Gift Aid eligibility, donation messaging and receipts. Do not assume Gift Aid.

## 18. Yoga Kit Store

Keep the store small and practical.

Suggested collections:

- `products`
- `productVariants`
- `orders`
- `orderItems`

Product fields: `productId`, `name`, `description`, `category`, `active`, `publiclyListed`, `createdAt`, `updatedAt`.

Variant fields: `variantId`, `productId`, `size`, `color`, `price`, `currency`, `stockQuantity`, `active`.

Order fields: `orderId`, `userId`, `status`, `fulfillmentMethod`, `paymentId`, `createdAt`, `updatedAt`.

Borrowing kit is operationally different from buying kit.

DECISION REQUIRED: manual venue borrowing or digital reservation, deposits, sizes/products, stock, collection/delivery and returns. MVP recommendation: handle borrowing manually until operational rules are clear.

## 19. Member Dashboard

Recommended sections:

- Overview: next booking, membership status, important notices.
- My Bookings: upcoming, waitlisted, cancelled.
- Past Activities: completed/attended events.
- Membership: current status, renewal/cancellation if implemented.
- Orders: Yoga kit purchases.
- Email Preferences: transactional explanation and marketing consent controls.
- Profile: name, contact details, minimal preferences.
- Account / Privacy: password reset, data export/request, account deletion request.

Do not add social-network features.

## 20. Admin Dashboard

Recommended sections:

- Dashboard.
- Events.
- Bookings.
- Members.
- Teachers / Facilitators.
- Memberships.
- Payments.
- Orders / Yoga Kit.
- Donations.
- Communications.
- Policy/content settings only where needed.

Admin dashboard home should show operational information: upcoming events, bookings this week, events nearing capacity, cancelled events needing communication, new members, payment issues and outstanding operational tasks. Avoid vanity metrics.

## 21. Event Management Workflow

Admin flow:

1. Create event in draft.
2. Choose event type.
3. Add title, description, date/time, timezone and location.
4. Assign facilitator(s).
5. Add capacity.
6. Add accessibility information and what to bring.
7. Set price model and membership requirement.
8. Add booking window.
9. Review policy acknowledgements if needed.
10. Publish event.
11. Monitor bookings and capacity.
12. View attendees.
13. Manually add attendee where appropriate.
14. Record attendance after event.
15. Cancel event if needed and trigger communications/refunds according to policy.

## 22. Facilitator Model

Use one facilitator model for Yoga teachers, workshop facilitators, circle facilitators and walk leaders.

Suggested `facilitators` fields:

- `facilitatorId`
- `userId`: optional if they have a login.
- `name`
- `photoPath`
- `shortBio`
- `longBio`
- `roles`: `YOGA_TEACHER`, `WORKSHOP_FACILITATOR`, `CIRCLE_FACILITATOR`, `WALK_LEADER`.
- `areasOfPractice`
- `publicProfile`
- `active`
- `createdAt`, `updatedAt`

Do not invent credentials. Only publish credentials supplied and verified.

## 23. Email Categories

### Transactional Email

Can be sent regardless of marketing consent where necessary for service delivery: verify email, welcome/account email, booking confirmation, booking cancellation, event changed, event cancelled, event reminder, waitlist promoted, payment receipt/status, membership status and account deletion confirmation.

### Marketing Email

Requires explicit consent: monthly newsletter, new workshops, upcoming events, community updates and fundraising/donation campaigns where legally marketing.

Do not automatically subscribe users merely because they create an account or book an event.

## 24. Marketing Consent Model

Suggested user preference fields:

- `marketingEmailConsent`
- `marketingConsentAt`
- `marketingConsentSource`
- `marketingConsentVersion`
- `marketingUnsubscribedAt`
- `marketingSuppressed`

Keep marketing consent separate from terms/privacy acceptance.

## 25. Privacy / Consent Records

Do not use `gdprAccepted = true` as the whole privacy model.

Suggested fields:

- `termsAcceptedAt`
- `termsVersion`
- `privacyNoticeAcceptedAt` or `privacyNoticeVersionSeen`
- `privacyNoticeVersion`
- `marketingEmailConsent`
- `marketingConsentAt`
- `marketingConsentVersion`
- `accountDeletionRequestedAt`

For important policy changes, record the version accepted or acknowledged.

## 26. Data Minimisation

Sprinkle discusses trauma, suicide, mental health, ADHD, bipolar experiences, psychosis, depression and anxiety. The platform should not collect detailed health or diagnostic information merely because the topics exist.

Collect minimum data needed for account identity, booking operation, payment reconciliation, event communication and access support if specifically requested and reviewed.

Avoid default fields for diagnoses, trauma history, medication, detailed suicide/self-harm descriptions or clinical notes. Any sensitive-data collection must be explicitly reviewed before implementation.

## 27. Coffee / Support Data

The Coffee support request pathway is HIGH PRIVACY SENSITIVITY.

Current form includes name, preferred contact method, contact details, availability, brief support note, talk/walk preference and required acknowledgement that it is not an emergency service.

Future handling principles:

- Keep Coffee requests separate from event bookings, marketing profiles and public member profiles.
- Do not feed support-note text into newsletter systems.
- Do not display support requests broadly in admin dashboards.
- Limit read access to explicitly authorized people.
- Prefer short retention unless policy/legal/safeguarding needs require otherwise.
- Do not design a clinical case-management system.
- Continue warning users not to submit detailed methods or graphic self-harm information.

Possible `supportRequests` fields:

- `supportRequestId`
- `userId`: optional.
- `name`
- `contactMethod`
- `contactDetails`
- `availability`
- `briefNote`
- `preference`
- `acknowledgedNotEmergency`
- `status`: `NEW`, `ACKNOWLEDGED`, `CONTACTED`, `CLOSED`.
- `assignedTo`
- `createdAt`, `closedAt`

Policy required before implementation.

## 28. Contact Form Data

General contact enquiries may not need permanent Firestore storage.

Preferred minimal architecture:

1. User submits general contact form.
2. Server validates and sends email/admin notification.
3. Store only short-lived delivery/log metadata unless operational tracking is required.

If a database record is needed, use retention rules and avoid collecting sensitive content unnecessarily.

## 29. Safeguarding

Safeguarding is POLICY REQUIRED BEFORE FULL PLATFORM LAUNCH.

Safeguarding may affect Coffee/support request triage, event participation, incident handling, facilitator responsibilities, admin access to sensitive notes, data retention for concerning messages/incidents, and urgent-risk disclosures.

Do not invent a safeguarding policy in code. Obtain and approve policy first.

## 30. Policies Required

Before full launch, prepare or approve:

- Privacy Notice.
- Terms of Use.
- Booking Terms.
- Cancellation / Refund Policy.
- Safeguarding Policy.
- Cookie information if applicable.
- Marketing consent wording.
- Membership terms once membership exists.
- Yoga kit purchase/returns terms if sold online.
- Facilitator/admin data access policy.
- Support request handling and retention policy.

## 31. Firestore Collection Plan

### `users`

Purpose: account profile and preferences.

Key fields: `uid`, `email`, `displayName`, `phone`, `createdAt`, `updatedAt`, `emailVerified`, server-controlled `roleSummary`, server-controlled `stripeCustomerId`, marketing consent fields, terms/privacy version fields.

Who can read: user can read own profile; admins can read operational fields; public cannot read private profile.

Who can write: user can update allowed profile/preference fields only; server/admin controls roles, Stripe IDs and trusted statuses.

Sensitive: moderate. Avoid health data.

Retention: deletion/anonymization subject to policy, payment/accounting and safeguarding/legal review.

### `roles` or custom claims source

Purpose: server-managed role assignments.

Key fields: `uid`, `roles`, `updatedBy`, `updatedAt`.

Who can read: admins; user may see own effective role if needed.

Who can write: super admin/server only.

Sensitive: security-critical.

Retention: keep history through audit logs.

### `events`

Purpose: unified public/admin event records.

Key fields: event model fields listed above.

Who can read: public can read published public fields; users can read booking-eligible details; admins can read all.

Who can write: admins/server only; facilitators limited if later enabled.

Sensitive: generally low, except private venue/meeting instructions.

Retention: retain historical event records for operational/accounting context; archive when no longer active.

### `bookings`

Purpose: event/class booking records.

Key fields: booking model fields listed above.

Who can read: user can read own bookings; facilitator can read assigned event attendees if permitted; admins can read.

Who can write: server/admin; users can request cancellation but not directly set trusted statuses.

Sensitive: moderate, especially access notes.

Retention: policy required; retain necessary records for operations/payments, minimize optional notes.

### `facilitators`

Purpose: public/private facilitator profiles.

Key fields: facilitator model fields listed above.

Who can read: public can read public profiles; admins can read all; facilitator can read own if linked.

Who can write: admins; facilitator self-service later for allowed fields.

Sensitive: low to moderate.

Retention: remove/unpublish inactive public profiles as requested/policy allows.

### `memberships`

Purpose: membership state and Stripe subscription references.

Who can read: user can read own membership; admins can read.

Who can write: server/admin only.

Sensitive: payment-adjacent.

Retention: accounting/legal review required.

### `payments`

Purpose: payment reconciliation references.

Who can read: user can read own payment summaries; admins can read.

Who can write: server only, with limited admin actions through functions.

Sensitive: financial references, but no card details.

Retention: accounting/legal review required.

### `products` and `productVariants`

Purpose: Yoga kit product definitions, size/price/stock variants.

Who can read: public for active products/variants; admins all.

Who can write: admins/server.

Sensitive: low.

Retention: archive inactive products/variants.

### `orders` and `orderItems`

Purpose: Yoga kit purchases.

Who can read: user own orders; admins; server.

Who can write: server/admin only.

Sensitive: financial/order data.

Retention: accounting/legal review required.

### `donations`

Purpose: donation records separate from bookings.

Who can read: donor own donation if account-linked; admins; server.

Who can write: server only.

Sensitive: financial/donor data.

Retention: accounting/legal review required.

### `supportRequests`

Purpose: Coffee/high-sensitivity support requests.

Who can read: only explicitly authorized admins/support handler; not general facilitators.

Who can write: server on submission; authorized handler updates status.

Sensitive: high.

Retention: strict policy required.

### `contactSubmissions` or `contactLogs`

Purpose: optional operational record of general contact enquiries if email-only is insufficient.

Who can read: admins.

Who can write: server.

Sensitive: depends on content; should be treated carefully.

Retention: prefer short retention.

### `emailLogs`

Purpose: record transactional email attempts/sends.

Who can read: admins; user may see limited own communication history if needed.

Who can write: server.

Sensitive: moderate.

Retention: limited operational retention.

### `webhookEvents`

Purpose: idempotency log for Stripe and email webhooks.

Who can read/write: server/admin only.

Sensitive: operational.

Retention: keep enough for debugging/idempotency window.

### `auditLogs`

Purpose: limited admin action history.

Who can read: super admin/admin as appropriate.

Who can write: server only.

Sensitive: operational/security.

Retention: policy required.

## 32. Security Rules Principles

Future Firestore rules should ensure:

- Public users only read published public event fields.
- Signed-in users can read/update allowed fields on their own profile.
- Users cannot grant themselves roles.
- Users cannot alter `membershipStatus`, `paymentStatus`, `amountPaid`, `refundStatus`, `bookingConfirmation`, capacity counters, admin flags or Stripe IDs.
- Users can read their own bookings only.
- Users cannot confirm paid bookings from the browser.
- Admin writes are role-protected.
- Facilitator access is limited to assigned events and permitted fields.
- Sensitive support requests are not broadly readable.
- Server-side functions bypass client rules only for trusted workflows.

## 33. Server-Authoritative Fields

Never trust these from the browser:

- `role` / `roles`.
- `membershipStatus`.
- `stripeCustomerId`.
- `paymentStatus`.
- `amountPaid`.
- `refundStatus`.
- `bookingConfirmation` / booking `status` for paid flows.
- `capacity`, `reservedCount`, counters.
- `attendanceStatus` unless facilitator/admin flow is authenticated and authorized.
- `adminNote`.
- `supportRequest.status`.
- `auditLog` content.

Trusted Cloud Functions/webhooks/admin flows should control them.

## 34. File Storage

Firebase Storage may later be useful for profile pictures, facilitator photos, event images and public content assets if desired.

Storage principles:

- Restrict file types to safe image formats for public assets.
- Enforce file size limits.
- Use public/private paths deliberately.
- Store facilitator/event public images as public only after admin approval.
- Avoid storing sensitive support documents unless a specific policy-approved need exists.

## 35. Account Deletion

Account deletion needs policy decisions.

Distinguish:

- User profile deletion/anonymization.
- Authentication account deletion.
- Records retained for financial, refund, accounting, safeguarding or legal obligations.
- Support request retention/deletion rules.

Do not promise immediate deletion of every related record until legal/accounting/safeguarding retention requirements are reviewed.

## 36. Audit Logging

Keep audit logging limited but useful.

Recommended audit actions:

- Admin role changes.
- Event publication/cancellation.
- Manual booking creation/cancellation.
- Refund action requested/recorded.
- Membership status override.
- Product stock adjustment.
- Sensitive support request status change.

Avoid an enormous enterprise audit system at MVP.

## 37. Notifications and Reminders

Prioritize email initially.

Potential notifications: booking confirmed, event reminder, event changed, event cancelled, waitlist promoted, membership update, payment issue and order confirmation.

Do not introduce push notifications, SMS or WhatsApp automation unless later requested.

Reminder concept:

- Scheduled function queries events due for reminders.
- Uses event timezone `Europe/London` unless otherwise set.
- Checks event is not cancelled and booking is still confirmed.
- Writes a send log with idempotency key such as `eventId_bookingId_reminderType`.
- Avoids duplicate sends.

## 38. UK Timezone Handling

Sprinkle operates in the UK.

Recommendations:

- Store event moments as UTC timestamps.
- Store event timezone explicitly as `Europe/London`.
- Display local UK time using timezone-aware formatting.
- Avoid storing ambiguous local-time strings only.
- Account for daylight-saving changes through timezone-aware libraries/services.

## 39. Waitlist

Schema should support waitlists, but enabling waitlists is a business decision.

DECISION REQUIRED: `WAITLIST ENABLED?`

Basic flow:

1. Event is full.
2. If waitlist enabled, create `WAITLISTED` booking.
3. If a confirmed user cancels, server identifies earliest eligible waitlisted booking.
4. User is promoted or invited to claim a space.
5. For paid events, promoted user may need payment before confirmation.

DECISION REQUIRED: automatic promotion or manual admin approval, payment window, and waitlist order rules.

## 40. Cancellations / Refunds

Architecture should support user cancellation, admin cancellation, event cancellation and potential refund.

Do not invent refund windows, fees or deadlines.

DECISION REQUIRED: `CANCELLATION POLICY REQUIRED`.

Conceptual refund flow:

1. Admin/user action requests cancellation.
2. Server checks policy.
3. If paid and refundable, admin/server initiates Stripe refund.
4. Webhook confirms refund status.
5. Booking/payment records update.
6. Email notification sent.

## 41. Attendance

Admins/facilitators may record `ATTENDED`, `NO_SHOW` or `NOT_RECORDED`.

Benefits: understand actual attendance, support operational planning and identify capacity/no-show patterns.

Do not use attendance for punitive automated decisions unless later specified and policy-approved.

## 42. Accessibility Information

Event records should support step-free access, seating, toilet information, sensory environment, pace/distance for walks, weather notes for walks, reasonable adjustments/contact route and online access information where relevant.

Do not invent venue accessibility. Store confirmed information only.

## 43. Booking Questions

Avoid collecting large medical histories.

If needed, add one minimal optional field: “Is there anything we should know to help you access this session?”

Privacy implications: treat as sensitive, limit access, avoid marketing/profiling, and establish retention policy before implementation.

## 44. Yoga-Specific Requirements

Future Yoga bookings may need acknowledgement of required Sprinkle cotton kit, House Rules, phones-away policy, arrival expectations and presence-not-performance ethos.

These should usually be informational acknowledgements, not heavy consent records, unless policy/legal review requires otherwise.

Possible event fields: `kitRequirement`, `houseRulesVersion`, `requiresHouseRulesAcknowledgement`.

Possible booking fields: `houseRulesAcknowledgedAt`, `houseRulesVersionAcknowledged`.

DECISION REQUIRED before implementation.

## 45. Failure States

Important product failures to design for:

- Payment succeeds but browser closes: webhook still confirms booking; dashboard shows confirmed; email sends.
- Payment fails: booking remains pending briefly then expires/cancels; capacity released.
- Webhook delayed: dashboard shows pending payment/confirmation until resolved.
- Class fills during checkout: use short-lived reservation or clear failure/refund flow.
- Event cancelled after booking: notify attendees; process refunds if policy says so.
- Email fails: booking remains valid; admin can resend; email log records failure.
- Duplicate booking attempt: server returns existing active booking.
- User account deleted: preserve/anonymize records according to policy.
- Stripe refund occurs: webhook updates payment and booking/order/donation status idempotently.

## 46. User Journeys

### A. Create account

1. Visitor clicks sign up.
2. Enters email/password and accepts current Terms/Privacy version if required.
3. Firebase creates account.
4. Verification email sent.
5. User verifies email.
6. User completes minimal profile.
7. User chooses marketing preference separately.

### B. Book free Yoga class

1. User opens Yoga class page.
2. User signs in if required.
3. Clicks book.
4. Server checks eligibility, duplicate booking and capacity.
5. Server creates confirmed booking without Stripe.
6. Confirmation email sent.
7. Booking appears in dashboard.

### C. Book paid workshop

1. User opens workshop event.
2. User signs in.
3. Server creates pending booking/reservation.
4. User pays through Stripe Checkout.
5. Stripe webhook confirms payment.
6. Booking becomes confirmed.
7. Confirmation email sent.

### D. Join waitlist

1. Event is full.
2. User clicks join waitlist if enabled.
3. Server checks duplicate booking/waitlist entry.
4. Server creates waitlisted booking.
5. User receives waitlist confirmation.
6. If space opens, user is promoted or invited according to policy.

### E. Cancel booking

1. User opens My Bookings.
2. Clicks cancel.
3. Server checks cancellation policy.
4. Booking status updates.
5. Capacity/waitlist updates.
6. Refund flow begins if applicable.
7. Confirmation email sent.

### F. Buy Yoga kit

1. User opens kit product.
2. Selects size/variant.
3. Server checks stock and creates pending order.
4. User pays through Stripe.
5. Webhook confirms payment.
6. Order becomes paid.
7. Admin fulfills via collection/delivery policy.

### G. Make donation

1. User chooses donation amount/frequency.
2. Server creates donation payment intent/checkout.
3. User pays through Stripe.
4. Webhook records donation.
5. Receipt/thank-you email sent.

### H. Purchase membership

1. User opens Membership section.
2. Chooses membership product once defined.
3. Server creates Stripe subscription checkout.
4. Webhook confirms subscription.
5. Membership status becomes active.
6. Member dashboard updates.

### I. Receive booking reminder

1. Scheduled reminder job finds upcoming confirmed booking.
2. Checks event not cancelled and reminder not already sent.
3. Sends email.
4. Records email/reminder log.

### J. Update marketing preferences

1. User opens Email Preferences.
2. Toggles marketing consent.
3. Server records consent/unsubscribe timestamp, source and version.
4. Marketing provider is updated if integrated.

### K. Delete account

1. User requests deletion.
2. System explains retained records may include payments/bookings where legally/operationally required.
3. User confirms.
4. Profile is deleted/anonymized according to policy.
5. Authentication account is disabled/deleted.
6. Confirmation email sent if appropriate.

## 47. Admin Journeys

### A. Create Yoga class

1. Admin opens Events.
2. Creates event type `YOGA_CLASS`.
3. Adds date/time, venue, capacity, facilitator, accessibility and kit/house-rule information.
4. Sets price model and booking window.
5. Saves draft.

### B. Create workshop

1. Admin creates event type `WORKSHOP`.
2. Selects or enters workshop concept.
3. Adds facilitator, venue/time/capacity/accessibility.
4. Sets price model.
5. Saves draft.

### C. Publish event

1. Admin reviews draft.
2. Confirms required fields and policies.
3. Publishes.
4. Public page/listing can show event.
5. Booking opens based on booking window/status.

### D. View attendees

1. Admin opens event.
2. Views confirmed, waitlisted and cancelled bookings.
3. Exports or prints if policy allows.
4. Facilitators only see assigned event attendees if allowed.

### E. Cancel event

1. Admin selects cancel event.
2. Enters cancellation reason.
3. Server updates event to cancelled.
4. Bookings update or are flagged.
5. Attendees notified.
6. Refund workflow begins for paid bookings according to policy.

### F. Issue/manage refund conceptually

1. Admin opens payment/booking.
2. Requests refund if policy permits.
3. Server initiates Stripe refund.
4. Webhook confirms refund.
5. Payment/booking status updates.
6. User receives notification.

### G. Add facilitator

1. Admin opens Teachers / Facilitators.
2. Creates facilitator profile.
3. Adds roles and bios.
4. Sets public profile active/inactive.
5. Optionally links user account.

### H. View member

1. Admin searches member.
2. Views profile, membership status, bookings and orders.
3. Does not view high-sensitivity support requests unless specifically authorized.

### I. Manage Yoga kit product

1. Admin creates product.
2. Adds variants, sizes, prices and stock.
3. Publishes product.
4. Reviews orders and fulfillment status.

### J. Review operational dashboard

1. Admin opens dashboard.
2. Reviews upcoming events, near-capacity events, cancellations, payment issues and operational tasks.
3. Acts on priority items.

## 48. Decisions Required From Kaan

### Membership

- What is membership?
- Is there a free membership?
- Is there a paid membership?
- Price?
- Monthly/yearly?
- Benefits?
- Is membership required for anything?
- Cancellation rules?
- Renewal rules?
- Member dashboard expectations?

### Yoga

- Actual timetable?
- Venue?
- Capacity?
- Teachers?
- Accessibility information?
- Kit borrowing process?
- Kit buying process?
- House Rules final wording?
- Phones-away policy final wording?
- Booking requirements?

### Events

- Which are free?
- Which are paid?
- Which are pay-what-you-can?
- Capacity per event type?
- Cancellation rules?
- Refund rules?
- Waitlists enabled?
- Manual attendee additions allowed?
- What attendee/access information is necessary?

### Kit

- Products?
- Sizes?
- Prices?
- Stock?
- Delivery or collection?
- Returns?
- Borrowing?
- Deposits?

### Donations

- One-off donations?
- Recurring donations?
- Suggested amounts?
- Gift Aid eligibility?
- Donation messaging?
- Guest donations allowed?

### Email

- Sender email/domain?
- Transactional provider preference?
- Newsletter provider preference?
- Newsletter frequency?
- Who creates newsletter content?
- Email template tone and sign-off?

### Admin

- Who needs admin access?
- Is super admin needed?
- What should facilitators manage themselves?
- Who can see support requests?
- Who can issue refunds?

### Policies

- Privacy Notice.
- Terms of Use.
- Safeguarding Policy.
- Booking/cancellation/refund policy.
- Membership terms.
- Kit sales/returns policy.
- Support request handling and retention policy.
- Marketing consent wording.
- Cookie information.

## 49. MVP Recommendation

Smallest useful MVP:

- Firebase Authentication.
- User profile and email preferences.
- Admin role assignment.
- Unified event model.
- Admin event creation/editing/publishing.
- Free bookings with capacity enforcement.
- Member dashboard showing bookings.
- Transactional booking confirmation email.
- Basic admin attendee view.

This MVP lets Sprinkle publish real Yoga classes or events and take bookings without solving every payment/membership/store/donation problem immediately.

## 50. Later / Optional Features

Later features:

- Paid event bookings through Stripe.
- Membership subscriptions.
- Pay-what-you-can events.
- Waitlists.
- Yoga kit store.
- Kit borrowing reservations.
- Donations.
- Facilitator self-service.
- Advanced reporting.
- Marketing/newsletter integration.
- Account deletion automation.
- Customer portal for Stripe subscriptions.
- Sophisticated stock management.
- Data export tools.

## 51. Recommended Implementation Sequence

### Phase A: Foundation

- Confirm policies needed for MVP.
- Set up Firebase project, environments and hosting decision.
- Add Firebase Authentication.
- Establish user profile document creation.
- Establish role assignment approach.

### Phase B: User Accounts

- Sign up, login, logout, forgot password, email verification.
- Basic profile dashboard.
- Email preferences and consent records.

### Phase C: Events Admin

- Firestore event schema.
- Admin event create/edit/publish/cancel.
- Facilitator model basic version.
- Public event listing/details connected to event records.

### Phase D: Free Bookings and Capacity

- Server-side booking transactions.
- Duplicate booking prevention.
- Capacity enforcement.
- Member dashboard bookings.
- Admin attendee list.

### Phase E: Transactional Email

- Select provider.
- Booking confirmation/cancellation/event changed/reminder templates.
- Email logs and duplicate-send prevention.

### Phase F: Paid Event Bookings

- Stripe Checkout for paid events.
- Payment records.
- Webhook idempotency.
- Paid booking confirmation.

### Phase G: Membership

- Define membership product(s).
- Stripe subscriptions if paid.
- Membership dashboard/status.
- Membership requirements/benefits if any.

### Phase H: Yoga Kit

- Products/variants/orders.
- Stripe kit checkout.
- Stock basics.
- Fulfillment workflow.
- Borrowing process if digital reservation is confirmed.

### Phase I: Donations

- One-off donations.
- Recurring donations if required.
- Donation receipts.
- Gift Aid only if eligibility/policy confirmed.

### Phase J: Marketing / Newsletter

- Select provider.
- Consent sync.
- Unsubscribe handling.
- Newsletter templates and campaign workflow.

### Phase K: Privacy, Deletion and Polish

- Account deletion/anonymization workflow.
- Retention tooling.
- Audit logs refinement.
- Admin UX polish.
- Security rules review.

## 52. Non-Goals For This Phase

Not implemented:

- Firebase setup.
- Firestore collections.
- Firebase Auth.
- Cloud Functions.
- Stripe SDK, Checkout or webhooks.
- Email provider integration.
- Mailchimp/newsletter integration.
- Admin dashboard.
- Login UI.
- Booking UI.
- Database schema in code.

This document is the implementation blueprint only.
