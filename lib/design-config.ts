/**
 * Central Design System Configuration
 * Edit fonts and colors in one place
 */

export const designConfig = {
  // Color Palette
  colors: {
    // Primary text color
    text: {
      primary: '#374337',
      secondary: '#374337',
      muted: '#374337',
    },

    // Background colors
    background: {
      primary: '#f0fdf4', // emerald-50
      secondary: '#ffffff',
      accent: '#f0fdf4',
    },

    // Brand colors
    brand: {
      primary: '#059669', // emerald-600
      secondary: '#0891b2', // cyan-600
      tertiary: '#ea580c', // orange-600
    },

    // UI colors
    ui: {
      border: '#d1fae5', // emerald-100
      borderAccent: '#a7f3d0', // emerald-200
      success: '#22c55e', // green-500
      error: '#ef4444', // red-500
      warning: '#f59e0b', // amber-500
    },

    // Button colors
    button: {
      primary: '#059669', // emerald-600
      primaryHover: '#047857', // emerald-700
      secondary: '#6b7280', // gray-500
      secondaryHover: '#4b5563', // gray-600
    }
  },

  // Typography
  fonts: {
    primary: 'Mundial',
    fallback: ['system-ui', 'sans-serif'],

    // Font family strings for CSS
    fontFamily: {
      primary: "'Mundial', system-ui, sans-serif",
      mono: "'Geist Mono', 'Monaco', 'Menlo', monospace",
    }
  },

  // Spacing and sizing
  spacing: {
    xs: '0.5rem',
    sm: '1rem',
    md: '1.5rem',
    lg: '2rem',
    xl: '3rem',
    xxl: '4rem',
  },

  // Border radius
  borderRadius: {
    sm: '0.375rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
    xxl: '2rem',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
  }
};

// Helper function to get CSS custom properties
export const getCSSVariables = () => {
  const flattenObject = (obj: any, prefix = ''): Record<string, string> => {
    return Object.keys(obj).reduce((acc, k) => {
      const pre = prefix.length ? prefix + '-' : '';
      if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
        Object.assign(acc, flattenObject(obj[k], pre + k));
      } else {
        acc[pre + k] = obj[k];
      }
      return acc;
    }, {} as Record<string, string>);
  };

  const flattened = flattenObject(designConfig);
  const cssVars: Record<string, string> = {};

  Object.entries(flattened).forEach(([key, value]) => {
    if (typeof value === 'string') {
      cssVars[`--${key}`] = value;
    }
  });

  return cssVars;
};

// Export individual sections for easier access
export const colors = designConfig.colors;
export const fonts = designConfig.fonts;
export const spacing = designConfig.spacing;
export const borderRadius = designConfig.borderRadius;
export const shadows = designConfig.shadows;