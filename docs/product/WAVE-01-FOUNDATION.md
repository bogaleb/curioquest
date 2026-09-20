# Wave 01 — Foundation, Design System, Responsiveness, and Activity Shell

## Goal

Create a strong commercial-quality foundation before expanding deeper curriculum features.

## Scope

Audit and improve:

- global application shell
- navigation
- layout primitives
- typography
- spacing
- cards
- buttons
- dialogs
- loading states
- empty states
- error states
- responsive grids
- tablet layouts
- desktop layouts
- mobile layouts
- orientation handling
- safe-area behavior
- immersive activity shell
- fullscreen behavior
- visual consistency
- accessibility baseline
- performance baseline

## Required Work

### 1. Complete Route and Screen Inventory

Identify every significant route and screen.

Create a concise internal checklist so prototype-quality screens are not missed later.

### 2. Design System

Create or consolidate reusable design tokens for:

- typography
- spacing
- border radius
- shadows
- breakpoints
- container widths
- touch-target sizes
- button styles
- card styles
- progress components
- dialog styles
- icon treatment
- animation timing

Do not impose a generic SaaS design language.

Child Mode and Parent Mode may share a system but should feel appropriately different.

### 3. Responsive Shell

Support:

- 360px phone
- 390/430px phone
- iPad Mini portrait/landscape
- iPad portrait/landscape
- iPad Pro portrait/landscape
- small laptop
- standard desktop
- large desktop

Fix:

- horizontal overflow
- clipped content
- overlapping controls
- tiny touch targets
- broken grids
- excessive whitespace
- incorrect fixed heights
- viewport issues

### 4. iPad-First Behavior

Treat iPad as a primary child device.

Ensure:

- touch-friendly controls
- landscape learning mode
- portrait browsing
- appropriate canvas/game sizing
- safe-area handling
- orientation changes do not break active experiences

### 5. Immersive Activity Shell

Create a reusable activity shell for:

- games
- drawing
- stories
- video
- puzzles
- science interactions
- interactive lessons

Provide:

- full-screen control
- graceful fallback
- child-safe exit
- optional pause/restart hooks
- responsive activity region
- reduced site chrome
- scroll prevention where appropriate

### 6. Accessibility Baseline

Ensure:

- semantic buttons/controls
- visible focus states
- reasonable contrast
- reduced-motion support
- keyboard access where relevant
- labels for icon-only buttons

### 7. Performance Baseline

Identify major issues:

- oversized bundles
- unnecessary client components
- expensive rerenders
- unoptimized images
- duplicated requests

Fix the highest-impact problems that are safe to address in this wave.

## Do Not

- rebuild curriculum in this wave
- introduce major new subject content
- redesign Supabase schema unless necessary for foundation work
- begin adaptive-learning logic

## Completion Criteria

- all primary screens render correctly on representative phone/tablet/desktop sizes
- no obvious horizontal overflow
- immersive activity shell exists and is reusable
- major shared UI components are consistent
- production build passes
- tests/lint/type checks pass where configured
