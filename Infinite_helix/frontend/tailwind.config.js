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
          'accent-dim': '#a855f7',
          pink: '#f472b6',
          'pink-dim': '#ec4899',
          sky: '#38bdf8',
          mint: '#34d399',
          amber: '#fbbf24',
          red: '#f87171',
          text: '#e8e4f0',
          muted: '#9490a8',
          border: '#2e2e3c',
          'border-light': '#3d3d52',
        }
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.5s ease-out',
        'breathe': 'breathe 4s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'mesh': 'radial-gradient(at 40% 20%, rgba(192,132,252,0.08) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(56,189,248,0.06) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(244,114,182,0.06) 0px, transparent 50%)',
      }
    },
  },
  plugins: [],
}
