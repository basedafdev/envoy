/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f172a', // Slate 900
        primary: {
          DEFAULT: '#8b5cf6', // Violet 500
          glow: '#A78BFA',
        },
        secondary: {
          DEFAULT: '#3b82f6', // Blue 500
          glow: '#60A5FA',
        }
      },
      animation: {
        'blob': 'blob 7s infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px -10px rgba(139, 92, 246, 0.5)' },
          '100%': { boxShadow: '0 0 30px 10px rgba(139, 92, 246, 0.3)' },
        }
      }
    },
  },
  plugins: [],
}
