/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Fredoka"', 'sans-serif'],
        body:    ['"Nunito"', 'sans-serif'],
        mono:    ['"Silkscreen"', 'monospace'],
      },
      colors: {
        peach: {
          100: '#fef3ea',
          200: '#fde8d8',
          300: '#fad4b4',
          400: '#f7b88a',
          500: '#e8935a',
          600: '#d4714a',
        },
        ink: {
          50:  '#faf6f2',
          100: '#f0e8dc',
          200: '#ddd0c0',
          300: '#c0a888',
          400: '#a08060',
          500: '#7a5c40',
          600: '#5e4230',
          700: '#472f20',
          800: '#301e12',
          900: '#1e1008',
        },
        canvas: '#fde8d8',
      },
      borderRadius: {
        'xl':  '14px',
        '2xl': '20px',
        '3xl': '28px',
        '4xl': '36px',
      },
      animation: {
        'fade-in':    'fadeIn 0.35s ease-out both',
        'slide-up':   'slideUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-in-r': 'slideInR 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        'pop':        'pop 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
        'wobble':     'wobble 0.5s ease both',
      },
      keyframes: {
        fadeIn:   { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:  { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideInR: { from: { opacity: '0', transform: 'translateX(40px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        pop:      { from: { opacity: '0', transform: 'scale(0.8)' }, to: { opacity: '1', transform: 'scale(1)' } },
        wobble:   {
          '0%':   { transform: 'rotate(0deg)' },
          '25%':  { transform: 'rotate(-3deg)' },
          '50%':  { transform: 'rotate(3deg)' },
          '75%':  { transform: 'rotate(-1deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
      },
    },
  },
  plugins: [],
}