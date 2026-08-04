---
name: Native Precision
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1b1b1b'
  on-surface-variant: '#43483f'
  inverse-surface: '#303030'
  inverse-on-surface: '#f1f1f1'
  outline: '#74796e'
  outline-variant: '#c3c8bb'
  surface-tint: '#496639'
  primary: '#18330c'
  on-primary: '#ffffff'
  primary-container: '#2e4a20'
  on-primary-container: '#98b984'
  inverse-primary: '#aed099'
  secondary: '#5d5e63'
  on-secondary: '#ffffff'
  secondary-container: '#dfdfe4'
  on-secondary-container: '#616267'
  tertiary: '#2c2d31'
  on-tertiary: '#ffffff'
  tertiary-container: '#424347'
  on-tertiary-container: '#b0b0b5'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#caedb3'
  primary-fixed-dim: '#aed099'
  on-primary-fixed: '#072100'
  on-primary-fixed-variant: '#324e23'
  secondary-fixed: '#e2e2e7'
  secondary-fixed-dim: '#c6c6cb'
  on-secondary-fixed: '#1a1c1f'
  on-secondary-fixed-variant: '#45474b'
  tertiary-fixed: '#e3e2e7'
  tertiary-fixed-dim: '#c6c6cb'
  on-tertiary-fixed: '#1a1b1f'
  on-tertiary-fixed-variant: '#46464b'
  background: '#f9f9f9'
  on-background: '#1b1b1b'
  surface-variant: '#e2e2e2'
typography:
  nav-title:
    fontFamily: Inter
    fontSize: 17px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: -0.4px
  headline-lg:
    fontFamily: Inter
    fontSize: 34px
    fontWeight: '700'
    lineHeight: 41px
    letterSpacing: -0.4px
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.4px
  body-md:
    fontFamily: Inter
    fontSize: 17px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: -0.4px
  body-sm:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: -0.2px
  label-caps:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.1px
  button-text:
    fontFamily: Inter
    fontSize: 17px
    fontWeight: '600'
    lineHeight: 22px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  margin-page: 1rem
  gutter-row: 0.75rem
  stack-gap: 1rem
  inset-card: 1rem
  control-height: 2.75rem
---

## Brand & Style

The design system prioritizes a **Strictly Native Mobile** aesthetic, moving away from institutional layouts toward a high-density, utility-focused interface. It leverages familiar platform patterns to reduce cognitive load and increase efficiency.

The style is **Corporate / Modern** with a focus on tactile precision. It utilizes high-contrast typography against neutral surfaces to create clear information hierarchies. The emotional response is one of reliability, speed, and deep integration with the user's device. 

Key visual drivers include:
- **High Density:** Maximizing information density without sacrificing legibility.
- **Native Familiarity:** Adhering to platform-standard interaction models.
- **Functional Minimalism:** Removing decorative elements in favor of structural clarity.

## Colors

The palette is strictly neutral to allow content and primary actions to command attention. 

- **Primary Green (#2E4A20):** Reserved exclusively for primary call-to-action buttons, active toggles, and positive status indicators.
- **Backgrounds:** Use pure white (#FFFFFF) for primary surfaces and a soft "System Gray" (#F2F2F7) for secondary backgrounds and grouped list insets.
- **Typography:** Black (#000000) for primary headers and body text, and a mid-tone gray (#8E8E93) for secondary labels and placeholder text.
- **Dividers:** High-precision, low-opacity strokes (10% Black) for separating list items.

## Typography

The system utilizes **Inter** as a highly legible substitute for San Francisco/Roboto, ensuring a consistent high-density feel across web and mobile views. 

- **Hierarchy:** Use large titles only for top-level views. Sub-pages should default to a standard 17pt navigation title.
- **Tracking:** Use tighter letter spacing for headlines to mimic native mobile rendering.
- **Weight:** Stick to Regular (400) and Semi-bold (600) for most interface elements to maintain a clean, system-level look.

## Layout & Spacing

The layout philosophy follows a **Native Inset** model. Content does not typically stretch edge-to-edge; instead, it is grouped into cards or "sections" with defined margins.

- **Margins:** A standard 16px (1rem) margin is applied to the left and right of the screen.
- **Grouped Lists:** Use "Inset Grouped" styling for lists, where the list container has a background color distinct from the page background, and rows are rounded as a single unit or tucked within 16px margins.
- **Vertical Rhythm:** Use a strict 8px grid. Most row heights should be 44px (2.75rem) minimum to ensure touch targets are accessible.

## Elevation & Depth

This system avoids heavy drop shadows in favor of **Tonal Layers** and subtle definition.

- **Surface Levels:** The base page uses a light gray background. Content resides on white "cards" or "rows" to create depth.
- **Shadows:** Use a single, highly diffused "Ambient Shadow" for floating elements like action sheets or primary cards: `0px 4px 12px rgba(0, 0, 0, 0.05)`.
- **Boundaries:** Use 0.5pt or 1px strokes for hair-line dividers inside list groups rather than shadows.

## Shapes

The design system uses **Rounded-XL** (12px to 16px) for major container elements to soften the high-density layout and align with modern mobile hardware.

- **Primary Containers:** Cards and inset groups use 12px (`rounded-lg`) or 16px (`rounded-xl`) corner radii.
- **Buttons:** Standard buttons use 12px corner radii. Segmented controls use 8px to 10px to fit within their parent containers.
- **Form Inputs:** Input fields should match the button corner radius for visual consistency.

## Components

- **Buttons:** Primary buttons are solid green (#2E4A20) with white text. Secondary buttons are light gray with black text. Use a fixed height of 44px-50px.
- **Segmented Controls:** A gray track with a white sliding selector. This is the primary method for switching views within a screen.
- **List Rows:** Each row must have a 44px minimum height, a white background, and a "chevron-right" icon (SF Symbols/Material Icons style) if the item is tappable.
- **Cards:** Use "Native Inset" cards with 16px internal padding and 16px external margins.
- **Input Fields:** Minimalist design with a subtle border or light gray background fill. Labels should be placed above the field in `label-caps` style or as inline placeholders that animate to a top-label.
- **Status Indicators:** Use the primary green for success/active states. Use small, circular dots or subtle pill-shaped badges.