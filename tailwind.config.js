/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        teal: {
          50: '#F0F9F9',
          100: '#CCECE9',
          200: '#99D9D3',
          300: '#66C5BD',
          400: '#33B2A7',
          500: '#0F9F91',
          600: '#0F4C5C',
          700: '#0B3A47',
          800: '#082933',
          900: '#04171E',
        },
        brand: {
          primary: '#0F4C5C',
          secondary: '#E36414',
        }
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
    },
  },
  plugins: [],
};
