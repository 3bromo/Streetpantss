/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          100: '#DCE4F2',
          600: '#1B4391',
          700: '#123170',
          800: '#0B2555',
          900: '#071A3D',
          950: '#050D1C',
        },
        soft: '#F4F6FA',
        ink: '#050505',
      },
      fontFamily: {
        display: ['Archivo', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        card: '18px',
      },
    },
  },
  plugins: [],
}
