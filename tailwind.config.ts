import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50:  '#f0f3fa',
          100: '#d9e0f0',
          200: '#b3c1e0',
          300: '#8da2d1',
          400: '#6683c1',
          500: '#4064b2',
          600: '#2d4f9a',
          700: '#1f3b7a',
          800: '#162c5e',
          900: '#0F1C3F',
          950: '#090f22',
        },
        gold: {
          50:  '#fdf9ef',
          100: '#faf0d4',
          200: '#f5dfaa',
          300: '#efc97a',
          400: '#e8b24a',
          500: '#C9A84C',
          600: '#b08b3a',
          700: '#8f6e2b',
          800: '#72561f',
          900: '#5d4518',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 8px 0 rgba(15, 28, 63, 0.08)',
        'card-hover': '0 4px 16px 0 rgba(15, 28, 63, 0.14)',
        'card-elevated': '0 8px 32px 0 rgba(15, 28, 63, 0.12)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
