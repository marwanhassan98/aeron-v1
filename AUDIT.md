# AERON Theme Audit — Phase 1

Audited branch: `main` @ `c21952b` · Date: 2026-10-17 · Tooling: Shopify CLI 3.94.1 `theme check` + manual review of every file.

> **Scope note.** This audits the repo, not the live storefront. The last commit claims to mirror the live theme, but some findings (placeholder content, empty FAQ, missing images) depend on what is saved in the live theme editor. Step 0 of the fix plan is a `shopify theme pull` to confirm. The Team Orders page lives only on the unmerged `team-orders` branch and is not part of `main`.

## Health summary

1. **The main revenue path is broken.** Every "Start a Project" button lands on a form that sends nothing. The data is POSTed to `/`, which Shopify ignores, and the customer still sees a success message.
2. **Shoppers cannot buy.** There is no cart template, so `/cart` (where add-to-cart redirects) cannot render. The product form also blanks the variant ID as soon as a shopper taps an option.
3. **The theme is missing 9+ standard templates.** These include `page`, `404`, `search` and `list-collections`. The last sync also wiped the global settings schema (logo, favicon, WhatsApp).
4. **The visual identity is strong**, with consistent tokens, typography and gold accents. But accessibility is weak: the native cursor is hidden, there is no reduced-motion support, several menus can't be used by keyboard or screen reader, and text contrast fails in many places.
5. **There is no French version** for a Montréal brand. That is a Charter of the French Language exposure and a conversion loss. The kits page also ships 5.3 MB of PNGs.

Theme Check: **19 errors, 27 warnings**. These are all image width/height, deprecated `img_url`, remote fonts and hard-coded routes. It does not detect missing templates or the broken forms; those findings are manual.

---

## Issues

### CRITICAL — broken for customers

| # | Where | What's wrong | Why it matters | Fix |
|---|---|---|---|---|
| C1 | `sections/page-kits.liquid:199` (`#projForm`), `assets/aeron.js:168-192` (`submitProject`) | **The existing project inquiry form never reaches you.** It is a plain `<form>` with Netlify attributes (`data-netlify`, `form-name`, `bot-field`). `submitProject` does `fetch('/', {method:'POST', body:FormData})`. Shopify does not process that, the error is swallowed (`catch(err){}`), and the success panel is shown anyway. The logo file upload (`:219`) is also discarded. Shopify forms cannot accept files at all. | This is the target of every primary CTA: header (`header.liquid:23`), mobile menu (`mobile-menu.liquid:7`), hero, CTA banner (`home-cta-banner.liquid:10`), gallery (`page-gallery.liquid:7,37`) and footer preset. **Every team lead is silently lost** while the customer believes they submitted. | Keep this form's design and position (your preferred form). Replace the plumbing with `{% form 'contact', id: 'projForm' %}`. Rename fields to `contact[Team Name]`, `contact[Your Name]`, `contact[email]`, `contact[Phone]`, `contact[Kit Type]`, `contact[Quantity]`, `contact[Notes]`, `contact[Configurator Summary]`. Fill the summary from the configurator before submit, then let the form post normally. Show success via `form.posted_successfully?` and errors via `form.errors \| default_errors`. Replace the file input with an "email your logo to …" note. Show the deposit button only after a confirmed post. Remove the Netlify attributes. |
| C2 | `templates/` (no `cart.*`); `sections/header.liquid:19` links to `/cart` | **There is no cart template.** `{% form 'product' %}` redirects to `/cart` after adding, and the header cart icon links there. Without a template Shopify cannot render the page. Verify on the preview: open `/cart`. | **No path to checkout** for grip socks or the deposit product. | Add `templates/cart.json` and a `main-cart` section. It needs line items with image, title, variant and price, a quantity input (`updates[]`), a remove link (`item.url_to_remove`), the subtotal, an empty state, and `<button name="checkout">`. Use `routes.cart_url` in the header. |
| C3 | `sections/main-product.liquid:28` | **Add to cart fails after any option tap.** Each option radio runs `onchange="…[name=id].value=''"`, and nothing sets the ID again, so the cart receives an empty `id`. Single-variant products are hit too: `options_with_values` renders a "Title / Default Title" pill, and tapping it blanks the ID. | Shopify rejects the add-to-cart. This applies to every product, including the $20 deposit product. | Output `product.variants` as JSON and, on change, find the variant matching the selected options. Set `[name=id]`, update the price, toggle Add to Cart / Sold Out, and update the URL with `?variant=`. Wrap the option UI in `{% unless product.has_only_default_variant %}`. |
| C4 | `templates/` | **Missing core templates:** `page` (every page not assigned to kits or gallery, e.g. Contact, About, FAQ, the future Team Orders page before reassignment), `404`, `search`, `list-collections` (`/collections`). | Broken links show an error instead of a branded 404. Any new page the merchant creates has no template. `/search` and `/collections` are dead. | Add `page.json` + `main-page`, `404.json` + `main-404`, `search.json` + `main-search`, and `list-collections.json` + `main-list-collections`, all styled with the existing tokens. |

### HIGH

| # | Where | What's wrong | Why it matters | Fix |
|---|---|---|---|---|
| H1 | `config/settings_schema.json` (now `[]`) | The sync commit `c21952b` **deleted the entire global schema**: `theme_info`, favicon, `logo_light`, `logo_dark`, email, WhatsApp and Instagram. The code still reads them: `theme.liquid:10`, `header.liquid:7`, `footer.liquid:3`, `page-kits.liquid:182`. | Logos and favicon cannot be set in the customizer, so the site shows plain-text "AERON" in the header and footer. The WhatsApp CTA on the kits page can't be configured. Pushing this repo would remove those settings from the live editor. | Restore the schema from `0622f1d` (`git show 0622f1d:config/settings_schema.json`) and drop the unused `stripe_deposit`. Then check whether the live theme really has an empty schema. |
| H2 | `templates/page.kits.json` | The template has **no `faq` blocks and no `deposit_product_url`**. Section presets don't apply to JSON templates, so the "Common Questions." heading renders with nothing under it (`page-kits.liquid:155-171`), and the deposit redirect never happens. | An empty FAQ on the money page looks unfinished. The deposit flow is dead. | Seed the six FAQ blocks and the deposit URL into the template JSON, after pulling from live. Hide the FAQ section when there are no blocks. |
| H3 | `sections/main-product.liquid` | <ul><li>Thumbnail clicks target `.pdp-main-img`, which doesn't exist (`:6`, `:11`). This throws a JS error and the gallery doesn't work.</li><li>The selected option has no visible state: radios are `display:none` (`:28`) and no `:checked` CSS exists. The unused `.variant-pill` styles in `aeron.css:218-225` were clearly meant for this.</li><li>Radios that are `display:none` can't be reached by keyboard.</li><li>The price never updates (`:19`).</li><li>Sold out is product-level only (`:39`).</li><li>On mobile, the wrapper keeps `padding:0 60px` (`:2`), leaving about 255px of content on a 375px phone.</li></ul> | The PDP is where sock sales and the deposit happen. A shopper can't tell which size they picked. | Add the class to the main image, use visually-hidden inputs with `.variant-pill` styles, and apply the variant JS from C3. Mark unavailable values with `.sold-out`. Make the side padding responsive. Show `compare_at_price` when it is set. |
| H4 | `locales/` (only `en.default.json`, 3 keys, none used) | **No French.** Every string is hard-coded English in Liquid, so adding `fr.json` alone won't translate anything. | Quebec's Charter of the French Language (strengthened by Bill 96) requires commercial content aimed at Quebec consumers to be available in French; confirm the specifics with counsel. French also lifts conversion with francophone clubs and parents. | Phase it: (1) move UI strings into `locales/en.default.json` + `locales/fr.json` and use the `t` filter; (2) enable French in Settings → Languages; (3) translate section and block content (editor text) with Shopify's Translate & Adapt app; (4) add a language switcher (`localization` form) in the header and mobile menu. |
| H5 | `templates/index.json` and home sections | **Placeholder content appears to be live:** the testimonial "Replace this with a real quote from your captain." (`index.json`, block `q3`), "Upload kit photo in theme editor" (`home-kit-feature.liquid:21`) and grey image placeholders in the photo strip and gallery teaser. None of these sections have images in the template JSON. | Placeholders on a premium homepage destroy trust. | Replace the content in the editor. In code, render placeholders only when `request.design_mode` is true, so customers never see them. |
| H6 | `assets/collar-*.png` (6 files, **5.3 MB** total, ~880 KB each); `page-kits.liquid:114-119` | Full-size PNGs are served through `asset_url`, which can't resize. They are shown as roughly 300px cards. | On mobile data the kits page alone downloads more than 5 MB of images. | Re-export at 600px as WebP or high-quality JPEG (each under ~60 KB). Better: upload to Files or add `image_picker` settings and use `image_url: width` with `srcset`. Add `width`/`height`. |
| H7 | `snippets/popup.liquid:26, 42-60`; `assets/aeron.js:84` | <ul><li>The popup shows "You're in" and the code **AERON10** even when signup fails (`catch` → success).</li><li>The code is in the page HTML for anyone to read.</li><li>The fetch can't complete Shopify's bot challenge, so signups may silently fail.</li><li>It interrupts every page after 2.2s, including the kits form mid-configuration.</li><li>No `role="dialog"`, Esc key or focus trap.</li></ul> | The discount leaks and the email list gets no real signups. Interrupting the main conversion page with a $10 offer cheapens a premium brand. | Let the form post normally (or check `response.ok` and the redirect URL). Reveal the code only on `customer_posted=true`. Use a unique code or a Shopify Email automation. Suppress the popup on `/pages/kits` and the cart, and trigger on scroll depth or exit intent. Add dialog semantics, Esc, a focus trap and focus return. |
| H8 | `snippets/mobile-menu.liquid:1`; `sections/header.liquid:24` | The mobile menu has `aria-hidden="true"` permanently, even when open. The burger button has no `aria-expanded` or `aria-controls`. Links in the off-screen menu stay focusable while it's closed. | Screen-reader users on mobile can't navigate. Keyboard users tab into invisible links. | Toggle `aria-hidden`/`inert` and `aria-expanded` in `toggleMenu`. Close on Esc. Move focus into the menu when it opens. |
| H9 | `sections/footer.liquid` | The footer has no policy links (refund, shipping, privacy, terms), no contact email or phone, no Instagram link (the setting existed) and no payment icons. | These are trust signals expected on any store taking deposits. The links are also expected for Shopify Payments and consumer-protection compliance. | Add a policies list (`shop.policies`), contact block, social links, `payment_type_svg_tag` icons and the language switcher. |

### MEDIUM

| # | Where | What's wrong | Why it matters | Fix |
|---|---|---|---|---|
| M1 | Global; `aeron.css` has 0 `prefers-reduced-motion` rules | Several things animate with no motion-sensitivity guard: reveals, the infinite marquee and photo strip, the infinite gold-flow gradient on **every** button, the hero slam animation and the particle canvas. The moving strips have no pause control apart from hover. | This affects vestibular-sensitive users, and moving content that runs over 5s without a pause control fails WCAG 2.2.2. | Add a global `@media (prefers-reduced-motion: reduce)` block. Pause strips on `:focus-within` and when off-screen. See the animation plan. |
| M2 | `layout/theme.liquid:17-19, 30` | The body is `opacity:0` until `DOMContentLoaded`. `.reveal` elements are `opacity:0` with no fallback if JS doesn't run. | It delays first paint and LCP on every page. Content stays invisible if JS fails. | Remove the body fade. Gate reveals behind a `.js` class on `<html>` that a tiny inline script sets. |
| M3 | `assets/aeron.css:4`, `aeron.js:6-15` | `cursor:none` hides the system cursor for every mouse user. Hover enlargement only binds to elements that exist at load. | Precision, visibility and accessibility suffer. It also feels laggy on low-end laptops. | Keep the native cursor and make the custom ring decorative. Or limit it to the hero and gallery, with `pointer:fine` and reduced-motion checks. |
| M4 | `aeron.css` throughout | **Contrast failures (measured):** labels `rgba(15,26,43,.38)` on white **2.4:1**; `.kicker` `#A88B4A` on white **3.25:1** at 10px; body text `rgba(255,255,255,.38)` on navy **3.5:1**; `.25` on navy **2.3:1**; marquee items gold at 20% opacity, about **1.3:1**. | WCAG AA needs 4.5:1 for small text. Light grey labels on light grey also hurt readability on phones outdoors. | Raise to at least `.6` alpha (navy on white) and `.62` (white on navy). Use `#8C7238` for small gold text on white. |
| M5 | `page-kits.liquid:63-119`, `:204-215` | The configurator option cards are `<div onclick>`, with no keyboard access, role or state. Form `<label>`s aren't associated with their inputs. | Keyboard and screen-reader users can't configure a kit. Tapping a label doesn't focus its field. | Use `<button type="button" aria-pressed>` or radio/checkbox inputs styled as cards. Add `for`/`id` pairs. |
| M6 | `layout/theme.liquid:7`; all sections | <ul><li>Only **one `<h1>` site-wide** (PDP). Home, kits, gallery and collection pages have none; headings are `<div>`s.</li><li>The homepage `<title>` reads like "AERON \| AERON".</li><li>No Open Graph or Twitter tags.</li><li>No Product or Organization JSON-LD.</li></ul> | SEO and social share previews (WhatsApp and Instagram links are your main sharing channels). | Semantic `h1`/`h2` per page. Use `{% unless template == 'index' %}` around the title suffix. Add a `meta-tags` snippet with OG tags. Add `{{ product \| structured_data }}` on the PDP. |
| M7 | 19 Theme Check errors / 17 `img_url` warnings across all sections | The deprecated `img_url` filter is used with no `srcset`/`sizes` and missing `width`/`height`. Hero and CTA backgrounds are CSS `background-image` at 1800px / 1600px for phones too. | Layout shift and oversized downloads on mobile. | Switch to `image_url` + `image_tag` with `widths`/`sizes`. Use `<img>` with `object-fit` for the hero and CTA backgrounds, plus `fetchpriority="high"` on the hero. |
| M8 | `sections/collection-socks.liquid` | This is the **only collection template**, but it hard-codes the "Launch Pads™ / SOCKS" hero (`:1-8`) and three "Coming Soon" cards (`:39-53`) for every collection, including `/collections/all`. There is no sorting or filtering and no pagination: `collection.products` caps at 50. The empty state is admin-facing ("Add your grip sock products in Shopify Admin…", `:35`). | It's wrong for any collection other than grip socks, and the empty state leaks admin instructions. | Rename it `main-collection`. Use `collection.title`/`description`/`image` with settings to override. Make "Coming Soon" cards blocks. Add `{% paginate %}`, a sort `<select>` (`collection.sort_options`) and Storefront Filtering (`collection.filters`). Write a customer-facing empty state. Keep a `collection.grip-socks.json` alternate for the bespoke hero. |
| M9 | `page-kits.liquid:26, 181`; `page-gallery.liquid:4-7, 34-37`; `mobile-menu.liquid:2-7` | Copy is hard-coded while matching settings exist but are ignored (`price_from`/`price`/`price_unit`, `proj_body`). The gallery hero says "Four Montréal clubs". The mobile menu is hard-coded and doesn't follow the header nav blocks. | Copy drifts out of date, and it blocks translation (H4). | Wire up the existing settings and add settings for the gallery copy. Drive both navs from a Shopify menu (`linklists.main-menu`). |
| M10 | `home-cta-banner` default, `page-kits.liquid:181`, kits FAQ preset vs `team-orders` branch | Inconsistent promises: "$20 deposit · mockup in 24h · production 7–15 business days" vs "50% deposit · proof in 3–5 days · production 3–4 weeks". | Mixed messages on deposit and lead time create distrust and support load. | Decide one offer and keep it in one place (a global "Offer" settings group referenced everywhere). |
| M11 | `assets/aeron.js:96-105` vs `page-kits.liquid` static text | Pricing is duplicated: the tier tables are in JS and the same numbers are hard-coded as text. | A price change made in one place shows wrong prices. | Render the tiers from section settings or blocks into a `data-` JSON attribute that JS reads. |
| M12 | `layout/password.liquid:10, 24`; `templates/` (no `password.*`) | `content_for_layout` is output twice, once inside `<head>`. There is no `password` template. | The storefront password page may break whenever the store is locked (launches, drops). | Remove line 10. Add `templates/password.json` + `main-password` (or a `password.liquid` template). |
| M13 | `templates/` | `gift_card.liquid` is missing. `customers/*` (login, register, account, order, addresses, reset/activate) are missing, which only matters with **classic** customer accounts. | Gift card emails link to a broken page. Classic-account logins break. | Add `gift_card.liquid`. Check Settings → Customer accounts: with new customer accounts no templates are needed; otherwise add the `customers/*` set. |
| M14 | `sections/home-hero.liquid:67-98` | The particle canvas runs `requestAnimationFrame` forever, even off-screen or in a background tab. It is not DPR-aware and redraws O(n²) lines every frame. | Battery and CPU drain on phones and laptops. | Pause with an IntersectionObserver and `visibilitychange`. Skip it under reduced motion, cap at 30fps and scale for `devicePixelRatio`. |
| M15 | `layout/theme.liquid:13` | 4 Google Font families and 12 weights load from a render-blocking third-party stylesheet. | It slows first render (Theme Check `RemoteAsset`). | Trim to the weights actually used (likely Orbitron 700/900, Barlow Condensed 400/600/700, Barlow 400). Preload the display face, or self-host the `.woff2` files in `assets/`. |

### LOW

| # | Where | What's wrong | Fix |
|---|---|---|---|
| L1 | `header.liquid:19`, `mobile-menu.liquid:4-7`, section defaults | Hard-coded routes (`/cart`, `/collections/grip-socks`, `/pages/kits`). | Use `routes.*`, plus menu or URL settings. |
| L2 | `home-photo-strip.liquid:21-38` | The loop duplicates each item for the infinite scroll, so screen readers hear every team twice. `shopify_attributes` is duplicated. | Add `aria-hidden="true"` and `alt=""` on the second copy. Put `shopify_attributes` on the first copy only. |
| L3 | `header.liquid:8` | The logo is requested at 200px but displayed with fixed `width="120" height="32"`, so non-matching aspect ratios distort. | Use `image_tag` with `widths` and the real aspect ratio. |
| L4 | `CLAUDE.md` | Out of date: it describes global settings that no longer exist and doesn't mention the empty schema. | Update after the fixes land. |
| L5 | Tooling | Shopify CLI 3.94.1 is installed; 4.9.4 is available. | `brew upgrade shopify-cli`. |
| L6 | Dead code | See next section. | Remove. |

---

## Redundant code — safe to remove

| Item | Location | Notes |
|---|---|---|
| `window.submitPopup` (Mailchimp POST) | `assets/aeron.js:72-80` | Nothing calls it. It also publishes your Mailchimp list IDs. |
| Stat counters (`[data-target]` observer) | `assets/aeron.js:45-60` | No element uses `data-target`. Keep it only if a stats strip is added (see animation plan). |
| Netlify plumbing | `page-kits.liquid:199-201` (`data-netlify`, `data-netlify-honeypot`, `form-name`, `bot-field`) | Removed as part of C1. |
| Logo file upload + `window.showFileNames` + `.file-upload` CSS | `page-kits.liquid:217-223`, `aeron.js:87-91`, `aeron.css:149-155` | Shopify contact forms can't carry files. Replace with an email instruction (C1). |
| Unused CSS classes | `aeron.css` | `about-grid`, `what-grid`, `proc-grid`/`proc-card`/`proc-bar`, `stats-strip`/`stat-num`/`stat-lbl`, `pu-inner`, `nav-dark` (4 rules), `nav-logo-inv`. **Keep** `variant-*` and `sold-out` (reuse them for H3). **Keep** `aeron-btn-outline` (the `team-orders` branch uses it). |
| `stripe_deposit` setting | old `settings_schema.json` | Never read. Drop it when restoring the schema (H1). |
| Unused section settings | `page-kits` schema: `price_from`, `price`, `price_unit`, `proj_body` | Wire them up (M9) rather than delete. |
| Duplicate `content_for_layout` | `layout/password.liquid:10` | M12. |
| Comment "Override submitPopup" | `snippets/popup.liquid:33` | Stale once `submitPopup` is gone. |
| Duplicate responsive rules | `aeron.css:243-257` vs `:260-308` | The "MOBILE FIXES v3" block repeats `RESPONSIVE` with `!important` (e.g. `.section`, `.f-row`, `.gallery-grid`, `.proc-grid`, `.stats-strip`). Merge into one block. |
| Decision: `team-orders` branch | branch only | You prefer the existing kits form. Once C1 is fixed, either drop the branch or port only its roster builder and validation into the kits form later. |

---

## Forms inventory

| Form | File:line | Type | Field names | Required | Success / error | Spam protection | Submits? |
|---|---|---|---|---|---|---|---|
| **Start a Project (kit inquiry)** — your existing team form | `sections/page-kits.liquid:199`, JS `aeron.js:168` | Plain `<form>` with Netlify attributes | `team-name`, `your-name`, `email`, `phone`, `kit-type`, `quantity`, `notes`, `logo-files`, `supplier-summary` (configurator summary) | team-name, your-name, email | Client-side success **always** shown; no error handling | Netlify honeypot (doesn't work on Shopify) | **No.** Nothing is sent (C1) |
| Newsletter popup | `snippets/popup.liquid:8` + inline JS `:34-61` | `{% form 'customer' %}`, intercepted by `fetch('/contact')` | `contact[email]`, `contact[tags]=newsletter,aeron10-eligible` | email | Success **always** shown (even on failure); `form.errors` only renders on a full reload, which never happens | Shopify built-in bot protection, which the fetch can't complete | **Unreliable** (H7) |
| Mailchimp popup handler | `assets/aeron.js:72` | JS `fetch` no-cors | `EMAIL` | — | — | — | Dead code |
| Product form | `sections/main-product.liquid:20` | `{% form 'product' %}` | `id`, `option-N`, `quantity` | — | Redirects to `/cart` (missing) | n/a | **Breaks** (C2, C3) |
| Storefront password | `layout/password.liquid:27` | `{% form 'storefront_password' %}` | `password` | — | Error text shown | n/a | Yes (needs template, M12) |
| Team Orders | `team-orders` branch only | `{% form 'contact' %}` | `contact[…]` | 5 fields | `posted_successfully?` + `default_errors` | Shopify built-in | Not on `main` |

---

## Brand & conversion assessment

- **Hierarchy and look:** These are strong and distinctive: navy/gold, Bebas/Orbitron display type, generous spacing. It reads premium on desktop.
- **Main CTA:** "Start a Project" is consistently placed (header, hero area, CTA banner, gallery, footer), which is good. But it leads to the broken form (C1). The hero's two buttons are "The APEX Kit" and "Our Teams", and neither is the revenue action. Make the primary hero button "Start a Team Order" and the secondary "See the APEX Kit".
- **Clarity of the offer:** Price "from $45", deposit and timeline are visible, but they contradict each other across pages (M10). The configurator is a strong selling tool; give it one clear next step after the estimate.
- **Trust signals:** These are thin. Placeholder testimonials and images are live (H5), there are no policies, contact details or social links in the footer (H9), no real team photos, and no guarantee badge near the CTA. The "money-back on the $20" message exists only deep on the kits page. Add a trust row (real club logos, "X teams kitted", guarantee, Montréal-made) near the hero and the form.
- **Mobile:** The responsive overrides exist, but the PDP padding is broken (H3), hover-only interactions are common, and the popup interrupts after 2.2s. The text contrast issues are worse on phones outdoors (M4).
- **Language:** English-only in Montréal (H4) costs francophone clubs, schools and parents.

---

## Animation plan (proposal only — not implemented)

Principles:
- Use vanilla CSS/JS. No library is needed; if one is ever added, cap it at under 5 KB.
- Animate only `transform` and `opacity`.
- Wrap everything in `@media (prefers-reduced-motion: no-preference)` and keep a static fallback.
- Pause anything off-screen.
- Animations must never delay content (no body fade).

1. **Global motion guard (prerequisite).**
   - Under `prefers-reduced-motion: reduce`, reveals show instantly and marquees and the canvas stop.
   - Keep the gold gradient static instead of looping.
   - A `.js` class on `<html>` gates every hidden-until-revealed state.
2. **Hero entrance.**
   - Replace the "slam" with a mask reveal per title line: `clip-path: inset(0 0 100% 0)` → `inset(0)`, staggered 80ms per line, then the gold line sweeps in.
   - The eyebrow and CTAs fade up 12px.
   - Total under 1.2s, and the CTA becomes interactive immediately.
3. **Scroll reveals (refine the existing ones).**
   - Shorter travel (16px) and a 600ms ease-out.
   - Stagger children via a `--i` CSS variable set in Liquid (`forloop.index0`).
   - Each element animates once.
   - Images get a subtle `clip-path` wipe plus a 1.04 → 1 scale.
4. **Hover states.**
   - A gold underline that sweeps in from the left for nav and text links (already partly there; extend it to footer links).
   - Cards lift 2px with a soft navy shadow and a gold border fade.
   - Gold buttons run the gradient flow **only on hover/focus** instead of permanently. That's calmer and more premium, and costs less.
5. **Marquee and photo strip.**
   - Keep them, but pause when off-screen (IntersectionObserver toggles `animation-play-state`) and on `:focus-within`.
   - Add a small pause button for WCAG 2.2.2.
   - Use edge fade masks via `mask-image` instead of overlay pseudo-elements.
6. **Header.**
   - Hide the header on scroll down and show it on scroll up (`transform: translateY(-100%)`), with a 200ms ease.
   - The "Start a Project" button gets a soft gold glow pulse once after 3s on the kits page only.
7. **Configurator micro-interactions.**
   - The price total counts up or down on change (the existing counter code can be reused).
   - The selected option card shows a gold check that scales in.
   - The quantity slider thumb grows while dragging.
8. **Page transitions.**
   - Cross-document **View Transitions** with CSS only: `@view-transition { navigation: auto; }` plus a 200ms fade/slide on `main`.
   - No JS. Browsers without support simply navigate normally.
9. **Social proof counter.** A stats strip ("120+ teams kitted · 3,000+ kits · Montréal-made") with the existing count-up code, using real numbers only.
10. **Hero canvas.** Keep it as the no-image fallback, but pause it off-screen and when the tab is hidden, cap it at 30fps, and skip it on reduced motion and save-data.

Performance budget: no new network requests, less than 3 KB of added JS, and no layout-triggering properties. Target Lighthouse Performance ≥ 90 on mobile for home and kits.

---

## Fix plan (priority order)

Each step is one logical commit on a new branch `fixes`. Nothing is pushed to `main`.

0. **Sync check.** Run `shopify theme pull` into a scratch branch and diff it against `main`, to confirm which content findings (H2, H5) are real on live. Restore `config/settings_schema.json` from `0622f1d`, without `stripe_deposit` (H1).
1. **C1:** Convert the kits "Start a Project" form to `{% form 'contact' %}`. Keep its design, include the configurator summary, handle success and errors properly, replace the upload with an email note, and make the deposit step follow a real success.
2. **C2:** Add a cart template and section: update and remove items, subtotal, notes, checkout button and empty state.
3. **C3 + H3:** Fix the product page: variant JS, thumbnails, selected and sold-out pill states, live price, default-variant handling, mobile padding.
4. **C4:** Add `page`, `404`, `search` and `list-collections` templates.
5. **M12 + M13:** Add `password` and `gift_card` templates, fix the password layout, and add `customers/*` if classic accounts are in use.
6. **H2:** Seed the kits FAQ blocks and deposit URL. Hide the FAQ when it is empty.
7. **H5:** Show placeholders only in the theme editor (`request.design_mode`). Flag the content you need to supply: photos and real quotes.
8. **H9:** Footer with policies, contact, social and payment icons.
9. **H7:** Popup: real success detection, code revealed only on success, suppressed on kits and cart, better trigger, dialog accessibility.
10. **H6:** Compress or replace the collar images.
11. **H8 + M5 + M3:** Accessibility for the mobile menu and configurator, plus restoring the native cursor.
12. **M4:** Contrast tokens.
13. **M1 + M2 + M14:** Reduced motion, remove the body fade, the reveal fallback, and pause the canvas.
14. **M6:** Headings, title, Open Graph and JSON-LD.
15. **M7 + M15:** `image_url`/`srcset` migration (clears all 19 Theme Check errors) and font trimming.
16. **M8:** Generic collection template with sort, filter and pagination, plus a grip-socks alternate.
17. **M9 + M10 + M11:** Wire the unused settings, a single source for the offer and timeline, and a single source for pricing.
18. **H4:** French. Extract strings to locales, add `fr.json`, add a language switcher, and run Translate & Adapt for content. This is a large step that may span several commits.
19. **Dead code cleanup** (the table above) and merging the duplicate responsive CSS.
20. **Animation plan,** items 1–10.
21. Update `CLAUDE.md` and upgrade the Shopify CLI.

**Things you need to decide or provide:** the single deposit and timeline offer (M10); whether the store uses new or classic customer accounts (M13); real photos and testimonials (H5); what happens to the `team-orders` branch; and the French copy review (machine translation needs a fluent proofread).
