/**
 * Design System Hook and Utilities
 * Easy access to design tokens throughout the app
 */

import { designConfig, colors, fonts } from './design-config';

// Hook for using design tokens in React components
export const useDesign = () => {
  return {
    colors,
    fonts,
    config: designConfig,

    // Helper functions for common patterns
    getTextColor: (variant: 'primary' | 'secondary' | 'muted' = 'primary') => ({
      color: colors.text[variant]
    }),

    getFontFamily: () => ({
      fontFamily: fonts.fontFamily.primary
    }),

    getBackgroundColor: (variant: 'primary' | 'secondary' | 'accent' = 'primary') => ({
      backgroundColor: colors.background[variant]
    }),

    getBrandColor: (variant: 'primary' | 'secondary' | 'tertiary' = 'primary') => ({
      backgroundColor: colors.brand[variant]
    }),

    getButtonStyle: (variant: 'primary' | 'secondary' = 'primary', state: 'normal' | 'hover' = 'normal') => ({
      backgroundColor: state === 'hover'
        ? colors.button[`${variant}Hover` as keyof typeof colors.button]
        : colors.button[variant],
      color: variant === 'primary' ? '#ffffff' : colors.text.primary,
    }),
  };
};

// Utility functions for non-React contexts
export const getDesignTokens = () => designConfig;

export const getColorToken = (path: string): string => {
  const keys = path.split('.');
  let value: any = colors;

  for (const key of keys) {
    value = value?.[key];
  }

  return value || '#000000';
};

export const getFontToken = (path: string): string => {
  const keys = path.split('.');
  let value: any = fonts;

  for (const key of keys) {
    value = value?.[key];
  }

  return value || 'system-ui';
};