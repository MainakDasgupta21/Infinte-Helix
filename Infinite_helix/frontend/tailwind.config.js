/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        helix: {
          bg: '#030304',
          surface: '#0a0a0d',
          card: '#121218',
          accent: '#6b8cff',
          'accent-dim': '#5576e6',
          pink: '#c97b9a',
          'pink-dim': '#a85f7f',
          sky: '#5eb0d8',
          mint: '#3db89a',
          amber: '#d4a84b',
          red: '#e07070',
          text: '#f0f0f3',
          muted: '#8f8f9a',
          border: '#26262f',
          'border-light': '#36363f',
        }
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.5s ease-out',
        'breathe': 'breathe 4s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        'fade-in': 'fade-in 0.2s ease-out',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'mesh': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(107,140,255,0.07) 0%, transparent 55%), radial-gradient(ellipse 60% 40% at 100% 0%, rgba(94,176,216,0.05) 0%, transparent 45%), radial-gradient(ellipse 50% 60% at 0% 100%, rgba(255,255,255,0.02) 0%, transparent 50%)',
      }
    },
  },
  plugins: [],
}
