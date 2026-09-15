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
        // Netra AI Official Palette
        'netra-blue': {
          50: '#edf5ff',
          100: '#d7e7fe',
          200: '#bcdbff',
          300: '#8ec2ff',
          400: '#58a0f9',
          500: '#2e80f2',
          600: '#0756B8', // Primary deep blue
          700: '#054494',
          800: '#073a7a',
          900: '#0c3266',
          950: '#082043',
        },
        'netra-cyan': {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#38d9f5',
          500: '#19C7E8', // Bright cyan
          600: '#0eaac9',
          700: '#0d8da8',
          800: '#116d82',
          900: '#13586b',
          950: '#062b36',
        },
        'netra-navy': {
          700: '#163259',
          800: '#0e223f',
          850: '#0a1a33',
          900: '#0a192f',
          950: '#071426', // Dark navy surface & background
        },
        'netra-gray': {
          50: '#F1F6FC',  // Light blue-gray page background
          100: '#e5effa',
          200: '#cddff4',
          300: '#acc7ea',
          400: '#84aadc',
          500: '#648dcb',
          600: '#4c71b5',
          700: '#3d5a94',
          800: '#354c79',
          900: '#2e4163',
          950: '#1e293e',
        },

        // Backward compatibility mappings directed into the new palette
        forest: {
          50: '#edf5ff',
          100: '#d7e7fe',
          200: '#bcdbff',
          300: '#8ec2ff',
          400: '#58a0f9',
          500: '#2e80f2',
          600: '#0756B8',
          700: '#054494',
          800: '#0e223f',
          900: '#0a1a33',
          950: '#071426',
        },
        brand: {
          50: '#edf5ff',
          100: '#d7e7fe',
          200: '#bcdbff',
          300: '#8ec2ff',
          400: '#38d9f5',
          500: '#19C7E8',
          600: '#0756B8',
          700: '#054494',
          800: '#073a7a',
          900: '#0a192f',
          950: '#071426',
        },

        // Clinical status tokens
        clinical: {
          low: '#059669',
          moderate: '#d97706',
          high: '#dc2626',
          emergency: '#b91c1c'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
