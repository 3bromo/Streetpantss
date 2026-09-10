/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Bright premium black/white direction (reference palette):
        // "navy" tokens now map to a refined grayscale/ink scale so every
        // existing class automatically follows the new color system.
        navy: {
          100: '#ECEBE7',
          600: '#3A3A3A',
          700: '#2E2E2E',
          800: '#1B1B1B',
          900: '#111111',
          950: '#0A0A0A',
        },
        soft: '#F7F6F2',
        ink: '#0A0A0A',
      },
      fontFamily: {
        display: ['Archivo', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
}
