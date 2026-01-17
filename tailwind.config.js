// tailwind.config.js
/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  content: [
    './src/**/*.{html,js}',
    './public/**/*.{html,js}'
  ],
  darkMode: 'class',
  theme: {
    // Sovrascrivo completamente la palette di colori
    colors: {
      transparent: 'transparent'
    }
  },
  plugins: [],
};

