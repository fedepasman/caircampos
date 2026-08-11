---
name: Organic Institutional
colors:
  surface: '#faf9f7'
  surface-dim: '#dadad8'
  surface-bright: '#faf9f7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f1'
  surface-container: '#efeeec'
  surface-container-high: '#e9e8e6'
  surface-container-highest: '#e3e2e0'
  on-surface: '#1a1c1b'
  on-surface-variant: '#434844'
  inverse-surface: '#2f3130'
  inverse-on-surface: '#f1f1ef'
  outline: '#737873'
  outline-variant: '#c3c8c2'
  surface-tint: '#516356'
  primary: '#18281e'
  on-primary: '#ffffff'
  primary-container: '#2d3e33'
  on-primary-container: '#96a99b'
  inverse-primary: '#b8cbbc'
  secondary: '#695d4a'
  on-secondary: '#ffffff'
  secondary-container: '#f2e0c8'
  on-secondary-container: '#6f6350'
  tertiary: '#28251c'
  on-tertiary: '#ffffff'
  tertiary-container: '#3e3a31'
  on-tertiary-container: '#aaa498'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d4e7d8'
  primary-fixed-dim: '#b8cbbc'
  on-primary-fixed: '#0e1f15'
  on-primary-fixed-variant: '#394b3f'
  secondary-fixed: '#f2e0c8'
  secondary-fixed-dim: '#d5c4ad'
  on-secondary-fixed: '#231a0c'
  on-secondary-fixed-variant: '#504534'
  tertiary-fixed: '#e9e2d4'
  tertiary-fixed-dim: '#ccc6b9'
  on-tertiary-fixed: '#1e1b13'
  on-tertiary-fixed-variant: '#4a463d'
  background: '#faf9f7'
  on-background: '#1a1c1b'
  surface-variant: '#e3e2e0'
  forest-deep: '#1B261F'
  moss-accent: '#5E7056'
  clay-warm: '#A69076'
  institutional-blue: '#34495E'
typography:
  display-lg:
    fontFamily: Source Serif 4
    fontSize: 56px
    fontWeight: '700'
    lineHeight: 64px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Source Serif 4
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
  headline-lg-mobile:
    fontFamily: Source Serif 4
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-md:
    fontFamily: Source Serif 4
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
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
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  caption:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
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
  margin-desktop: 64px
  section-gap: 120px
---

## Brand & Style

This design system blends the precision of institutional credibility with the warmth of landscape architecture. The brand personality is "Refined Stewardship"—it is authoritative, grounded, and deeply connected to the environment.

The design style follows a **Modern Minimalist** approach with **Tactile** undertones. It utilizes expansive whitespace to signify clarity and purpose, while organic textures and earthy tones soften the institutional rigour. The aesthetic response should feel like walking through a well-curated botanical garden: structured, intentional, and serene.

## Colors

The palette is rooted in a "Forest & Earth" philosophy.

- **Primary:** A deep, near-black forest green used for high-contrast typography and primary branding to maintain authority.
- **Secondary:** A warm, earthy taupe used for interactive elements and accents that require a softer touch than the primary green.
- **Neutral:** A range of warm off-whites and bone tones replace pure whites to reduce eye strain and reinforce the organic theme.
- **Institutional Balance:** Subtle use of slate and clay tones ensures the design remains professional and data-appropriate for the CAIR project.

## Typography

The typography pairing creates a dialogue between tradition and modernity.

- **Headlines:** Use **Source Serif 4**. Its sturdy, professional serifs provide the necessary institutional weight while feeling "literary" and sophisticated.
- **Body & Labels:** Use **Hanken Grotesk**. This sans-serif is exceptionally clean and contemporary, ensuring high legibility for data-heavy sections of the CAIR project.
- **Scale:** Maintain generous line heights (1.5x minimum for body) to preserve the feeling of "breathability" across all screen sizes.

## Layout & Spacing

This design system employs a **Fixed Grid** with an emphasis on "Generous Negative Space."

- **Grid:** A 12-column system for desktop with 24px gutters.
- **Sectioning:** Content sections should be separated by significant vertical gaps (80px to 120px) to allow the "landscape" of the information to breathe.
- **Alignment:** Use asymmetrical layouts occasionally—shifting content off-center or utilizing wide margins—to mimic the natural, non-linear flow of outdoor environments.

## Elevation & Depth

Hierarchy is established through **Ambient Shadows** and **Tonal Layering** rather than harsh borders.

- **Surfaces:** Use subtle shifts in background color (e.g., transitioning from neutral-50 to neutral-100) to separate functional areas.
- **Shadows:** Elements like cards should use very large, soft blurs (30px+) with low opacity (3-5%) tinted with the primary forest green. This creates a "lifted" effect that feels airy rather than heavy.
- **Glassmorphism:** Apply light backdrop blurs (8px) on navigation bars and floating headers to maintain a sense of environmental depth.

## Shapes

The shape language is **Soft and Architectural**.

- **Corners:** Use 4px to 8px radii. This provides a gentle, organic feel without sacrificing the structured, professional look required for institutional credibility.
- **Containers:** Large image containers and main cards should use the larger `rounded-xl` (12px) to feel more approachable.
- **Buttons:** Use the "Soft" setting (4px) for a precise, confident clickable area.

## Components

- **Buttons:** Primary buttons use a solid Forest Green background with white text. Secondary buttons should use a Clay-colored outline with an Earthy-taupe text. Hover states should involve a subtle shift in background saturation.
- **Chips:** Used for categorization, chips should have a light Tertiary background and Forest Green text, with fully rounded ends (pill-shaped) to contrast against the sharper rectangular UI.
- **Input Fields:** Use a subtle bottom-border only or a very light-toned background fill. Focused states should use a soft 2px Moss-accent border.
- **Cards:** Cards should have no visible borders; instead, they rely on the ambient shadows and a slight change in background tone to define their boundaries.
- **Data Visuals:** For the CAIR project, use the earthy palette for charts (Moss, Clay, Taupe, Slate) to ensure the data feels integrated into the overall landscape aesthetic.
