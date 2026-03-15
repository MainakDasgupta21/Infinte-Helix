/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        helix: {
          bg: '#0f0f12',
          surface: '#1a1a22',
          card: '#22222e',
          accent: '#c084fc',
          pink: '#f472b6',
          sky: '#38bdf8',
          mint: '#34d399',
          amber: '#fbbf24',
          text: '#e8e4f0',
          muted: '#9490a8',
          border: '#2e2e3c',
        }
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['DM Sans', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
