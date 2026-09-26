/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        space: {
          950: '#02040a',
          900: '#070c18',
          850: '#0a1226',
          800: '#101c38',
          700: '#1b2c52',
          600: '#2d3e5b',
        },
        orbit: {
          cyan: '#00e5ff',
          'cyan-soft': '#4dd0ff',
          violet: '#7c4dff',
          pink: '#ff3d81',
          green: '#22ffb7',
          amber: '#ffb347',
          red: '#ff3860',
        }
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        rajdhani: ['Rajdhani', 'sans-serif'],
        mono: ['JetBrains Mono', 'Orbitron', 'monospace'],
        sans: ['Rajdhani', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
