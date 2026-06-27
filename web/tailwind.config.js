/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#6366f1', dark: '#4f46e5', light: '#818cf8' },
        accent: { DEFAULT: '#ec4899', dark: '#db2777' },
      },
      backgroundImage: {
        'panel-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        'mesh': 'radial-gradient(at 20% 20%, rgba(99,102,241,0.15) 0, transparent 50%), radial-gradient(at 80% 0%, rgba(236,72,153,0.12) 0, transparent 45%), radial-gradient(at 50% 100%, rgba(14,165,233,0.1) 0, transparent 50%)',
      },
    },
  },
  plugins: [],
};
