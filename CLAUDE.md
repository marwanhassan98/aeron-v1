# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A custom Shopify Online Store 2.0 theme for AERON Sportswear (custom football kits and grip socks, Montréal). It is plain Liquid + one global CSS file + one global JS file. There is no package.json, no build step and no test suite.

## Commands

Development uses the Shopify CLI (not checked in; install it with `npm i -g @shopify/cli` or `brew install shopify-cli`):

```sh
shopify theme dev --store <store>.myshopify.com    # local preview with hot reload
shopify theme check                                 # Liquid/theme linter (currently 0 errors, 0 warnings — keep it that way)
shopify theme push --unpublished                    # upload as a new unpublished theme
shopify theme pull                                  # pull merchant edits (config/settings_data.json, templates/*.json) back down
```

Run `shopify theme pull` before you edit `templates/*.json` or `config/settings_data.json`. The theme editor writes to those files, so a push can overwrite the merchant's changes.

## Architecture

- **Layout**: `layout/theme.liquid` renders the `fonts` and `meta-tags` snippets, `assets/aeron.css`, a skip link, the `popup` snippet (not on cart or the kits page), and the `header` and `footer` sections directly with `{% section %}` (no section groups). `aeron.js` loads deferred. A tiny inline script swaps `html.no-js` → `html.js`; CSS that hides content until JS runs (reveals, cart update button) is scoped under `.js`.
- **Static sections** (`header`, `footer`) must use `"default"` blocks in their schema; `presets` never apply to sections rendered with `{% section %}`.
- **Templates** are JSON (plus `gift_card.liquid`):
  - `index.json` → `home-*` sections. Copy lives in the template's block settings.
  - `page.kits.json` → `page-kits` (APEX configurator, FAQ blocks, "Start a Project" form). Must be assigned to `/pages/kits`.
  - `page.gallery.json` → `page-gallery`, assigned to `/pages/gallery`.
  - `page.json`, `404.json`, `search.json`, `list-collections.json`, `cart.json`, `password.json` (uses `layout/password.liquid`) → their `main-*` sections.
  - `collection.json` → generic `main-collection`. `collection.grip-socks.json` → same section with the Launch Pads™ hero and "coming soon" blocks; it must be assigned to the Grip Socks collection in admin.
  - `product.json` → `main-product`.
- Customer accounts use Shopify's **new customer accounts**, so there are no `customers/*` templates.
- **Hardcoded routes**: CTAs default to `/pages/kits`, `/pages/kits#project`, `/pages/gallery`. The header nav uses a Shopify menu (`menu` setting) or falls back to its Nav Link blocks; the mobile menu snippet is rendered by the header and shares those links.
- **Snippets**: `product-card`, `pagination`, `offer-line`, `language-switcher`, `meta-tags`, `fonts`, `mobile-menu`, `popup`.

### Global settings (`config/settings_schema.json`)

- Brand: `favicon`, `logo_light` (dark backgrounds), `logo_dark` (light backgrounds). Contact: `email`, `whatsapp`, `instagram`.
- **Offer**: `offer_deposit` ("50%") and `offer_timeline` ("4–5 weeks, design included"). Render with `{% render 'offer-line' %}` (optionally `key: 'offer.cta_line'` / `'offer.deposit_to_start'`). Never hard-code the deposit or lead time.
- **Kit pricing (CAD)**: `kit_jersey_*`, `kit_set_*` tiers (10/50/100/200/500), add-ons (`kit_names`, `kit_sponsor`, `kit_emb`, `kit_socks`), collar upcharges (`kit_collar_*`), shipping (`kit_ship_small`, `kit_ship_30`, `kit_ship_50`, `kit_free_ship_qty`). `page-kits` renders them into `#kitPricing` JSON that `aeron.js` reads, and uses the same settings for every printed price. Never hard-code a price in Liquid or JS.
- **Newsletter popup**: `popup_enabled`, `popup_heading`, `popup_text`, `popup_code`, `popup_delay`.

### aeron.js

One IIFE: decorative cursor ring, nav (`.scrolled`, hide-on-scroll-down), accessible mobile menu, scroll reveals (`.reveal` gains `.vis`, siblings staggered via `--i`), loop pause buttons and off-screen pausing, the newsletter popup dialog, and the kit configurator.

- Configurator markup still calls `window.*` functions through inline `onclick` (`setKit`, `toggleAddon`, `setCollar`, `setQty`, `adjSpon`). Don't rename them without updating `page-kits.liquid`. Element IDs (`lBase`/`pBase`, `pTotal`, `pShip`, `unitNote`, `kitPricing`, `kitStrings`, …) are looked up by ID.
- The configurator section starts with `if(!document.getElementById('build'))return;`. Code after that line only runs on the kits page; put global code above it.
- Customer-facing configurator strings come from `#kitStrings` (translated `kits.js.*` locale keys).

### Forms

- **Start a Project** (`page-kits`, `#projForm`) is a `{% form 'contact' %}`. Fields use `contact[...]` names; `submitProject` copies the configurator into `contact[Configurator Summary]` and lets the form post normally. Success/errors come from `form.posted_successfully?` / `form.errors`. Shopify contact forms cannot carry file uploads — logos are emailed.
- **Newsletter popup** (`snippets/popup.liquid`) is a `{% form 'customer' %}` that posts normally; the discount code is only rendered after `form.posted_successfully?`.

### Translations

- UI strings live in `locales/en.default.json` and `locales/fr.json` (Canadian French). Keep the two files key-for-key; keys ending in `_html` may contain markup. Use the `t` filter for any new customer-facing text in Liquid — never hard-code English in markup.
- Section/block settings and template content are translated in Shopify's Translate & Adapt app.

### Styling

- `assets/aeron.css` is a minified, single-line-per-rule global stylesheet with `/* SECTION */` comment headers. One `/* RESPONSIVE */` block (max-width 900px) uses `!important` to override inline section styles. `/* MOTION */` holds animations inside `prefers-reduced-motion: no-preference`; the `/* REDUCED MOTION */` block must stay last.
- Sections also use inline `style=""` attributes and per-section `<style>` blocks. When you edit an existing section, follow its local pattern.
- Brand tokens are hardcoded hex values, not CSS variables: navy `#0F1A2B`; gold `#C6A962` (gradient stops `#A88B4A`, `#E8C97A`); small gold text on light backgrounds `#7A6331`; light grey `#F2F2F2`.
- Contrast: secondary text is navy or white at **66% opacity minimum** (WCAG AA). Lower opacities are for decorative watermarks only.
- Fonts are self-hosted WOFF2 in `assets/` (latin subset) declared in `snippets/fonts.liquid`: Orbitron 700/900 (buttons, prices), Bebas Neue (display), Barlow Condensed 400/600/700 (labels, eyebrows), Barlow 400/600 (body). Adding a weight means adding a file and an `@font-face`.
- Images: use `image_url` + `image_tag` with `widths`/`sizes` (never `img_url`).
- `.aeron-btn` is the gold gradient button (flows on hover/focus). The system cursor is always visible; the gold ring is decorative.
