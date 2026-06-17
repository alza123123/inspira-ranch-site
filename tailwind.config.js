/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    '*.html',
    'pages/*.html',
    'posts/*.html',
    'elite/*.html',
    'elite/**/*.html',
    'compliance-footer.html',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy:  '#0D1B3E',
          gold:  '#C9A02E',
          dark:  '#080C14',
          light: '#F5F0E8',
        },
      },
    },
  },
  plugins: [],
};
