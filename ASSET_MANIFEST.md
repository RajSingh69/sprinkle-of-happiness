# Asset Manifest: Sprinkle of Happiness Final Artwork Audit

Phase 10 production checklist for real artwork and imagery. This document audits the current static website and defines what visual assets are needed before final fit-up. No artwork has been generated in this phase.

Phase 11 status note: The current production strategy no longer requires the full custom artwork library for launch. These assets are optional future enhancements unless explicitly marked otherwise. The site is designed to operate as a complete CSS-led dreamland experience with real photography used where identity matters.

Recommended asset home remains `assets/images/` using the existing folders:

- `dreamland/` for environmental scenes, sky, clouds, moon, sun, phoenix and atmospheric motifs.
- `people/` for community, hands, silhouettes and human-connection illustration.
- `objects/` for coffee, tea, paper, envelope, camera, pen, books, cotton and small floating objects.
- `founder/` for real Kaan Singh photography and approved personal archive imagery.
- `experiences/` for Workshops, Circles, Walks, Yoga and experience-detail artwork.

Current asset status: `assets/images/kaan-profile.jpg` is available and integrated for Kaan Singh. Other custom artwork remains optional future enhancement material; existing CSS clouds/gradients now carry the launch visual system.

## Current Asset Gap Summary

- Total meaningful assets identified: 24
- Critical missing assets: 1
- High priority: 10
- Medium priority: 7
- Low priority: 3
- Optional decorative: 3
- Real photos required: 5
- Generated artwork candidates: 15
- Design/vector better: 4
- Existing assets reusable: 0 production images; CSS clouds/gradients are KEEP as current atmospheric foundation.
- Existing assets likely replaceable: all current text-based artwork slots and placeholder labels.
- Pages that genuinely do not need additional artwork: Contact form section, footer, community agreements/session structure sections, most future-info/detail panels.

## Global Art Direction

The Sprinkle visual world should feel like mature dreamland / candyfloss editorial art: soft clouds, sunlight, stars, plants, paper, pen, camera, footsteps, coffee, books, cotton and gentle movement. It should carry the emotional journey from survival to expression, connection, hope and joy.

Preferred style:

- Clean editorial illustration or carefully composed symbolic environmental scenes.
- Soft tactile texture, subtle grain, layered depth and warm lighting.
- Pastel candyfloss palette balanced by grounded darker tones on Support/Coffee pages.
- Human presence through silhouettes, partial figures, objects, shadows or real photography where identity matters.
- Negative space for text and organic layouts.
- Dreamlike but not childish, not generic fantasy, not glossy corporate.

Human representation:

- Real people must use real supplied photography.
- For illustrated community scenes, prefer abstract, partial, silhouette or hands-only compositions used sparingly.
- Avoid uncanny AI group portraits.

## AI-Slop Prevention Rules

- No fake text inside images.
- No fake UI screenshots.
- No fake brand logos.
- No fabricated Kaan or fabricated teachers/facilitators.
- No impossible anatomy, extra fingers, distorted hands or uncanny faces.
- Avoid hands unless the composition genuinely needs them.
- No glossy generic 3D people.
- No corporate meeting poses or random laptops.
- No overfilled symbolic clutter.
- No meaningless gradients as the whole concept.
- No unnecessary glowing objects or excessive lens flare.
- No giant symbolic brains, split faces, horror mental-health tropes or pills as primary imagery.
- No religious symbols used decoratively without clear context and approval.
- No generic wellness stock imagery.
- No fake therapy imagery.
- No homelessness stereotypes or poverty tourism visuals.

## Existing Placeholder Map

| Current slot | Manifest ID | Action |
| --- | --- | --- |
| `index.html` `.dream-orbit[data-art-id="HOME-HERO-01"]` | HOME-HERO-01 | REPLACE placeholder with artwork |
| `index.html` `.phoenix-placeholder[data-art-id="HOME-PHOENIX-01"]` | HOME-PHOENIX-01 | REPLACE placeholder with artwork |
| `index.html`, `kaan.html` `[data-art-id="KAAN-PORTRAIT-01"]` | KAAN-PORTRAIT-01 | REAL PHOTO REQUIRED |
| `about.html` `[data-art-id="ABOUT-CREATIVE-01"]` | ABOUT-CREATIVE-01 | REPLACE placeholder with artwork |
| `experiences.html`, `workshops.html` `[data-art-id="EXP-WORKSHOPS-01"]` | EXP-WORKSHOPS-01 | REPLACE placeholder with artwork |
| `experiences.html`, `circles.html` `[data-art-id="EXP-CIRCLES-01"]` | EXP-CIRCLES-01 | REPLACE placeholder with artwork |
| `experiences.html`, `walks.html` `[data-art-id="EXP-WALKS-01"]` | EXP-WALKS-01 | REPLACE placeholder with artwork |
| `experiences.html` `[data-art-id="YOGA-PRESENCE-01"]` | YOGA-HERO-01 | New manifest ID; route to Yoga artwork |
| `community.html` `[data-art-id="COMMUNITY-CONNECTION-01"]` | COMMUNITY-CONNECTION-01 | REPLACE placeholder with artwork |
| `support.html` `[data-art-id="SUPPORT-NIGHT-01"]` | SUPPORT-NIGHT-01 | REPLACE placeholder with artwork |
| `coffee.html` `[data-art-id="COFFEE-CONVERSATION-01"]` | COFFEE-CONVERSATION-01 | REPLACE placeholder with artwork |
| `contact.html` `[data-art-id="CONTACT-HOSPITALITY-01"]` | CONTACT-HOSPITALITY-01 | LOW priority; may replace or remove later |
| `contact.html` `[data-art-id="CONTACT-PAPER-01"]` | CONTACT-PAPER-01 | OPTIONAL; no art may be needed |
| `kaan.html` `[data-art-id="KAAN-ARCHIVE-01"]` | KAAN-ARCHIVE-01 | Supporting real/photo-symbolic asset |
| Individual experience placeholders | EXPERIENCE-DETAIL-SYSTEM-01 | Use category system; no unique image per page required for launch |

## Critical Priority

### KAAN-PORTRAIT-01

- Page: Home, Meet Kaan
- Current slot: `.portrait-placeholder` / `.kaan-photo-card` using `assets/images/kaan-profile.jpg`
- Type: REAL PHOTO
- Generation method: REAL PHOTO REQUIRED
- Priority: CRITICAL
- Status: AVAILABLE / INTEGRATED
- Target ratio: 4:5 or 3:4
- Transparent background: NO
- Responsive crop: SINGLE RESPONSIVE ASSET, face/expression preserved
- Meaningful/decorative: MEANINGFUL
- Alt intent: Warm portrait of Kaan Singh, founder of Sprinkle of Happiness.
- Requirement: Real supplied Kaan photograph. Do not generate or fabricate Kaan.
- Notes: This is the only critical asset because repeated founder placeholders make the site feel unfinished and Kaan is a real person.

## High Priority Assets

### HOME-HERO-01

- Page: Home
- Current slot: `.dream-orbit[data-art-id="HOME-HERO-01"]`
- Type: EDITORIAL ILLUSTRATION / BACKGROUND
- Generation method: IMAGE GENERATION SUITABLE
- Priority: HIGH
- Status: MISSING
- Target ratio: 4:3 or 3:2
- Transparent background: NO
- Responsive crop: SINGLE RESPONSIVE ASSET
- Meaningful/decorative: DECORATIVE ATMOSPHERIC
- Brief:
  - Subject: Sprinkle dreamland world of clouds, sunlight, paper, flowers, pathways and creative objects.
  - Composition: One generous central environment with breathing room; no fake text.
  - Mood: hopeful, surreal, warm, mature.
  - Avoid: generic fantasy castle, clutter, childish candy graphics, random icons.

### HOME-PHOENIX-01

- Page: Home
- Current slot: `.phoenix-placeholder[data-art-id="HOME-PHOENIX-01"]`
- Type: EDITORIAL ILLUSTRATION / ICON-SYMBOL
- Generation method: IMAGE GENERATION SUITABLE
- Priority: HIGH
- Status: MISSING
- Target ratio: 1:1
- Transparent background: PREFERRED
- Responsive crop: SINGLE RESPONSIVE ASSET
- Meaningful/decorative: DECORATIVE SYMBOLIC
- Brief:
  - Subject: Soft abstract phoenix/bird rising through dawn clouds.
  - Composition: Simple centered foreground object.
  - Mood: hope, return to light, not fantasy-game dramatic.
  - Avoid: flames, aggression, hyperreal feathers, mythology clutter.

### ABOUT-CREATIVE-01

- Page: About
- Current slot: `[data-art-id="ABOUT-CREATIVE-01"]`
- Type: EDITORIAL ILLUSTRATION
- Generation method: IMAGE GENERATION SUITABLE
- Priority: HIGH
- Status: MISSING
- Target ratio: 4:3
- Transparent background: PREFERRED
- Responsive crop: SINGLE RESPONSIVE ASSET
- Meaningful/decorative: DECORATIVE SYMBOLIC
- Brief:
  - Subject: Creative wellbeing world with paper, pen, flowers, camera, clouds and movement.
  - Composition: One calm editorial cluster, not multiple mini-scenes.
  - Mood: survival into expression and connection.
  - Avoid: fake writing, busy scrapbook, stock therapy symbolism.

### EXP-WORKSHOPS-01

- Page: Experiences, Workshops
- Current slot: `[data-art-id="EXP-WORKSHOPS-01"]`
- Type: EDITORIAL ILLUSTRATION
- Generation method: IMAGE GENERATION SUITABLE
- Priority: HIGH
- Status: MISSING
- Target ratio: 4:3
- Transparent background: PREFERRED
- Responsive crop: SINGLE RESPONSIVE ASSET
- Meaningful/decorative: MEANINGFUL NAVIGATIONAL
- Alt intent: Creative workshop materials with paper, pen, camera and flowers.
- Brief: expressive creative tools, poetry/writing energy, warm motion, no readable fake text.

### EXP-CIRCLES-01

- Page: Experiences, Circles
- Current slot: `[data-art-id="EXP-CIRCLES-01"]`
- Type: EDITORIAL ILLUSTRATION
- Generation method: IMAGE GENERATION SUITABLE
- Priority: HIGH
- Status: MISSING
- Target ratio: 4:3
- Transparent background: PREFERRED
- Responsive crop: SINGLE RESPONSIVE ASSET
- Meaningful/decorative: MEANINGFUL NAVIGATIONAL
- Alt intent: Warm symbolic circle of conversation and connection.
- Brief: chairs/cups/speech-clouds in a respectful gathering motif; no mental-health stereotypes or uncanny faces.

### EXP-WALKS-01

- Page: Experiences, Walks
- Current slot: `[data-art-id="EXP-WALKS-01"]`
- Type: EDITORIAL ILLUSTRATION
- Generation method: IMAGE GENERATION SUITABLE
- Priority: HIGH
- Status: MISSING
- Target ratio: 4:3 or 3:2
- Transparent background: PREFERRED
- Responsive crop: SINGLE RESPONSIVE ASSET
- Meaningful/decorative: MEANINGFUL NAVIGATIONAL
- Alt intent: Gentle pathway suggesting walking, reflection and storytelling.
- Brief: footsteps/pathway, city/nature hints, camera, clouds; avoid homelessness stereotypes.

### YOGA-HERO-01

- Page: Experiences, Yoga
- Current slot: `experiences.html [data-art-id="YOGA-PRESENCE-01"]`; Yoga page currently has no dedicated image slot
- Type: EDITORIAL ILLUSTRATION
- Generation method: IMAGE GENERATION SUITABLE
- Priority: HIGH
- Status: MISSING
- Target ratio: 4:3
- Transparent background: PREFERRED
- Responsive crop: SINGLE RESPONSIVE ASSET
- Meaningful/decorative: MEANINGFUL NAVIGATIONAL
- Alt intent: Gentle yoga practice expressed through body, breath, reflection and community.
- Brief:
  - Subject: movement, breath, body/mind/heart/spirit, subtle sound/kirtan motifs.
  - Composition: abstract human form or silhouette with cotton, book and cloud elements.
  - Mood: presence not performance.
  - Avoid: stereotypical exotic spirituality, fake religious iconography, extreme poses, gym/wellness stock look.

### COMMUNITY-CONNECTION-01

- Page: Community
- Current slot: `.community-people-stage[data-art-id="COMMUNITY-CONNECTION-01"]`
- Type: EDITORIAL ILLUSTRATION
- Generation method: IMAGE GENERATION SUITABLE
- Priority: HIGH
- Status: MISSING
- Target ratio: 4:3
- Transparent background: PREFERRED
- Responsive crop: SINGLE RESPONSIVE ASSET
- Meaningful/decorative: MEANINGFUL SYMBOLIC
- Alt intent: Welcoming symbolic community connection.
- Brief: diverse abstract community through connected clouds, flowers, cups, partial silhouettes or hands used sparingly; avoid uncanny AI group portrait.

### SUPPORT-NIGHT-01

- Page: Need Support
- Current slot: `.support-cloud[data-art-id="SUPPORT-NIGHT-01"]`
- Type: BACKGROUND / TEXTURE
- Generation method: IMAGE GENERATION SUITABLE
- Priority: HIGH
- Status: MISSING
- Target ratio: 16:9
- Transparent background: NO
- Responsive crop: SINGLE RESPONSIVE ASSET
- Meaningful/decorative: DECORATIVE ATMOSPHERIC
- Brief: midnight dreamland, moon, stars, small warm light, path toward dawn; calm and grounding. Avoid despair, cliffs, bridges, ledges, weapons, self-harm imagery.

### COFFEE-CONVERSATION-01

- Page: Let's Get a Coffee
- Current slot: `.coffee-stage[data-art-id="COFFEE-CONVERSATION-01"]`
- Type: EDITORIAL ILLUSTRATION
- Generation method: IMAGE GENERATION SUITABLE
- Priority: HIGH
- Status: MISSING
- Target ratio: 4:3
- Transparent background: PREFERRED
- Responsive crop: SINGLE RESPONSIVE ASSET
- Meaningful/decorative: MEANINGFUL SYMBOLIC
- Alt intent: Warm coffee and conversation motif suggesting safe human connection.
- Brief: two cups, quiet table or walking path at sunrise; ordinary, warm, non-clinical. Avoid depicting Kaan with a vulnerable person.

## Medium Priority Assets

### KAAN-ARCHIVE-01

- Page: Meet Kaan
- Current slot: `[data-art-id="KAAN-ARCHIVE-01"]`
- Type: REAL PHOTO / EDITORIAL COLLAGE
- Generation method: REAL PHOTO REQUIRED for personal material; DESIGN / VECTOR BETTER for layout treatment
- Priority: MEDIUM
- Status: MISSING
- Target ratio: 4:3
- Transparent background: NO or PREFERRED if collage cutouts
- Meaningful/decorative: MEANINGFUL PERSONAL CONTEXT
- Alt intent: Kaan's creative practice through writing, photography or performance materials.
- Notes: Prefer real supplied photos of Kaan writing/photographing/performing, or real objects from his creative archive. Do not invent personal history.

### VALUES-SYSTEM-01

- Page: Our Values
- Current slot: No explicit placeholder; values currently use CSS constellations/clouds
- Type: ICON / SYMBOL SYSTEM
- Generation method: DESIGN / VECTOR BETTER
- Priority: MEDIUM
- Status: MISSING
- Target ratio: freeform transparent icon family
- Transparent background: YES
- Meaningful/decorative: MEANINGFUL SUPPORTING
- Brief: cohesive small symbol family for Sat, Daya, Santokh, Nimrata, Pyaar/Prem, Seva, Equality, Chardi Kala. Avoid random Sikh imagery or decorative religious symbols without approval.

### WORKSHOP-FAMILY-01

- Page: Individual workshop detail pages
- Current slot: current detail pages use generic replaceable experience artwork placeholders
- Type: EDITORIAL ILLUSTRATION SYSTEM
- Generation method: IMAGE GENERATION SUITABLE
- Priority: MEDIUM
- Status: MISSING
- Target ratio: 4:3
- Transparent background: PREFERRED
- Meaningful/decorative: MEANINGFUL NAVIGATIONAL
- Notes: One workshop-family system is preferable to four unrelated illustrations. Variants may represent writing/surrender, nature observation, survivor storytelling and Chardi Kala if time allows.

### CIRCLE-FAMILY-01

- Page: Individual circle detail pages
- Current slot: generic detail placeholders
- Type: EDITORIAL ILLUSTRATION SYSTEM
- Generation method: IMAGE GENERATION SUITABLE
- Priority: MEDIUM
- Status: MISSING
- Target ratio: 4:3
- Transparent background: PREFERRED
- Meaningful/decorative: MEANINGFUL NAVIGATIONAL
- Notes: Respectful abstract/community-oriented circle imagery only. No split faces, pills, horror, chaotic brains, straitjackets or despair stock imagery.

### WALK-FAMILY-01

- Page: Individual walk detail pages
- Current slot: generic detail placeholders
- Type: EDITORIAL ILLUSTRATION SYSTEM
- Generation method: IMAGE GENERATION SUITABLE
- Priority: MEDIUM
- Status: MISSING
- Target ratio: 4:3
- Transparent background: PREFERRED
- Meaningful/decorative: MEANINGFUL NAVIGATIONAL
- Notes: London/pathway/footsteps/photography/nature system. Avoid homelessness stereotypes.

### YOGA-COTTON-01

- Page: Yoga
- Current slot: no explicit image slot yet; content section references 100% cotton kit
- Type: REAL PHOTO / DECORATIVE ILLUSTRATION
- Generation method: FUTURE PRODUCT PHOTOGRAPHY REQUIRED for final kit; IMAGE GENERATION SUITABLE only for temporary symbolic cotton artwork
- Priority: MEDIUM
- Status: MISSING
- Target ratio: 3:2 or 1:1
- Transparent background: PREFERRED for temporary cotton illustration; NO for product photo
- Meaningful/decorative: MEANINGFUL if product photo, DECORATIVE if symbolic
- Notes: Do not create fake final commercial product imagery before the kit exists.

### YOGA-KIRTAN-01

- Page: Yoga
- Current slot: no explicit image slot yet; content references Kirtan
- Type: EDITORIAL ILLUSTRATION / REAL PHOTO
- Generation method: IMAGE GENERATION SUITABLE for symbolic artwork; REAL PHOTO REQUIRED if showing actual session
- Priority: MEDIUM
- Status: MISSING
- Target ratio: 4:3
- Transparent background: PREFERRED for illustration
- Meaningful/decorative: MEANINGFUL SUPPORTING
- Brief: voice/listening/music/community gathering, respectful and subtle; avoid fake religious iconography.

## Low Priority Assets

### CONTACT-HOSPITALITY-01

- Page: Contact
- Current slot: `.contact-conversation-stage[data-art-id="CONTACT-HOSPITALITY-01"]`
- Type: DECORATIVE ILLUSTRATION
- Generation method: IMAGE GENERATION SUITABLE
- Priority: LOW
- Status: MISSING
- Target ratio: 4:3
- Transparent background: PREFERRED
- Meaningful/decorative: DECORATIVE
- Notes: Contact works with form and CSS environment; artwork can be small and friendly, not a giant illustration.

### CONTACT-PAPER-01

- Page: Contact
- Current slot: `.hospitality-moment[data-art-id="CONTACT-PAPER-01"]`
- Type: DECORATIVE ILLUSTRATION
- Generation method: DESIGN / VECTOR BETTER
- Priority: LOW
- Status: MISSING
- Target ratio: wide transparent
- Transparent background: YES
- Meaningful/decorative: DECORATIVE
- Notes: Could be removed/no art needed if final page feels too busy.

### SUPPORT-DAWN-01

- Page: Need Support / Coffee transition
- Current slot: no explicit HTML placeholder
- Type: BACKGROUND / TEXTURE
- Generation method: IMAGE GENERATION SUITABLE
- Priority: LOW
- Status: MISSING
- Target ratio: 16:9
- Transparent background: NO
- Meaningful/decorative: DECORATIVE ATMOSPHERIC
- Notes: Optional dawn transition. Existing gradients may be enough.

## Optional Decorative Library

### CLOUD-SYSTEM-01

- Page: Global
- Type: DECORATIVE ILLUSTRATION / VECTOR
- Generation method: DESIGN / VECTOR BETTER
- Priority: OPTIONAL
- Target ratio: mixed transparent
- Transparent background: YES
- Notes: Existing CSS clouds are KEEP for now. A bespoke SVG/WebP cloud family could replace text/shape placeholders later.

### FLOATING-OBJECTS-01

- Page: Global
- Type: ICON / SYMBOL
- Generation method: DESIGN / VECTOR BETTER
- Priority: OPTIONAL
- Target ratio: freeform transparent
- Transparent background: YES
- Motifs: star, flower, paper, pen, camera, coffee cup, cotton flower, book, footsteps, small bird, sound marks.
- Notes: Keep this small. Do not make 100 objects.

### INTRO-SURVIVAL-01

- Page: Intro / Survivor Gate
- Type: BACKGROUND / TEXTURE
- Generation method: IMAGE GENERATION SUITABLE
- Priority: OPTIONAL
- Target ratio: 16:9
- Transparent background: NO
- Notes: Current atmospheric intro can stand without additional imagery. Only add if final fit-up needs more depth.

## Real Photography Required

### Required Before Launch

1. Kaan portrait for HOME/KAAN (`KAAN-PORTRAIT-01`).
2. Optional but strongly preferred: Kaan creative practice photo or personal archive (`KAAN-ARCHIVE-01`).

### Can Add After Launch

1. Actual Yoga teachers/facilitators, once confirmed. Real photos only.
2. Actual Yoga class or Kirtan session, if available and consented.
3. Actual Sprinkle community events/workshops/walks, if available and consented.
4. Actual Yoga cotton kit/product photography once the kit exists.
5. Venue/interior photography once venues are confirmed.

## Page-by-Page Audit

- Intro / Survivor Gate: no required artwork; current atmosphere can remain. Optional texture only.
- Home: needs HOME-HERO-01, HOME-PHOENIX-01, KAAN-PORTRAIT-01. Highest visual priority.
- About: one strong ABOUT-CREATIVE-01 is enough; no extra paragraph-level images needed.
- Meet Kaan: real portrait is critical; archive/supporting creative photo is medium.
- Values: no large image required; a cohesive small vector symbol system would help.
- Experiences: four category pathway assets needed: Workshops, Circles, Walks, Yoga.
- Workshops: use a family system; do not force four unrelated full illustrations for launch.
- Circles: use respectful abstract family system; avoid mental-health stereotypes.
- Walks: use pathway/footsteps/city/nature family system; avoid poverty-tourism imagery.
- Yoga: needs Yoga hero/pathway art; cotton, Kirtan and teacher/product photography can follow when real material exists.
- Community: one strong COMMUNITY-CONNECTION-01 is enough.
- Need Support: one calm SUPPORT-NIGHT-01 environment is enough; avoid distress imagery.
- Coffee: one warm COFFEE-CONVERSATION-01 is enough.
- Contact: minimal art; current CSS/form can carry page. Contact assets low priority.
- Individual experience pages: use category-family artwork rather than unique art for every page at launch.
- Header: no new artwork needed; brand mark can remain CSS/logo-like until brand identity phase.
- Footer: no new artwork needed.
- Background decoration: current CSS clouds/stars/moon/sun are KEEP until final fit-up.

## Potentially Unused / Outdated Manifest Items

Do not delete files or code in this phase. The following older concepts from the previous manifest should not remain production requirements unless reinstated during final fit-up:

- HOME-COMMUNITY-01: homepage community section can link to Community page; not required.
- HOME-VALUES-01: Values section already has CSS constellation; use VALUES-SYSTEM-01 instead if needed.
- ABOUT-REFLECTIVE-01: About page should not accumulate extra images beyond ABOUT-CREATIVE-01.
- FOOTER-WORLD-01: footer does not need additional artwork.
- EXPERIENCE-DETAIL-SYSTEM-01 as a single vague asset: replaced by WORKSHOP-FAMILY-01, CIRCLE-FAMILY-01 and WALK-FAMILY-01.

## Recommended Production Order

### Batch 1 - Site-Defining

1. KAAN-PORTRAIT-01 - real photo.
2. HOME-HERO-01 - generated/editorial illustration.
3. HOME-PHOENIX-01 - generated symbolic illustration.
4. ABOUT-CREATIVE-01 - generated/editorial illustration.
5. COMMUNITY-CONNECTION-01 - generated/editorial illustration.

### Batch 2 - Programme Navigation

1. EXP-WORKSHOPS-01.
2. EXP-CIRCLES-01.
3. EXP-WALKS-01.
4. YOGA-HERO-01.

### Batch 3 - Support / Human Safety

1. SUPPORT-NIGHT-01.
2. COFFEE-CONVERSATION-01.

### Batch 4 - Programme Detail Families

1. WORKSHOP-FAMILY-01.
2. CIRCLE-FAMILY-01.
3. WALK-FAMILY-01.
4. VALUES-SYSTEM-01.

### Batch 5 - Yoga and Decorative Enhancements

1. YOGA-COTTON-01 temporary symbolic cotton art, only if needed before product photography.
2. YOGA-KIRTAN-01.
3. CONTACT-HOSPITALITY-01 / CONTACT-PAPER-01 only if final fit-up needs them.
4. CLOUD-SYSTEM-01 / FLOATING-OBJECTS-01.

## Performance Notes

- Prefer compressed WebP for raster scenes.
- Prefer SVG for simple vector symbols and reusable decorative motifs.
- Use transparent WebP/PNG only when artwork must float over CSS dreamland backgrounds.
- Use responsive image sizes and lazy loading below the fold during final integration.
- Do not use external hotlinked images.
- Avoid oversized hero images where CSS atmosphere already carries the page.

## Accessibility Notes

Meaningful navigational or person-specific images need useful alt text. Decorative atmosphere should generally be empty-alt or `aria-hidden="true"` during integration.

Meaningful/high-priority alt-intent assets:

- KAAN-PORTRAIT-01: identify Kaan Singh.
- EXP-WORKSHOPS-01: communicate creative workshop materials.
- EXP-CIRCLES-01: communicate conversation/connection.
- EXP-WALKS-01: communicate walking/reflection.
- YOGA-HERO-01: communicate gentle yoga/presence.
- COMMUNITY-CONNECTION-01: communicate belonging/community.
- COFFEE-CONVERSATION-01: communicate warm conversation support.

Decorative assets:

- HOME-HERO-01, HOME-PHOENIX-01, SUPPORT-NIGHT-01, clouds, floating objects, contact paper motifs, dawn textures.
