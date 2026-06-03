/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#030712', // Deep near-black
          900: '#0B132B', // Main deep navy
          800: '#1C2541', // Secondary navy card
          700: '#3A506B', // Lighter navy text
          100: '#E2E8F0', // Soft readable light text
          50: '#F8FAFC',
        },
        accent: {
          DEFAULT: '#00B4D8', // Sleek Premium Electric Teal/Cyan
          light: '#E0F7FA',
          dark: '#0077B6',
        },
        success: {
          DEFAULT: '#10B981', // Emerald green for taken status
          light: '#D1FAE5',
        }
      },
      fontFamily: {
        sans: ['"Outfit"', '"Inter"', 'sans-serif'],
      },
      fontSize: {
        'elder-sm': '1rem',      // Larger than normal
        'elder-base': '1.25rem',  // Very readable defaults
        'elder-lg': '1.5rem',
        'elder-xl': '1.875rem',
        'elder-2xl': '2.25rem',
      }
    },
  },
  plugins: [],
}
