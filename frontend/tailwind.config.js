/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#121212', // Pure dark grey background (Antigravity style)
        surface: '#1e1e1e', // Lighter grey for cards and surfaces
        border: '#333333', // Sharp grey borders
        primary: '#ffffff', // Pure white for primary actions/text
        dim: '#888888', // Grey for secondary text, no blue undertones
      },
      fontFamily: {
        sans: ['"Geist Sans"', 'sans-serif'],
        heading: ['"DM Sans"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
