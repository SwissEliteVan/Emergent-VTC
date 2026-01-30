/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Swiss International Style - Strict palette
        white: '#FFFFFF',
        black: '#000000',
        gray: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        // Accent for interactive elements
        accent: '#000000',
      },
      fontFamily: {
        sans: ['Inter', 'Helvetica Neue', 'Helvetica', 'Arial', 'system-ui', 'sans-serif'],
        display: ['Inter', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
      },
      fontSize: {
        'display': ['3.5rem', { lineHeight: '1.1', fontWeight: '700' }],
        'heading': ['2rem', { lineHeight: '1.2', fontWeight: '600' }],
        'subheading': ['1.25rem', { lineHeight: '1.4', fontWeight: '500' }],
        'body': ['1rem', { lineHeight: '1.5', fontWeight: '400' }],
        'caption': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
        'micro': ['0.75rem', { lineHeight: '1.5', fontWeight: '500' }],
      },
      boxShadow: {
        'swiss': '0 1px 3px rgba(0, 0, 0, 0.08)',
        'swiss-md': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'swiss-lg': '0 8px 24px rgba(0, 0, 0, 0.12)',
        'swiss-xl': '0 16px 48px rgba(0, 0, 0, 0.16)',
        'bottomsheet': '0 -4px 24px rgba(0, 0, 0, 0.12)',
      },
      borderRadius: {
        'swiss': '12px',
        'swiss-lg': '16px',
        'swiss-xl': '24px',
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.4s ease-out',
        'pulse-dot': 'pulseDot 1.5s ease-in-out infinite',
        'spin-slow': 'spin 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseDot: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.5)', opacity: '0.5' },
        },
      },
      transitionTimingFunction: {
        'swiss': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}
