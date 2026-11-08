# Design Reference
> Blueprint grid under a black moon — faint graph lines, white type, one violet spark.

Visual reference inspired by a dark command-center style. Colour values are normalised to valid hex; the primary button is white-filled.

**Theme:** dark

Dovetail operates in a midnight command-center language: a near-black canvas structured by a faint blueprint grid, with white type and a single soft indigo accent. Surfaces stack from pure black to charcoal, each step subtle enough to feel like elevation through luminance rather than shadow. The system is compact and data-dense — Inter carries every reading load, JetBrains Mono stamps categorical labels, and 8px radii keep containers crisp rather than soft. Color is rationed: most of the interface stays achromatic, with #6798ff appearing only as functional punctuation on icons, stat markers, and chart elements.

## Tokens — Colors

| Name | Value | Token | Role |
|------|-------|-------|------|
| Soft Indigo | `#6798ff` | `--color-soft-indigo` | Brand accent — iconography, stat markers, chart series, link states; the single chromatic note in an otherwise achromatic system |
| Pure Black | `#000000` | `--color-pure-black` | Deepest surface — modal backdrops, full-bleed image fills, inline SVG fills |
| Carbon | `#0a0a0a` | `--color-carbon` | Page canvas — the primary background; near-black with no warmth |
| Graphite | `#141414` | `--color-graphite` | Card surface — one step above the canvas to delineate content blocks |
| Iron | `#1e1e1e` | `--color-iron` | Elevated surface and border — secondary cards, table rows, subtle dividers |
| Slate Edge | `#313131` | `--color-slate-edge` | Hairline borders on imagery and nested elements — visible but recessive |
| Smoke | `#454545` | `--color-smoke` | Dark borders and separators for elevated surfaces and inverted UI. Do not promote it to the primary CTA color |
| Mist | `#7c7c7c` | `--color-mist` | Disabled or low-emphasis button text |
| Ash | `#a7a7a7` | `--color-ash` | Secondary text — captions, metadata, helper text, muted labels |
| Bone | `#ffffff` | `--color-bone` | Primary text, icons, filled CTA background, card surface inverts; the dominant light element in the dark system |

## Tokens — Typography

### Inter — primary typeface for headings, body, navigation, and buttons. `--font-inter`
- **Weights:** 400, 500, 600
- **Sizes:** 14, 16, 20, 24, 40, 56, 64
- **Line height:** 1.13–1.57
- **Letter spacing:** -2.3px at 64px, -2.0px at 56px, -0.84px at 40px, -0.6px at 24px, -0.5px at 20px, -0.25px at 16px
- **OpenType features:** `"liga"`
- Weight 400 is the reading default; 500–600 for labels and emphasis. Negative letter-spacing tightens at scale (–0.036em at 64px tapering to –0.012em at 20px).

### JetBrains Mono — all-caps category labels, section eyebrows (e.g. "HOW IT WORKS"), beta tags, and micro-text. `--font-jetbrains-mono`
- **Weights:** 400
- **Sizes:** 12, 14
- **Line height:** 1.00, 1.40
- **Letter spacing:** +0.85px at 12px, +1.16px at 14px
- Wide tracking (+0.071em to +0.083em) gives the type a stamped, technical feel — it reads as metadata, not copy.

### Type Scale

| Role | Size | Line Height | Letter Spacing | Token |
|------|------|-------------|----------------|-------|
| caption | 12px | 1.4 | 0.85px | `--text-caption` |
| body-sm | 14px | 1.57 | -0.25px | `--text-body-sm` |
| body | 16px | 1.5 | -0.25px | `--text-body` |
| heading-sm | 20px | 1.33 | -0.42px | `--text-heading-sm` |
| heading | 24px | 1.29 | -0.6px | `--text-heading` |
| heading-lg | 40px | 1.2 | -0.84px | `--text-heading-lg` |
| display-sm | 56px | 1.14 | -1.74px | `--text-display-sm` |
| display | 64px | 1.13 | -2.3px | `--text-display` |

## Tokens — Spacing & Shapes

**Base unit:** 8px · **Density:** compact

Spacing scale: 8, 16, 24, 32, 40, 64, 96, 200 (px) as `--spacing-8` … `--spacing-200`.

| Element | Radius |
|---------|--------|
| tags | 4px |
| cards | 8px |
| inputs | 8px |
| buttons | 8px |
| navPills | 9999px |

### Layout
- **Page max-width:** 1200px
- **Section gap:** 80px
- **Card padding:** 24px
- **Element gap:** 8px

## Components

### Primary Button (Filled)
White background (#ffffff), black text (#0a0a0a), 8px radius, 8px 16px padding, Inter 14px/500. High-emphasis call to action; the only high-luminance element on most screens.

### Secondary Button (Ghost)
Transparent background, 1px #454545 border, white text, 8px radius, 8px 16px padding, Inter 14px/500. Medium-emphasis action.

### Navigation Pill
Pill shape (9999px radius), transparent background, white text, 8px 14px padding, Inter 14px/500. No border.

### Dashboard Preview Card / Card
Charcoal surface (#141414) with #1e1e1e borders, 8px radius, 24px padding. Header bar (icon + title + tab toggle), date-range selector, bar chart with multi-color series, sortable data table.

### Stat Block
Large numeric value in Inter 40px/500 white, preceded by a small #6798ff icon, followed by a 16px/500 white label and a 14px/400 #a7a7a7 caption. Three blocks in a row.

### Section Eyebrow Label
JetBrains Mono 12px/400, uppercase, +0.85px letter-spacing, #a7a7a7. Sits 24–32px above the section heading.

### BETA Tag
Small inline label in JetBrains Mono 12px #a7a7a7 or a subtle bordered pill.

### Chart Bar (Data Series)
Vertical bars with rounded tops, ~6–8px wide, 2–4px gaps, multi-color accents (indigo, magenta, orange, green) on the charcoal card. Multi-color is allowed only in data visualisation.

## Do's and Don'ts

### Do
- Use #0a0a0a as the universal page background.
- Stack surfaces #000000 → #0a0a0a → #141414 → #1e1e1e → #313131 to communicate elevation through luminance, not shadow.
- Apply #6798ff only to functional accents (stat icons, chart series, link hovers) — never as a large fill.
- Set headings in Inter 400–500 with negative letter-spacing.
- Stamp section eyebrows in JetBrains Mono 12px, uppercase, with +0.071em tracking and #a7a7a7 color.
- Use 8px as the default radius for buttons, cards and inputs; 4px for tags.
- Pair every primary CTA (white fill) with a ghost secondary in the same group.

### Don't
- Do not introduce a second chromatic accent.
- Do not use drop shadows for elevation.
- Do not center-align body copy.
- Do not use display sizes below 40px in Inter; smaller labels use JetBrains Mono.
- Do not round buttons beyond 8px; pills are for navigation only.
- Do not place colored fills (other than #6798ff on small marks) over the dark canvas.
- Do not use #ffffff as a surface or card background except inside the inverted CTA button.

## Surfaces

| Level | Name | Value | Purpose |
|-------|------|-------|---------|
| 0 | Canvas | `#0a0a0a` | Full-page background |
| 1 | Card | `#141414` | Content blocks, previews, feature cards |
| 2 | Elevated | `#1e1e1e` | Hover states, popovers, nested cards, table headers |
| 3 | Border | `#313131` | Hairline dividers, field borders |
| 4 | Inverted | `#ffffff` | Filled CTA buttons |

## Imagery and Layout

Faint blue-gray grid on the dark canvas (1px lines in #1e1e1e at ~48px cells, fixed background layer, omitted in content-heavy zones). Product mockups (dashboard panels, bar charts, tables) are the main illustration. Icons are small, monochrome, ~1.5px outline stroke, occasionally #6798ff. Full-bleed dark sections with 80px vertical gaps, content in a centered 1200px container. Top nav with pill links and a high-contrast filled CTA on the right.

## Quick Reference
- text: #ffffff
- background: #0a0a0a
- card surface: #141414
- border: #1e1e1e or #313131
- accent: #6798ff
- primary action: white-filled button (#ffffff on #0a0a0a text)

## Quick Start

### CSS Custom Properties

```css
:root {
  --color-soft-indigo: #6798ff;
  --color-pure-black: #000000;
  --color-carbon: #0a0a0a;
  --color-graphite: #141414;
  --color-iron: #1e1e1e;
  --color-slate-edge: #313131;
  --color-smoke: #454545;
  --color-mist: #7c7c7c;
  --color-ash: #a7a7a7;
  --color-bone: #ffffff;

  --font-inter: 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-jetbrains-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;

  --text-caption: 12px;      --leading-caption: 1.4;      --tracking-caption: 0.85px;
  --text-body-sm: 14px;      --leading-body-sm: 1.57;     --tracking-body-sm: -0.25px;
  --text-body: 16px;         --leading-body: 1.5;         --tracking-body: -0.25px;
  --text-heading-sm: 20px;   --leading-heading-sm: 1.33;  --tracking-heading-sm: -0.42px;
  --text-heading: 24px;      --leading-heading: 1.29;     --tracking-heading: -0.6px;
  --text-heading-lg: 40px;   --leading-heading-lg: 1.2;   --tracking-heading-lg: -0.84px;
  --text-display-sm: 56px;   --leading-display-sm: 1.14;  --tracking-display-sm: -1.74px;
  --text-display: 64px;      --leading-display: 1.13;     --tracking-display: -2.3px;

  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;

  --spacing-unit: 8px;
  --spacing-8: 8px;  --spacing-16: 16px; --spacing-24: 24px; --spacing-32: 32px;
  --spacing-40: 40px; --spacing-64: 64px; --spacing-96: 96px; --spacing-200: 200px;

  --page-max-width: 1200px;
  --section-gap: 80px;
  --card-padding: 24px;
  --element-gap: 8px;

  --radius-md: 4px;
  --radius-lg: 8px;
  --radius-full: 66px;
  --radius-tags: 4px;
  --radius-cards: 8px;
  --radius-inputs: 8px;
  --radius-buttons: 8px;
  --radius-navpills: 9999px;

  --surface-canvas: #0a0a0a;
  --surface-card: #141414;
  --surface-elevated: #1e1e1e;
  --surface-border: #313131;
  --surface-inverted: #ffffff;
}
```

### Tailwind v4

```css
@theme {
  --color-soft-indigo: #6798ff;
  --color-pure-black: #000000;
  --color-carbon: #0a0a0a;
  --color-graphite: #141414;
  --color-iron: #1e1e1e;
  --color-slate-edge: #313131;
  --color-smoke: #454545;
  --color-mist: #7c7c7c;
  --color-ash: #a7a7a7;
  --color-bone: #ffffff;

  --font-inter: 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-jetbrains-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;

  --text-caption: 12px;
  --text-body-sm: 14px;
  --text-body: 16px;
  --text-heading-sm: 20px;
  --text-heading: 24px;
  --text-heading-lg: 40px;
  --text-display-sm: 56px;
  --text-display: 64px;

  --spacing-8: 8px;
  --spacing-16: 16px;
  --spacing-24: 24px;
  --spacing-32: 32px;
  --spacing-40: 40px;
  --spacing-64: 64px;
  --spacing-96: 96px;
  --spacing-200: 200px;

  --radius-md: 4px;
  --radius-lg: 8px;
  --radius-full: 66px;
}
```
