module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#F4F2ED',
        text: '#2E2C29',
        muted: '#6E675F',
        accent: '#2F5C5B',
        sage: '#8BAA9A',
      },
      fontSize: {
        h1: ['48px', { lineHeight: '1.2' }],
        'h2': ['34px', { lineHeight: '1.3' }],
        'base-lg': ['18px', { lineHeight: '1.7' }]
      }
    }
  },
  plugins: []
}
