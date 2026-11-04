/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        meta: {
          blue: '#0064E0',
          azure: '#0082FB',
          gradientStart: '#0064E0',
          gradientEnd: '#0082FB',
          dark: '#0B0F17',
          surface: '#1C2B33',
          border: '#2A3C46',
          card: 'rgba(28, 43, 51, 0.75)'
        },
        crisis: {
          dark: '#0B0F17',
          surface: '#1C2B33',
          card: '#16222A',
          border: '#273842',
          accent: '#0082FB',
          critical: '#ef4444',
          high: '#f97316',
          moderate: '#eab308',
          low: '#10b981'
        }
      },
      backgroundImage: {
        'meta-gradient': 'linear-gradient(to right, #0064E0, #0082FB)',
        'meta-gradient-vertical': 'linear-gradient(to bottom, #0064E0, #0082FB)',
        'meta-glow': 'radial-gradient(circle, rgba(0, 130, 251, 0.15) 0%, rgba(11, 15, 23, 0) 70%)',
      }
    },
  },
  plugins: [],
}
