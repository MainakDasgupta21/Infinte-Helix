/** @type {import('tailwindcss').Config} */
function helixColor(varName) {
  return `rgb(var(--helix-${varName}) / <alpha-value>)`;
}

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: 'class', // Enable dark mode toggle later
  theme: {
    extend: {
      colors: {
        helix: {
          bg:           helixColor('bg'),
          surface:      helixColor('surface'),
          card:         helixColor('card'),
          accent:       helixColor('accent'),
          'accent-dim': helixColor('accent-dim'),
          pink:         helixColor('pink'),
          'pink-dim':   helixColor('pink-dim'),
          sky:          helixColor('sky'),
          mint:         helixColor('mint'),
          amber:        helixColor('amber'),
          red:          helixColor('red'),
          text:         helixColor('text'),
          muted:        helixColor('muted'),
          border:       helixColor('border'),
          'border-light': helixColor('border-light'),
          lavender: {
            50: '#f4f7ff', 100: '#e8ecff', 200: '#d0d8ff', 300: '#b8c2ff',
            400: '#a0acff', 500: '#a8b4ff', 600: '#919fff', 700: '#7a8fff', 900: '#5a6fd4',
          },
          blush: { 100: '#fdf2f5', 300: '#f9c9d8', 400: '#f4b0cc', 500: '#f0a8c3', 600: '#d4829e' },
          sage: { 200: '#d4e8d0', 400: '#c4e4c8', 500: '#a8d4a0', 600: '#7cb874' },
          rose: { 100: '#fceef2', 300: '#f8d7e0', 400: '#e8b4c1', 500: '#d99faf' },
          gold: '#d4a843',
          sunrise: {
            50: '#fffdf5', 100: '#fff7ed', 200: '#ffeed4', 300: '#ffe0a8', 400: '#ffd06a',
            500: '#f5b731', 600: '#d4960a', 700: '#a67508',
            text: '#5c3d0a', muted: '#8b6d3f', border: '#f0dbb8', surface: '#fffbf2',
          },
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'blush-pulse': 'blush-pulse 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.5s ease-out',
        'breathe': 'breathe 4s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        'fade-in': 'fade-in 0.2s ease-out',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'mesh': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgb(var(--helix-accent) / 0.07) 0%, transparent 55%), radial-gradient(ellipse 60% 40% at 100% 0%, rgb(var(--helix-sky) / 0.05) 0%, transparent 45%), radial-gradient(ellipse 50% 60% at 0% 100%, rgb(var(--helix-text) / 0.02) 0%, transparent 50%)',
        'lavender-gradient': 'linear-gradient(135deg, #a8b4ff 0%, #919fff 50%, #7a8fff 100%)',
        'blush-gradient': 'linear-gradient(135deg, #f9c9d8 0%, #f4b0cc 50%, #f0a8c3 100%)',
        'sunrise-gradient': 'linear-gradient(135deg, #ffd06a 0%, #f5b731 50%, #d4960a 100%)',
        'sunrise-mesh': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(245,183,49,0.12) 0%, transparent 55%), radial-gradient(ellipse 60% 40% at 100% 0%, rgba(255,208,106,0.08) 0%, transparent 45%)',
      }
    },
  },
  plugins: [],
}
