---
name: Precise Minimalism
version: 3.0.0
colors:
  primary: "#9945FF"
  secondary: "#19FB9B"
  background: "#080808"
  surface: "#111111"
  surface-soft: "#1A1A1A"
  text: "#F5F5F5"
  text-muted: "#888888"
  border: "#262626"
typography:
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 2.75rem
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.25rem
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Instrument Sans
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.6
  body-md:
    fontFamily: Instrument Sans
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.5
  label-md:
    fontFamily: Instrument Sans
    fontSize: 0.8125rem
    fontWeight: 500
    lineHeight: 1.4
  eyebrow:
    fontFamily: Geist Mono
    fontSize: 0.75rem
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: 0.1em
spacing:
  container: 80px
  grid: 32px
  stack: 20px
rounded:
  card: 12px
  input: 8px
  button: 8px
  media: 12px
---

# Design System Specification: Precise Minimalism

## Overview
Precise Minimalism is a refined, ultra-minimal interface identity inspired by modern engineering tools and high-end creative software. It balances stark structural clarity with subtle, ethereal accents, prioritizing focus and rhythmic precision.

## Design Tokens

### Colors
The palette is rooted in absolute blacks and deep charcoals, punctuated by high-fidelity accents.

- **Primary (#9945FF):** "Ethereal Violet" - Used sparingly for focus states, primary actions, and subtle ambient glows.
- **Secondary (#19FB9B):** "Neon Mint" - Reserved for success states and secondary technical indicators.
- **Background (#080808):** "Onyx" - A deep, neutral base that provides infinite depth.
- **Surface (#111111):** "Graphite" - Used for the primary UI containers to create a layered hierarchy.
- **Surface Soft (#1A1A1A):** "Steel" - Used for inputs and nested regions to provide tactile depth.
- **Text (#F5F5F5):** "Cloud" - High-contrast off-white for effortless reading.
- **Text Muted (#888888):** "Ash" - For secondary information and metadata.
- **Border (#262626):** "Obsidian" - Low-contrast, razor-thin boundaries for precise containment.

### Typography
The system utilizes a trio of typefaces to distinguish between instruction, interaction, and data.

- **Headline Large:** Bold, tightly-tracked headers for primary entrance points.
- **Headline Medium:** Semi-bold structural headers for functional grouping.
- **Body Large/Medium:** Clean, variable-width sans-serif for comfortable reading and interaction.
- **Label Medium:** Medium-weight text for controls and navigational elements.
- **Eyebrow:** Monospaced metadata for technical context and categorization.

### Spacing
Built on a strict 8px rhythmic grid, ensuring every element feels intentional and aligned.

- **Container:** Substantial breathing room for core sections.
- **Grid:** Balanced gutters that maintain group cohesion while providing distinct separation.
- **Stack:** Vertical rhythm that guides the eye through functional steps.

### Roundness
Subtle corner radii soften the technical edge, making the interface feel modern and approachable without sacrificing precision.

- **Card (12px):** Smooth, generous corners for major containers.
- **Input/Button (8px):** Tactile, precise corners for interactive elements.
- **Media (12px):** Encapsulated containers for all generated content.

## Components

### Precise Containers (Cards)
Containers use a subtle 1px border and a very faint inner glow to simulate depth. They never use heavy shadows; instead, they rely on value contrast and razor-thin lines.

### Technical Inputs
Inputs are dark and recessed. Upon focus, the border transitions to a subtle purple glow with a 2px outer ring of lower opacity.

### Interactive Actions
Buttons are either "High-Signal" (solid purple) or "Ghost" (outlined). They use smooth micro-transitions for hover states, focusing on clarity rather than complex animations.

## Layout Guidelines

- **Minimalist Flow:** Minimize visual noise. If an element doesn't serve a functional purpose, remove it.
- **Hierarchy of Light:** Use light (glows and bright text) to guide the user's eye to the primary task.
- **Optical Balance:** Ensure icons and text are optically centered within their containers.

## Do's and Don'ts

### Do
- Use 1px borders for all structural elements.
- Lean into negative space to create a sense of calm and focus.
- Apply subtle purple glows to active elements.

### Don't
- Use heavy, blurry shadows; stick to value-based depth.
- Overuse the primary color; it should feel like a "discovery" accent.
- Use sharp corners; every interactive element must have a consistent radius.
