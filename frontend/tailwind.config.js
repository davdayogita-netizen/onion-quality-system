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
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          900: '#064e3b',
        },
        onion: {
          light: '#fef3c7',
          amber: '#f59e0b',
          crimson: '#e11d48',
          skin: '#d97706',
          dark: '#78350f',
        }
      }
    },
  },
  plugins: [],
}
