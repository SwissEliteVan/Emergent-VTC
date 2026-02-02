/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        romuo: {
          red: '#D52B1E',
          black: '#0A0A0A',
          gray: '#F5F5F5',
          teal: '#007A7A',
        },
      },
      boxShadow: {
        soft: '0 2px 8px rgba(0,0,0,0.08)',
      },
      borderRadius: {
        card: '12px',
      },
      fontFamily: {
        display: ['"Suisse Int\'l"', '"SF Pro Display"', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      transitionDuration: {
        300: '300ms',
      },
    },
  },
  plugins: [],
};
