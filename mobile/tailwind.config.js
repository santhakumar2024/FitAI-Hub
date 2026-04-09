/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './screens/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Primary brand colors
        primary: {
          50: '#e6faf0',
          100: '#bdf1d5',
          200: '#94e8bb',
          300: '#6bdfa1',
          400: '#4ade80',
          500: '#00cc6a',   // Main green
          600: '#00b35c',
          700: '#00994f',
          800: '#00803f',
          900: '#006631',
        },
        // Light backgrounds (replaces dark)
        dark: {
          50: '#ffffff',
          100: '#f8f9fa',
          200: '#f1f3f5',
          300: '#e9ecef',
          400: '#dee2e6',   
        },
        // Accent for calories / alerts
        accent: {
          orange: '#FF9500',
          yellow: '#FFCC00',
          blue: '#007AFF',
          purple: '#AF52DE',
          red: '#FF3B30',
        },
        // Card/surface colors
        surface: {
          100: '#ffffff',
          200: '#f8f9fa',
          300: '#f1f3f5',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui'],
        heading: ['Inter', 'system-ui'],
        mono: ['JetBrainsMono', 'monospace'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
