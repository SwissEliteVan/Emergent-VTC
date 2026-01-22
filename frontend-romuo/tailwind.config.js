/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Couleurs de marque Romuo.ch
        primary: {
          DEFAULT: '#D4AF37', // Or classique
          50: '#FDF9E7',
          100: '#F9F0C7',
          200: '#F3E18F',
          300: '#EDD257',
          400: '#E7C32F',
          500: '#D4AF37', // Base
          600: '#B8952E',
          700: '#8F7423',
          800: '#66531A',
          900: '#3D3210',
        },
        dark: {
          DEFAULT: '#1A1A1A', // Noir anthracite
          50: '#F5F5F5',
          100: '#E0E0E0',
          200: '#C2C2C2',
          300: '#A3A3A3',
          400: '#858585',
          500: '#666666',
          600: '#4D4D4D',
          700: '#333333',
          800: '#262626',
          900: '#1A1A1A', // Base
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Poppins', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'luxury': '0 10px 40px rgba(212, 175, 55, 0.15)',
        'dark': '0 10px 40px rgba(0, 0, 0, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
