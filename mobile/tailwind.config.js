/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0F4C81',
          light: '#1E6091',
          dark: '#0B365B',
          accent: '#F59E0B',
          accentHover: '#D97706',
        },
        connection: {
          nearby: {
            DEFAULT: '#D97706',
            bg: '#FEF3C7',
            border: '#F59E0B',
            text: '#92400E',
          },
          samePort: {
            DEFAULT: '#0284C7',
            bg: '#E0F2FE',
            border: '#0284C7',
            text: '#075985',
          },
          sameShip: {
            DEFAULT: '#059669',
            bg: '#DCFCE7',
            border: '#10B981',
            text: '#065F46',
          },
        },
      },
      maxWidth: {
        mobile: '430px',
      },
    },
  },
  plugins: [],
};
