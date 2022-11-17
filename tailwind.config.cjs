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
          "base-200": "#343042",
          "base-300": "#404350",
          "base-400": "#505266"
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