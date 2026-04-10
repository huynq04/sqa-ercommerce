# Design System Documentation

## Fonts

### Primary Font (Body Text)
- **Inter** - Google Font
- Weights: 300, 400, 500, 600, 700, 800
- Used for: Body text, navigation, buttons, and general UI elements

### Display Font (Headings)
- **Poppins** - Google Font
- Weights: 400, 500, 600, 700
- Used for: Headings, logos, and display text

### Typography Classes
- `.heading-1` - Large hero headings (4xl-5xl)
- `.heading-2` - Section headings (3xl-4xl)
- `.heading-3` - Page titles (2xl-3xl)
- `.heading-4` - Subsection headings (xl-2xl)
- `.body-large` - Large body text (lg)
- `.body-text` - Standard body text (base)
- `.body-small` - Small text (sm)

## Colors

### Primary Color Palette
- **Primary** (Blue): `#0ea5e9` - For accents and highlights
- **Accent** (Purple): `#d946ef` - For special elements
- **Neutral** (Gray): `#737373` - For text and backgrounds
  - Scale: 50 (lightest) to 950 (darkest)
- **Success** (Green): `#22c55e` - For success messages
- **Error** (Red): `#ef4444` - For errors and warnings
- **Warning** (Yellow): `#f59e0b` - For warnings

### Color Usage
- **Neutral-900** (`#171717`) - Primary text, buttons, borders
- **Neutral-600** (`#525252`) - Secondary text, placeholders
- **Neutral-100** (`#f5f5f5`) - Light backgrounds, cards
- **Neutral-50** (`#fafafa`) - Subtle backgrounds

## Component Styles

### Buttons
- `.btn-primary` - Primary action button (dark background)
- `.btn-secondary` - Secondary button (outlined)
- `.btn-outline` - Outline button (border only)

### Inputs
- `.input` - Form input styling with focus states

### Cards
- `.card` - Standard card container with border and shadow

## Customizing Colors from Figma

To match exact colors from your Figma design:

1. **Export Colors from Figma:**
   - In Figma, select any color
   - Copy the hex code (e.g., `#FF5733`)
   - Update `tailwind.config.js` in the `colors` section

2. **Example Update:**
```javascript
colors: {
  brand: {
    500: '#FF5733', // Replace with your Figma color
    // Add more shades if needed
  }
}
```

3. **Update Fonts:**
   - If using a different font, update `index.html` with new Google Font link
   - Update `tailwind.config.js` `fontFamily` section

## Spacing Scale
- Custom spacing: `18` (4.5rem), `88` (22rem), `128` (32rem)

## Border Radius
- Custom radius: `4xl` (2rem) for extra rounded corners

