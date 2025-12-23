export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'sc-orange': '#ff5500', // Warna khas SoundCloud
        'sc-dark': '#121216',   // Warna background gelap
      }
    },
  },
  plugins: [],
}