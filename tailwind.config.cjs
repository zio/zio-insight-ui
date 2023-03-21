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
          "neutral": "#555",
          "neutral-content": "#fff",
          "base-100": "#444",
          "base-200": "#222",
          "base-300": "#111",
          "base-content": "#fff"
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