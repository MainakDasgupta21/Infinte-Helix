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
<<<<<<< HEAD
          // Light feminine base
          bg: '#fdfbff',
          'bg-dark': '#f5f3ff',
          surface: '#fefbff',
          card: '#fdfbff',
          // Purple primary
          lavender: {
            50: '#f4f7ff',
            100: '#e8ecff',
            200: '#d0d8ff',
            300: '#b8c2ff',
            400: '#a0acff',
            500: '#a8b4ff',
            600: '#919fff',
            700: '#7a8fff',
            900: '#5a6fd4',
          },
          // Blush pink secondary
          blush: {
            100: '#fdf2f5',
            300: '#f9c9d8',
            400: '#f4b0cc',
            500: '#f0a8c3',
            600: '#d4829e',
          },
          // Sage green accents
          sage: {
            200: '#d4e8d0',
            400: '#c4e4c8',
            500: '#a8d4a0',
            600: '#7cb874',
          },
          // Cycle rose
          rose: {
            100: '#fceef2',
            300: '#f8d7e0',
            400: '#e8b4c1',
            500: '#d99faf',
          },
          // Gold touch
          gold: '#d4a843',
          // Sunrise Gold theme (Pregnancy / Motherhood Shield)
          sunrise: {
            50: '#fffdf5',
            100: '#fff7ed',
            200: '#ffeed4',
            300: '#ffe0a8',
            400: '#ffd06a',
            500: '#f5b731',
            600: '#d4960a',
            700: '#a67508',
            text: '#5c3d0a',
            muted: '#8b6d3f',
            border: '#f0dbb8',
            surface: '#fffbf2',
          },
          // Functional accent colors (used across Dashboard, Calendar, ChatBot, Journal)
          accent: '#7c6cdb',
          sky: '#3b82c8',
          mint: '#2d9e6e',
          pink: '#d95f8c',
          amber: '#c88a2d',
          red: '#d94f4f',
          // Neutrals/text
          text: '#2a2a3a',
          'text-dark': '#1a1a24',
          muted: '#6b7280',
          border: '#e8e8f0',
          'border-light': '#f0f0f8',
=======
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
>>>>>>> 9aa662e (Add middleware, calendar providers, theme support, and UI improvement)
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
<<<<<<< HEAD
        'mesh-light': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(168,180,255,0.08) 0%, transparent 55%), radial-gradient(ellipse 60% 40% at 100% 0%, rgba(240,168,195,0.06) 0%, transparent 45%), radial-gradient(ellipse 50% 60% at 0% 100%, rgba(255,255,255,0.04) 0%, transparent 50%)',
        'lavender-gradient': 'linear-gradient(135deg, #a8b4ff 0%, #919fff 50%, #7a8fff 100%)',
        'blush-gradient': 'linear-gradient(135deg, #f9c9d8 0%, #f4b0cc 50%, #f0a8c3 100%)',
        'sunrise-gradient': 'linear-gradient(135deg, #ffd06a 0%, #f5b731 50%, #d4960a 100%)',
        'sunrise-mesh': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(245,183,49,0.12) 0%, transparent 55%), radial-gradient(ellipse 60% 40% at 100% 0%, rgba(255,208,106,0.08) 0%, transparent 45%)',
      },
      borderRadius: {
        '20': '20px',
=======
        'mesh': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgb(var(--helix-accent) / 0.07) 0%, transparent 55%), radial-gradient(ellipse 60% 40% at 100% 0%, rgb(var(--helix-sky) / 0.05) 0%, transparent 45%), radial-gradient(ellipse 50% 60% at 0% 100%, rgb(var(--helix-text) / 0.02) 0%, transparent 50%)',
>>>>>>> 9aa662e (Add middleware, calendar providers, theme support, and UI improvement)
      }
    },
  },
  plugins: [],
}
