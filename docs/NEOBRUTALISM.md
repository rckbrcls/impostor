# Neobrutalism Design System

This project uses a **Neobrutalist** design aesthetic. This guide outlines the core principles and utility classes used to maintain consistency across the application.

## Core Principles

1.  **Hard Edges**: Avoid rounded corners implies `rounded-none`. Most elements (cards, inputs, buttons) should have sharp 90-degree corners.
2.  **Thick Borders**: Use **2px** solid borders for structural definition.
3.  **High Contrast**:
    - Light Mode: Black borders (`#000000`).
    - Dark Mode: White borders (`#ffffff`).
4.  **Hard Shadows**: Use solid, non-blurred shadows to create depth.
5.  **Vibrant & Flat Colors**: Use distinct background colors for states (Red, Green, Yellow) without complex gradients.
6.  **"Physical" Interaction**: Interactive elements should simulate mechanical pressing (translating down/right and removing shadow).

## Common Utility Classes (Tailwind CSS)

### Borders & Shadows

The signature look is achieved with this combination:

```css
border-2 border-black dark:border-white shadow-[4px_4px_0_0] dark:shadow-white
```

_Note: Ensure `shadow-black` or `shadow-white` is used if the shadow color isn't inferred correctly, or use specific hex `shadow-[4px_4px_0_0_#000]`._

### Interactive Elements (Buttons & Cards)

For clickable items, use the "press" effect:

```css
transition-all
active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none
```

_(Adjust translation values to 2px or 4px depending on the shadow size)_

### Inputs

- Height: `h-10` (standardized)
- Focus Ring: High contrast yellow.

```css
focus-visible:ring-2 focus-visible:ring-yellow-300 focus-visible:ring-offset-0
```

## Component Patterns

### Cards (`components/ui/card.tsx`)

- Container: Bordered, shadowed, white/zinc-900 background.
- **No `rounded-xl`**: Ensure `rounded-none` or remove radius classes.
- Internal Sections: If dividing content, use `border-b-2` or `border-t-2` dividers instead of soft spacing.

### Selection Items (`components/ui/selection-card.tsx`)

- **Checkbox List Style**:
  - Container: `border-2` stack.
  - Items: `border-b-2` last item has no border.
- **States**:
  - **Selected**: Change background color and border color (e.g., `bg-primary/20 border-primary`).
  - **Checkbox**: Custom appearance with `appearance-none`, 2px border, and a manually positioned `<Check />` icon from Lucide.

### Global Layout (`app/layout.tsx`)

- **Header**: Fixed or sticky top, `border-b-2`, solid background.
- **Footer**: `border-t-2`, solid background.
- **Background**: The main body background should be neutral to let the bordered elements stand out.

## Color Palette usage

- **Primary**: Brand accent.
- **Destructive (Red)**: End game, eliminate, dangerous actions.
- **Success (Green)**: Next round, confirmed, safe actions.
- **Warning/Focus (Yellow)**: Focus rings, active states, highlights.
