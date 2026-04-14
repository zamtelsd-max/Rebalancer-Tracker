/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        zamtel: {
          green: '#00843D',
          'green-dark': '#006630',
          'green-light': '#00a84d',
          pink: '#E4007C',
          'pink-dark': '#b80063',
          'pink-light': '#ff1a8f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
