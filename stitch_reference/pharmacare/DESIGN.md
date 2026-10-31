---
name: PharmaCare
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#3d4947'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#6d7a77'
  outline-variant: '#bcc9c6'
  surface-tint: '#006a61'
  primary: '#00685f'
  on-primary: '#ffffff'
  primary-container: '#008378'
  on-primary-container: '#f4fffc'
  inverse-primary: '#6bd8cb'
  secondary: '#006398'
  on-secondary: '#ffffff'
  secondary-container: '#5bb8fe'
  on-secondary-container: '#00476e'
  tertiary: '#006947'
  on-tertiary: '#ffffff'
  tertiary-container: '#00855b'
  on-tertiary-container: '#f5fff6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#89f5e7'
  primary-fixed-dim: '#6bd8cb'
  on-primary-fixed: '#00201d'
  on-primary-fixed-variant: '#005049'
  secondary-fixed: '#cce5ff'
  secondary-fixed-dim: '#93ccff'
  on-secondary-fixed: '#001d31'
  on-secondary-fixed-variant: '#004b73'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.025em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.005em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.03em
  mono-data:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: -0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-sm: 0.75rem
  margin: 1.75rem
  margin-sm: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.875rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

This design system embodies high-precision clinical modernism tailored for mission-critical pharmacy operations, wholesale inventory control, and enterprise dispensary networks. The emotional tone projects absolute clinical competence, pharmaceutical trust, low cognitive strain during marathon shifts, and immediate situational clarity.

Visual style characteristics:
- **Clinical Enterprise Precision**: Ultra-clean, sterile yet approachable UI relying on high typographic rhythm rather than decorative clutter.
- **Micro-tactile Realism**: Crisp slate boundaries complemented by subtle interior structural tones and delicate inset light reflections, evoking modern diagnostic hardware.
- **Immediate Chromatic Parsing**: Strong semantic color mapping that enables instant triage of medication safety, batch expiry dates, and prescription dispensing stages.

## Colors

The palette balances clinical warmth with strict situational clarity. The foundation utilizes pure whites and subtle slate-tinted canvas backdrops to reduce eye fatigue across continuous 12-hour hospital and dispensary shifts.

- **Primary (`#0d9488`)**: Medical Deep Teal. Used for primary workflows, active batch validations, and key navigation anchors.
- **Secondary (`#0284c7`)**: Clinical Sky/Blue. Reserved for inventory syncs, automated reorder triggers, patient records, and analytical data visualizations.
- **Tertiary & Success (`#10b981`)**: Dispensary Emerald. Designates verified prescriptions, successful barcode scans, and cold-chain temperature compliance.
- **Warning (`#f59e0b`)**: Amber. Designates low-stock thresholds, short-dated batches (expiring within 30-90 days), and pending physician verifications.
- **Critical Alert (`#ef4444`)**: Medical Red. Exclusively used for expired inventory, schedule-controlled substance alerts, allergy cross-checks, and contraindication warnings.
- **Surface & Canvas**: Background Canvas (`#f8fafc`), Clean Card Surface (`#ffffff`), Muted Panel Surface (`#f1f5f9`).
- **Typography & Structural Slate**: Primary Text (`#0f172a`), Muted Data Labels (`#475569`), Dividers and Card Borders (`#e2e8f0`).

## Typography

The type hierarchy uses Inter across all viewports to ensure dense clinical clarity and instant numeral readability.

- **Tabular & Numeric Uniformity**: All inventory quantities, batch numbers, dosage metrics, and Indian Rupee values (`₹`) must enforce tabular numbers (`font-variant-numeric: tabular-nums`) to preserve optical alignment across inventory tables.
- **Hierarchy Rules**: Page headings maintain tight tracking (`-0.02em`) to command focus without dominating viewport real estate. Data grid headers and metric labels use `label-sm` or `label-md` in uppercase with subtle letter spacing for rapid scanning under high operational tempo.

## Layout & Spacing

This design system is built on a high-density, flexible 12-column grid system tuned for dense medication management consoles, point-of-sale registers, and responsive tablet ward-rounds.

- **Desktop (1280px+)**: 12-column fluid grid, `1.75rem` page margins, `1.25rem` gutters. Accommodates multi-pane layouts: collapsible dispensary tree, primary batch log, and right-hand patient interaction panel.
- **Tablet (768px - 1279px)**: 8-column layout, `1.25rem` margins, `1rem` gutters. Slide-over drawers replace auxiliary right panels.
- **Mobile (Below 768px)**: 4-column layout, `1rem` margins, `0.75rem` gutters. Complex dispensing tables reflow into compact card stacks with collapsible medication schedules.
- **Spacing Rhythm**: Internal form fields, metric groupings, and table rows follow a strict 4px/8px incremental cadence to maximize usable vertical data without causing visual compression.

## Elevation & Depth

Visual hierarchy is communicated via clean structural boundaries and delicate multi-layered ambient shading, avoiding heavy drop shadows.

- **Card Elevation**: Surfaces use a 1px border (`#e2e8f0`) alongside an ambient shadow: `0 1px 3px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.02)`.
- **Subtle Inset Tactility**: Form inputs and selected inventory cards utilize an ultra-fine inner highlight (`inset 0 1px 1px rgba(255, 255, 255, 0.8)`) paired with a micro-stroke (`#cbd5e1`), ensuring crisp contrast against the `#f8fafc` background.
- **Modals & Overlays**: Dispense confirmation modals, drug interaction popups, and barcode scanner dialogs use `0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.06)` with a backdrop blur (`backdrop-filter: blur(4px)`) over a `#0f172a66` scrim.
- **Surface Stacking**:
  - `Base`: `#f8fafc`
  - `Layer 1 (Cards, Workspaces)`: `#ffffff`
  - `Layer 2 (Tables, Nested Panels, Inset Data)`: `#f1f5f9`
  - `Hover/Active States`: Subtle lift accompanied by border shift to `#0d948840`.

## Shapes

The shape system employs balanced, modern rounded geometry that softens enterprise density while maintaining a technical, professional appearance.

- **Cards & Data Panels**: Utilize `rounded-xl` (`1rem` / 16px) to frame multi-metric sections, batch summaries, and patient dispense panels smoothly.
- **Inputs & Action Buttons**: Utilize standard rounded geometry (`0.5rem` / 8px) for steady cursor targeting and touch reliability on POS tablets.
- **Badges, Tags, and Pills**: Utilize full pill geometry (`9999px`) for pharmaceutical categories, stock tags, and currency indicators to create a clear visual distinction from square action targets.

## Components

### Buttons
- **Primary**: Background `#0d9488`, foreground `#ffffff`, subtle shadow `0 1px 2px rgba(13, 148, 136, 0.2)`. On hover: `#0f766e`. Used for "Confirm Dispense", "Receive Order", "Add Medicine".
- **Secondary**: Background `#ffffff`, border 1px solid `#e2e8f0`, text `#0f172a`. On hover: `#f8fafc` with border `#cbd5e1`.
- **Destructive/Critical**: Background `#ef4444`, text `#ffffff`. Used for "Discard Expired Batch", "Flag Interaction".

### Form Controls & Inputs
- **Text Inputs**: Height 40px, background `#ffffff`, border 1px solid `#cbd5e1`, font `body-md`. Focus state uses border `#0d9488` with a 2px outer ring in `#0d948820`.
- **Search & Barcode Lookup**: Enhanced search bars with integrated prefix icons and trailing hotkey prompts (e.g., `⌘K` or barcode scanner ready status).
- **Checkboxes & Radios**: 18px size, border `#94a3b8`, active state `#0d9488` with crisp white check/dot indicator.

### Pharmaceutical Status Badges
- **Expired/Hazard**: Background `#fef2f2`, border `#fecaca`, text `#b91c1c`. Includes dot alert icon.
- **Low Stock/Reorder**: Background `#fffbeb`, border `#fde68a`, text `#b45309`.
- **Dispensed/In-Stock**: Background `#ecfdf5`, border `#a7f3d0`, text `#047857`.
- **Schedule Substance Flag**: Pill badge with background `#eff6ff`, border `#bfdbfe`, text `#1d4ed8` (e.g., "Schedule H1", "Narcotic").

### Data Tables & Batch Cards
- **Table Structure**: Zebra-less design utilizing `#ffffff` rows separated by 1px `#f1f5f9` dividers. Row hover: `#f8fafc`.
- **Batch Metadata Row**: Displays batch number (`mono-data`), expiry warning indicator, rack location, and stock on hand.
- **Indian Rupee Currency Display**: Tabular alignment prefixing amounts cleanly (`₹ 1,450.00`). Total billing cards display large tabular summaries with clear GST breakouts.

### Prescription Verification Card
- **Structure**: Clean white `rounded-xl` container with a top header separating patient demographic details, prescribing doctor MCI registration number, and interactive dispensing checklist.
- **Safety Alert Banner**: Inset warning container with `#fef2f2` fill, `#ef4444` left border (3px thick), displaying severe drug-drug contraindications.