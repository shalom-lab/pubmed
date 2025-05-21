const defaultTheme = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ...defaultTheme.colors
      },
    },
  },
  plugins: [],
  safelist: [
    'bg-white',
    'text-gray-800',
    'text-gray-600',
    'text-gray-700',
    'hover:-translate-y-1',
    'hover:shadow-lg'
  ]
}