/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f4f7ff',
          100: '#e8efff',
          200: '#cfe0ff',
          300: '#a9c5ff',
          400: '#7ea5ff',
          500: '#5a89ff',   // primary
          600: '#426ef0',
          700: '#3457c7',
          800: '#2b47a3',
          900: '#263c87',
        },
      },
      boxShadow: {
        card: '0 10px 20px -10px rgba(0,0,0,0.15)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
};
