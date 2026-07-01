# ReleaseTrack Dashboard — Design System (Atlassian style)

> Enterprise workshop in casual confidence: white canvas, navy ink, one electric-blue action color, large flat rounded components, paired humanist sans. Decorative confetti/hero devices are reserved for marketing surfaces and are NOT used inside this functional dashboard.

**Theme:** light

## Core principle (for this dashboard)
Apply the Atlassian **design system** — color tokens, typography, shape/radius, component styling, do/don'ts — to the existing dashboard structure (dark sidebar + white content, KPIs, charts, tables, forms). Do NOT add marketing devices (hero banners, confetti frames, video blocks, lavender editorial bands). `#1868db` is the single chromatic action color; semantic status colors are allowed only in data visualization (badges/charts), never on buttons/links.

## Tokens — Colors
| Token | Value | Role |
|------|-------|------|
| `--color-atlassian-blue` | `#1868db` | Primary action buttons, active links, focus, icon accents — the single action color |
| `--color-midnight-navy` | `#101214` | Primary text, headings, dark sidebar/panel backgrounds |
| `--color-carbon-edge` | `#292a2e` | Card/input borders, body text, secondary heading |
| `--color-slate-current` | `#1c2b42` | Outlined borders, icon strokes, dividers, tertiary text |
| `--color-muted-indigo` | `#42526e` | Helper text, form labels, metadata, info badge text |
| `--color-pure-white` | `#ffffff` | Page canvas, card surfaces, text on dark |
| `--color-fog-white` | `#f0f1f2` | Muted button bg, secondary surfaces, hairline dividers |
| `--color-ash-gray` | `#b7b9be` | Disabled borders, subtle separators |
| `--color-taxicab-yellow` | `#fca700` | Decorative-only (here: only as data-viz amber for ROLLED_BACK) |
| `--color-lavender-wash` | `#eed7fc` | Decorative-only (not used in functional UI here) |
| blue tint surface | `#e9f2fe` | Brand-tinted highlight/feature wash, info badge bg (blue variant) |

Blue hover: `#1257bd` (darken of #1868db).

## Tokens — Typography
- **Display (headlines/section titles):** Manrope (Charlie Display substitute). Weights 400/500/700/800.
- **Text (body/UI/labels/buttons/inputs):** Inter (Charlie Text substitute). Weights 400/500/700.
- Load via Google Fonts.

Type scale:
| Role | Size | Line height | Tracking |
|------|------|-------------|----------|
| caption | 13px | 1.29 | — |
| body | 16px | 1.5 | — |
| subheading | 20px | 1.4 | — |
| heading-sm | 24px | 1.25 | — |
| heading | 32px | 1.2 | — |
| heading-lg | 48px | 1.14 | — |
| display | 80px | 1.0 | 0.012em |

Pairing rule: Inter handles UI 13–24px; Manrope handles editorial 24–80px. Weight 400–500 default; 700+ for inline emphasis only.

## Tokens — Shape & Spacing
- Base unit 4px. Spacing scale: 4/8/12/16/20/24/32/36/40/48/60/64/68/80/100/200.
- **Radius:** nav 2px · tags/badges 10000px(full pill) · cards 20px · images 5px · inputs 8px · buttons 28px.
- **Shadow (only when elevation needed):** `rgba(9,30,66,0.31) 0 0 1px 0, rgba(9,30,66,0.25) 0 1px 1px 0` — navy-tinted, never neutral black. Default to flat.
- Layout: page max-width 1200px; section gap 64–80px; card padding 24px; element gap 8–16px.

## Surfaces
| Level | Value | Purpose |
|-------|-------|---------|
| Canvas | `#ffffff` | Page background, content sections |
| Soft | `#f0f1f2` | Muted buttons, subtle bands, low-emphasis fills |
| Tinted | `#e9f2fe` | Blue highlight wash, feature card bg |
| Dark panel | `#101214` | Sidebar, inverted KPI card |

## Components
- **Primary button:** filled `#1868db`, white text, Inter 16px/500 (UI 14px ok), radius 28px (full pill), padding 10px 22px, no border, no shadow.
- **Secondary button:** fog `#f0f1f2` bg or transparent, navy text (`#101214`), pill radius.
- **Ghost button:** 1px border `#101214` (or white on dark), transparent fill, pill radius.
- **Card:** white bg, 20px radius, 24px padding, 1px border `#f0f1f2` or the navy micro-shadow, no drop shadow at scale.
- **Info badge:** full-pill, padding 4–6px horizontal, Inter 13px/500. `#42526e` on `#f0f1f2`, or `#1868db` on `#e9f2fe` for brand-tinted.
- **Sidebar:** dark panel `#101214`; active nav uses blue accent; nav text Inter 14px/400.
- **Inputs:** radius 8px, 1px border, focus ring blue `#1868db`.

## Do / Don't
- DO use `#1868db` for every primary action, link, active, focus — the only chromatic action color.
- DO card radius 20px, button radius 28px (full pill); flatness is the point.
- DO pair Manrope 400–500 with Inter 400–500; reserve 700+ for inline emphasis.
- DO use navy-tinted shadow only when elevation is needed; default flat.
- DON'T put yellow/violet/green/lavender on buttons/links/form controls.
- DON'T use heavy/black drop shadows; depth comes from radius + (sparingly) color inversion.
- DON'T use sharp corners on cards/images.
- DON'T use pure black `#000`; dark = `#101214`.
- DON'T put white text on lavender/blue tints; pairs are dark-on-light or white-on-navy.

## Dashboard Adaptation (ReleaseTrack — concrete mapping)
Replace the previous light/green theme. Current → new:
- Primary/links/active/focus/segmented-active: green `#16a35a` → **`#1868db`** everywhere.
- Page canvas white `#ffffff`; text `#101214`; muted/labels `#42526e`; faint `#6b778c`; borders `#dfe1e6`/`#f0f1f2` (hairline), `#292a2e` for stronger.
- **Sidebar:** `#181b19` → **`#101214`**; brand mark blue `#1868db`; active nav item blue (`#1868db` bg, white text) or `#e9f2fe` bg/blue text; inactive muted, hover subtle.
- Header bar: white, 1px bottom border `#f0f1f2`.
- **Buttons:** radius → 28px pill; primary blue filled; secondary fog `#f0f1f2`/navy; ghost 1px border.
- **Cards/sections:** radius 14px → **20px**; padding 24px; flat (hairline border + optional navy micro-shadow).
- **Inputs/select/textarea:** radius 8px; focus ring blue.
- **Badges (StatusTag/EnvironmentTag):** full-pill, Inter 13px/500. Keep **semantic status colors** (data viz only):
  - SUCCESS green, FAILED red, ROLLED_BACK amber `#fca700`, RUNNING blue `#1868db`, QUEUED gray; ACTIVE green, INACTIVE gray, MAINTENANCE amber; env DEV gray / STAGING blue / PRODUCTION indigo. Soft pill bg + readable text.
- **KPIs (5):** white cards radius 20px; "진행 중" value blue `#1868db`; "실패·롤백" value red; the success-rate card = **dark panel `#101214`** with white label + white/blue value (replaces old green-dark card).
- **Charts:** trend stacked bar — 성공 `#1868db` / 실패·롤백 `#de350b` / 진행 중 `#b7b9be`. Status donut 5 colors: SUCCESS `#1868db`, FAILED `#de350b`, ROLLED_BACK `#fca700`, RUNNING `#4c9aff`, QUEUED `#b7b9be`. Blue leads; semantic red/amber retained.
- **Typography:** load Manrope + Inter; h1/section titles Manrope; body/UI Inter. h1 32–40px, card titles 20–24px, body 16px, captions 13px.
- Mono columns (version/branch/commit) keep monospace ("JetBrains Mono").
- No confetti, hero banner, lavender band, or video block.
