module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './admin/**/*.{js,ts,jsx,tsx}',
    './context/**/*.{js,ts,jsx,tsx}',
    './utils/**/*.{js,ts,jsx,tsx}',
    './services/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        spv: {
          DEFAULT: '#000000',
          primary: '#ff2d6d',
          accent: '#ffb3c6'
        }
      },
      fontFamily: {
        inter: ['Inter', 'ui-sans-serif', 'system-ui'],
        caveat: ['Caveat', 'cursive']
      }
    }
  },
  plugins: []
};
