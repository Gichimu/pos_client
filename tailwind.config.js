/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,ts,scss}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          light: '#EFF6FF',
          hover: '#1D4ED8',
        },
        surface: '#FFFFFF',
        bg: '#F8FAFC',
        border: '#E2E8F0',
        text: {
          DEFAULT: '#0F172A',
          muted: '#64748B',
          light: '#94A3B8',
        },
        badge: {
          danger: '#EF4444',
          warning: '#F43F5E',
          success: '#22C55E',
          info: '#8B5CF6',
          neutral: '#6B7280',
        },
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.07), 0 1px 2px -1px rgba(0,0,0,0.05)',
        modal: '0 20px 60px -10px rgba(0,0,0,0.15)',
      },
      borderRadius: {
        card: '12px',
        badge: '999px',
      },
    },
  },
  plugins: [],
};
