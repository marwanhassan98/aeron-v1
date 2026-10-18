# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A custom Shopify Online Store 2.0 theme for AERON Sportswear (custom football kits and grip socks, Montréal). It is plain Liquid + one global CSS file + one global JS file. There is no package.json, no build step and no test suite.

## Commands

Development uses the Shopify CLI (not checked in; install it with `npm i -g @shopify/cli`):

```sh
shopify theme dev --store <store>.myshopify.com    # local preview with hot reload
shopify theme check                                 # Liquid/theme linter
shopify theme push --unpublished                    # upload as a new unpublished theme
shopify theme pull                                  # pull merchant edits (config/settings_data.json, templates/*.json) back down
```

Run `shopify theme pull` before you edit `templates/*.json` or `config/settings_data.json`. The theme editor writes to those files, so a push can overwrite the merchant's changes.

## Architecture

- **Layout**: `layout/theme.liquid` loads Google Fonts (Bebas Neue, Orbitron, Barlow Condensed, Barlow), `assets/aeron.css`, and `assets/aeron.js` (deferred). It renders the `popup` and `mobile-menu` snippets plus the `header` and `footer` sections directly with `{% section %}`; there are no section groups. The body starts at `opacity:0` and fades in when `DOMContentLoaded` adds `.ready`.
- **Templates** are JSON. Each one maps to one or more sections:
  - `index.json` contains the `home-*` sections. Their default copy is stored in the template's block settings.
  - `page.kits.json` uses `page-kits` (the APEX kit configurator and the "Start a Project" form). It must be assigned to the page at `/pages/kits`.
  - `page.gallery.json` uses `page-gallery` and must be assigned to `/pages/gallery`.
  - `collection.json` uses `collection-socks`, and `product.json` uses `main-product`.
- **Hardcoded routes**: Nav and CTA links assume `/pages/kits`, `/pages/kits#project`, `/pages/gallery` and `/collections/grip-socks`. These appear in `snippets/mobile-menu.liquid`, header presets and section defaults.
- **Global settings** (`config/settings_schema.json`): logos (`logo_light` for dark backgrounds, `logo_dark` for light ones), favicon, contact email, WhatsApp number and Instagram. `stripe_deposit` is defined there but unused; the deposit URL comes from the `page-kits` section setting `deposit_product_url`.

### aeron.js

One IIFE that handles the custom cursor, nav `.scrolled` state, mobile menu, scroll reveals (`.reveal`, `.reveal-l`, `.reveal-r` gain `.vis`), stat counters (`[data-target]`/`[data-suffix]`), the newsletter popup and the kit configurator.

- Markup calls behaviour through **inline `onclick` handlers bound to `window.*` functions**, for example `toggleMenu`, `openPopup`, `setKit`, `toggleAddon`, `setCollar`, `setQty` and `submitProject`. Do not rename these without updating the Liquid. Many configurator element IDs (`lBase`/`pBase`, `pTotal`, `pShip`, `unitNote` and others) are also looked up by ID from JS.
- The configurator section starts with `if(!document.getElementById('build'))return;`. Code placed after that line only runs on the kits page, so put new global code above it.
- **Pricing is duplicated.** The tier tables `jMOQ`/`sMOQ`, the add-on prices, collar upcharges (passed as `setCollar` arguments in `page-kits.liquid`) and shipping tiers (`getShip`) live in JS. The same numbers also appear as static text in `page-kits.liquid` (`$45 / jersey`, `+$5 / jersey`, the initial `$975.00` total, the FAQ blocks). A price change must be made in both places.
- The project form in `page-kits.liquid` has Netlify attributes (`data-netlify`). `submitProject` POSTs `FormData` to `/`, which Shopify does not process as a form submission. The form then redirects to the `data-deposit` URL, a Shopify product used as a $20 deposit.
- `snippets/popup.liquid` has its own inline script that submits a Shopify `customer` form (tag `newsletter,aeron10-eligible`). It replaces `submitPopup` in `aeron.js`, which posts to Mailchimp. The popup opens 2.2s after load unless `sessionStorage.aeronPopupSeen` is set.

### Styling

- `assets/aeron.css` is a minified, single-line-per-rule global stylesheet with `/* SECTION */` comment headers. Mobile overrides sit at the bottom: `/* RESPONSIVE */` and `/* MOBILE FIXES v3 */` (max-width 900px).
- Sections also use heavy inline `style=""` attributes and per-section `<style>` blocks. When you edit an existing section, follow its local pattern.
- Brand tokens are hardcoded hex values, not CSS variables:
  - navy `#0F1A2B`
  - gold `#C6A962`, with gradient stops `#A88B4A` and `#E8C97A`
  - light grey `#F2F2F2`
- Font roles:
  - Orbitron: buttons and prices
  - Bebas Neue: display headings
  - Barlow Condensed: labels and eyebrows
  - Barlow: body text
- `.aeron-btn` is the animated gold gradient button. The site hides the native cursor (`cursor:none`) on hover-capable devices and draws its own.

## Known issues (as of the initial commit)

- In `main-product.liquid`, thumbnail clicks target `.pdp-main-img`, but the main image does not have that class.
- In `main-product.liquid`, variant radio inputs clear the hidden `id` field and nothing sets it again.
