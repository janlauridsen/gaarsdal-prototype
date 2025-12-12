module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
    "./styles/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#EFEDE7",
        surface: "#FFFFFF",
        text: "#2C2A28",
        muted: "#6B675F",
        accent: "#3E5F58",
        "accent-light": "#8EA79D",
        sage: "#AEBFB4",
        border: "#D8D5CC",
      },
      fontSize: {
        h1: ["48px", { lineHeight: "1.2" }],
        h2: ["34px", { lineHeight: "1.3" }],
        "base-lg": ["18px", { lineHeight: "1.7" }],
      },
      boxShadow: {
        soft: "0 4px 16px rgba(0,0,0,0.08)",
        card: "0 2px 10px rgba(0,0,0,0.05)",
      },
      borderRadius: {
        xl2: "1rem",
      },
    },
  },
  plugins: [],
};
