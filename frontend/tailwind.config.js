/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        obsidian: '#050505',
        'axiom-orange': '#FC6432',
        'glow-violet': '#8B5CF6',
        'text-primary': '#FFFFFF',
        'text-secondary': 'rgba(255,255,255,0.6)',
        'border-glass': 'rgba(255,255,255,0.08)',
      },
      fontFamily: {
        sans: ['Geist Sans', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Geist Mono', 'ui-monospace', 'monospace'],
      },
      backdropBlur: {
        glass: '12px',
      },
      transitionTimingFunction: {
        axiom: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'logo-pulse': 'logoPulse 2s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(252, 100, 50, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(252, 100, 50, 0.4)' },
        },
        logoPulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0' },
          '50%': { transform: 'scale(1.6)', opacity: '0.4' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
