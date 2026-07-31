---
name: Agro-Institutional Modernism
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1b1c1c'
  on-surface-variant: '#43483f'
  inverse-surface: '#303030'
  inverse-on-surface: '#f3f0ef'
  outline: '#74796e'
  outline-variant: '#c3c8bb'
  surface-tint: '#496639'
  primary: '#18330c'
  on-primary: '#ffffff'
  primary-container: '#2e4a20'
  on-primary-container: '#98b984'
  inverse-primary: '#aed099'
  secondary: '#705d00'
  on-secondary: '#ffffff'
  secondary-container: '#fee171'
  on-secondary-container: '#776300'
  tertiary: '#2b2d2d'
  on-tertiary: '#ffffff'
  tertiary-container: '#414343'
  on-tertiary-container: '#afb0b0'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#caedb3'
  primary-fixed-dim: '#aed099'
  on-primary-fixed: '#072100'
  on-primary-fixed-variant: '#324e23'
  secondary-fixed: '#fee171'
  secondary-fixed-dim: '#e1c559'
  on-secondary-fixed: '#221b00'
  on-secondary-fixed-variant: '#544600'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c7'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#454747'
  background: '#fcf9f8'
  on-background: '#1b1c1c'
  surface-variant: '#e5e2e1'
  field-green: '#2E4A20'
  harvest-gold: '#C8AE44'
  surface-off-white: '#F7F7F7'
  border-subtle: '#E0E0E0'
typography:
  display-lg:
    fontFamily: Libre Caslon Text
    fontSize: 56px
    fontWeight: '700'
    lineHeight: 64px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Libre Caslon Text
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Libre Caslon Text
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  title-md:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  section-gap: 80px
---

## Brand & Style

The design system is built for the Argentine Chamber of Rural Real Estate (CAIR), balancing institutional authority with modern digital efficiency. The aesthetic is **Corporate / Modern** with a strong emphasis on **Minimalism** to ensure the vast Argentine landscapes remain the primary focus.

The target audience includes domestic and international investors, agricultural producers, and real estate professionals. The UI must evoke feelings of stability, heritage, and growth. To achieve this, the system uses high-contrast typography, generous whitespace to allow "room to breathe," and subtle tactile elements that hint at the physical nature of land ownership.

Visual hallmarks include:
- **High-Quality Imagery:** Use of full-width hero sections featuring high-resolution photography of the Pampas, Patagonia, and agricultural machinery.
- **Institutional Weight:** Sharp alignment and structured layouts that reflect the official "Chamber" status.
- **Modern Search UX:** A prominent, clean interface for data-heavy filtering without overwhelming the user.

## Colors

The color palette is derived directly from the Argentine countryside and the CAIR institutional identity. 

- **Primary (Field Green):** Used for navigation, primary buttons, and representing the land itself. It signifies growth and stability.
- **Secondary (Harvest Gold):** Reserved for highlights, special icons, and premium "Featured Property" indicators. It suggests value and excellence.
- **Neutral:** A deep charcoal (not pure black) is used for text to maintain readability against high-white backgrounds.
- **Functional Backgrounds:** A very light grey (#F7F7F7) is used to differentiate between content sections (like cards) and the main canvas.

## Typography

This design system employs a sophisticated pairing of a traditional serif for headers and a high-performance sans-serif for UI elements.

- **Headlines (Libre Caslon Text):** This serif font provides the "Institutional" and "Chamber" feel. It should be used for page titles, section headings, and property titles to convey prestige.
- **UI & Body (Hanken Grotesk):** A modern, sharp sans-serif selected for its exceptional legibility in data-heavy environments. Used for search inputs, property details, and long-form descriptions.
- **Scale:** Large display sizes are reserved for hero sections over landscape photography. For mobile, headline sizes are slightly reduced to ensure readability without excessive wrapping.

## Layout & Spacing

The design system utilizes a **Fixed Grid** on desktop (12 columns, 1280px max-width) and a **Fluid Grid** on mobile (4 columns).

- **The Search Hero:** Following the functional reference, the central search component is the anchor of the homepage. It uses a centered layout with 24px internal padding for inputs.
- **Rhythm:** A base-8 spacing system is strictly enforced. Section gaps are generous (80px or 120px) to maintain the "Spacious" feel requested.
- **Responsive Behavior:** On tablet (768px - 1024px), property cards shift from 3-across to 2-across. On mobile, all inputs in the search hero stack vertically for better tap targets.

## Elevation & Depth

To maintain a professional and clean aesthetic, this design system uses **Tonal Layers** and **Low-contrast outlines** rather than heavy shadows.

- **Depth Level 1 (Surface):** White cards sit on the #F7F7F7 background with a 1px border (#E0E0E0). No shadow.
- **Depth Level 2 (Interaction):** On hover, cards lift slightly using a soft, ambient shadow (0px 4px 20px rgba(0,0,0,0.05)) and the border color shifts to the Primary Green.
- **Floating Elements:** Only the main search bar or modal windows utilize a distinct elevation to separate them from the landscape photography backgrounds. These use a 15% opacity blur backdrop (Glassmorphism) to keep the image visible beneath the UI.

## Shapes

The shape language is **Soft** (roundedness 1). 

Property cards, search inputs, and buttons use a 0.25rem (4px) radius. This subtle rounding maintains the professional "Institutional" look—avoiding the overly playful feel of high-radius "pill" shapes—while feeling more modern and approachable than sharp, 90-degree corners.

Large imagery containers may use a slightly larger radius (rounded-lg) to soften the impact of high-contrast photography.

## Components

### Buttons
- **Primary:** Solid Field Green with white Hanken Grotesk text (Semibold). 4px radius. High contrast.
- **Secondary:** Transparent background with Field Green border and text.
- **Search Button:** Large, Harvest Gold background with Field Green text to create an immediate focal point in the hero section.

### Search Hero & Tabs
- **Tabs:** Located above the search bar. Active tabs are underlined with a 3px Field Green stroke.
- **Inputs:** Large text (18px), clear icons (e.g., location pin, price tag), and a "Search" button that spans the full width on mobile or sits integrated on desktop.

### Property Cards
- **Image:** 16:9 aspect ratio at the top.
- **Badges:** Small "Featured" or "New" badges in Harvest Gold with 13px bold text.
- **Content:** Title in Libre Caslon Text, Price and Location in Hanken Grotesk.
- **Details:** Use small icons for hectares, livestock capacity, or water access.

### Form Fields
- Minimalist design: White background, 1px grey border, and clear floating labels. 
- Focus state: Border changes to Field Green with a 2px thickness.

### Lists & Tables
- For agricultural data or market reports, use clean tables with horizontal dividers only (no vertical lines) to maximize the feeling of space.