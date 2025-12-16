# Central Design System

This folder contains the central design system configuration for Yumlo app. You can edit fonts and colors from one place!

## Files

- `design-config.ts` - Main configuration file with all colors, fonts, and design tokens
- `use-design.ts` - React hook and utility functions for using design tokens

## How to Edit Colors and Fonts

### Changing Colors

Edit the `design-config.ts` file to change colors throughout the app:

```typescript
// In design-config.ts
export const designConfig = {
  colors: {
    text: {
      primary: '#374337', // Main text color - change this!
    },
    background: {
      primary: '#f0fdf4', // Main background color
      secondary: '#ffffff', // Card backgrounds
    },
    brand: {
      primary: '#059669', // Main brand color (emerald-600)
      secondary: '#0891b2', // Secondary brand color (cyan-600)
      tertiary: '#ea580c', // Tertiary brand color (orange-600)
    },
    // ... more colors
  }
}
```

### Changing Fonts

The app uses local Mundial fonts. To change the font family, edit:

```typescript
// In design-config.ts
fonts: {
  primary: 'Mundial', // Change this to use a different font
  fallback: ['system-ui', 'sans-serif'],

  fontFamily: {
    primary: "'Mundial', system-ui, sans-serif", // Full font stack
  }
}
```

## Font Files Location

Local font files are stored in: `/public/fonts/`

Current Mundial font weights available:
- Regular (400)
- Light (300)
- Bold (700)
- Demibold (600)
- Black (900)
- All with italic versions

## Usage in Components

```typescript
// Import the hook
import { useDesign } from '@/lib/use-design';

function MyComponent() {
  const design = useDesign();

  return (
    <div style={{
      color: design.colors.text.primary,
      backgroundColor: design.colors.background.primary,
      fontFamily: design.fonts.fontFamily.primary
    }}>
      Content
    </div>
  );
}
```

## Quick Color Changes

To change the entire app's color scheme, edit these key values in `design-config.ts`:

1. **Main text color**: `colors.text.primary`
2. **Background color**: `colors.background.primary`
3. **Brand colors**: `colors.brand.primary/secondary/tertiary`
4. **Button colors**: `colors.button.primary/primaryHover`

Changes will automatically apply throughout the entire app!