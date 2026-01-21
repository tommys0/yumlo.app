import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: 'class',
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // Primary green system for high conversion
                green: {
                    primary: '#10B981',
                    dark: '#059669',
                    darker: '#047857',
                    light: '#D1FAE5',
                    lightest: '#F0FDF4',
                    50: '#F0FDF4',
                    100: '#D1FAE5',
                    400: '#34D399',
                    500: '#10B981',
                    600: '#059669',
                    700: '#047857',
                    800: '#065F46',
                    900: '#064E3B',
                },
                // Keep mint for backward compatibility
                mint: {
                    DEFAULT: '#10B981',
                    600: '#059669',
                },
                // Enhanced emerald palette
                emerald: {
                    50: '#f0fdf4',
                    100: '#d1fae5',
                    500: '#10b981',
                    600: '#059669',
                    700: '#047857',
                },
                // Gray scale for text and backgrounds
                gray: {
                    50: '#f9fafb',
                    100: '#f3f4f6',
                    200: '#e5e7eb',
                    300: '#d1d5db',
                    400: '#9ca3af',
                    500: '#6b7280',
                    600: '#4b5563',
                    700: '#374151',
                    800: '#1f2937',
                    900: '#111827',
                },
                navy: {
                    DEFAULT: '#0F172A',
                    900: '#0F172A',
                },
                // Orange for secondary actions
                orange: {
                    500: '#f97316',
                    600: '#ea580c',
                },
                // Yellow for urgency/attention
                yellow: {
                    50: '#fffbeb',
                    200: '#fed7aa',
                    400: '#fbbf24',
                    600: '#d97706',
                    800: '#92400e',
                },
                slate: {
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    900: '#0f172a',
                },
            },
            fontFamily: {
                sans: ['Inter', 'Mundial', 'system-ui', 'sans-serif'],
            },
            borderRadius: {
                'xl': '1rem',
                '2xl': '1.5rem',
                '3xl': '2rem',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
                    '50%': { transform: 'translateY(-20px) rotate(3deg)' },
                },
                'gradient-x': {
                    '0%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                    '100%': { backgroundPosition: '0% 50%' },
                },
                'bounce-gentle': {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
                'pulse-glow': {
                    '0%, 100%': { boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)' },
                    '50%': { boxShadow: '0 0 30px rgba(16, 185, 129, 0.6)' },
                },
                'scale-in': {
                    '0%': { opacity: '0', transform: 'scale(0.9)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                'slide-up': {
                    '0%': { opacity: '0', transform: 'translateY(30px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'rotate-slow': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                },
            },
            animation: {
                'fade-in': 'fadeIn 0.7s ease-out forwards',
                'fade-in-up': 'fadeInUp 0.7s ease-out forwards',
                'float': 'float 3s ease-in-out infinite',
                'gradient-x': 'gradient-x 4s ease infinite',
                'bounce-gentle': 'bounce-gentle 2s ease-in-out infinite',
                'shimmer': 'shimmer 1.5s infinite',
                'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
                'scale-in': 'scale-in 0.6s ease-out forwards',
                'slide-up': 'slide-up 0.8s ease-out forwards',
                'rotate-slow': 'rotate-slow 20s linear infinite',
            },
        },
    },
    plugins: [],
};
export default config;
