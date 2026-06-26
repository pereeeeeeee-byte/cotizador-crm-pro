/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // "brand" = cobre/dorado, el acento de la marca Quotia.
        // Antes era amarillo brillante; se reemplaza por un tono cobre
        // cálido y elegante, coherente con la paleta azul marino + cobre.
        brand: {
          50: '#fbf3e9',
          100: '#f5e3cc',
          200: '#e9c89a',
          300: '#dcab68',
          400: '#c08a4e', // acento principal
          500: '#a8743d',
          600: '#8c5f30',
          700: '#6f4a26',
          800: '#54381c',
          900: '#3c2813',
        },
        // "navy" = azul marino, el color base/serio de la marca.
        navy: {
          50: '#eef2f6',
          100: '#d8e1ea',
          200: '#b1c3d5',
          300: '#82a0bb',
          400: '#4f7596',
          500: '#2c5170',
          600: '#1c3a54',
          700: '#142c40',
          800: '#0f2942',
          900: '#0a1c2e',
          950: '#060f1a',
        },
        ink: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#0a0a0c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.07), 0 1px 2px -1px rgba(0,0,0,0.07)',
      },
    },
  },
  plugins: [],
};
