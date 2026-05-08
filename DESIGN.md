# Design Brief

## Direction

HR Residency 2 — Premium luxury hotel guest management system with a refined red & white aesthetic, inspired by 5-star reception interfaces.

## Tone

Refined minimalism: clean whites, bold red accents, zero clutter. Luxury restraint applied to business operations.

## Differentiation

Red accent used strategically only for CTAs (Check-in/Check-out toggles) and alerts—white-on-red buttons create a signature professional hotel aesthetic exclusive to reception workflows.

## Color Palette

| Token      | OKLCH        | Role                                              |
|------------|--------------|---------------------------------------------------|
| background | 0.98 0.01 70 | Warm white base, micro-warmth for inviting tone  |
| foreground | 0.12 0.01 0  | Deep charcoal text, high professional contrast   |
| card       | 1.0 0.0 0    | Pure white guest records, forms, data sections   |
| primary    | 0.48 0.22 25 | Bold red (#DC2626 equivalent), CTAs & check-ins  |
| accent     | 0.42 0.16 25 | Darker rose red hover state & secondary emphasis |
| muted      | 0.93 0.008 0 | Light gray for disabled, dividers, subtle bg      |
| border     | 0.88 0.01 70 | Warm light border for card edges                 |
| destructive| 0.35 0.18 25 | Deep red for delete actions                      |

## Typography

- Display: Space Grotesk — modern geometric sans-serif for headers, conveys professional luxury
- Body: General Sans — warm geometric sans-serif for form labels, guest tables, readable & friendly
- Mono: JetBrains Mono — GRC/Invoice numbers and amounts for precise data readability
- Scale: h1 32px/bold, h2 24px/600, label 14px/500, body 16px/400

## Elevation & Depth

Subtle elevated shadows (0 4px 12px rgba(0,0,0,0.08)) on cards and modals; no heavy drop shadows or glows. Surface hierarchy through layering: header with border-bottom, card sections with soft shadow, sidebar with discrete background.

## Structural Zones

| Zone    | Background      | Border                    | Notes                                    |
|---------|-----------------|---------------------------|------------------------------------------|
| Header  | card (white)    | border-b, warm light gray | Navigation, hotel name, logout button    |
| Sidebar | sidebar (warm)  | border-r, warm light gray | Guest list nav, collapsible on mobile   |
| Content | background      | —                         | Main dashboard, forms, tables            |
| Cards   | card (white)    | subtle shadow             | Metric cards, guest records, alternation|
| Footer  | background      | border-t, warm light gray | Pagination info or copyright            |

## Spacing & Rhythm

16px base unit for breathing room (section gaps, content grouping). 8px micro-spacing for label-input pairs. 24px gap between major sections. Spacious density optimized for readability of guest data.

## Component Patterns

- Buttons: 6px radius, primary red on white background, white text on red bg for CTAs, smooth 0.3s transition on hover
- Cards: 8px rounded corners, pure white background, subtle shadow, 16px internal padding
- Badges: 4px radius, muted gray for status tags, red for active check-ins
- Tables: light gray alternating rows, hover highlight, left border accent on selected rows
- Toggles: One-tap red check-in/check-out toggle with white icon, smooth 100ms animation
- Forms: Full-width inputs (95% card width), 8px radius, light gray background, dark charcoal text

## Motion

- Entrance: Fade-in 200ms ease-out (no scale animations)
- Hover: Color shift 0.3s cubic-bezier(0.4, 0, 0.2, 1) on buttons, subtle shadow lift on cards
- Decorative: None; smooth transitions only, no bounces or animated loaders
- Toggle: 100ms slide animation for check-in/check-out switch state

## Constraints

- No heavy animations; smooth transitions only
- Mobile-first responsive design; sidebar collapses to hamburger on sm breakpoint
- All text uses semantic tokens (text-foreground, text-muted-foreground); no arbitrary hex colors
- Primary red (#DC2626) reserved for CTAs and active states; not sprinkled throughout UI
- All form inputs use light gray background for clarity; no invisible borders
- Error messages use destructive red; success messages use chart-2 (green)

## Signature Detail

White-on-red Check-in/Check-out toggle buttons—the primary interaction gesture that defines the reception workflow aesthetic, creating immediate visual recognition of the hotel's operational context.
