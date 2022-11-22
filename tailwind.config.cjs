/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js,jsx,tsx}",
    "./node_modules/tw-elements/dist/js/**/*.js"
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('daisyui')
  ],

  daisyui: {
    styled: true,
    themes: [
      {
        insight: { 
          "primary": "#B10101",
          "secondary": "#262830",
          "accent": "#e74100",
          "neutral": "#404350",
          "neutral-content": "#ffffff",
          "base-100": "#262830",
          "base-200": "#3B3D44",
          "base-300": "#404350",
          "base-400": "#505266",
          "base-500": "#616266",
          "base-600": "#84848a",
          "base-700": "#939499",
          "base-800": "#b4b4bb",
          "base-900": "#d9d9dd"
        }
      }
    ],
    base: true,
    utils: true,
    logs: true,
    rtl: false,
    prefix: "",
    darkTheme: "dark",
  }
}