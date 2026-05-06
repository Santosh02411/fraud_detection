/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0f",
        card: "rgba(255, 255, 255, 0.05)",
        primary: {
          DEFAULT: "#6366f1",
          hover: "#4f46e5",
        },
        secondary: "#ec4899",
        accent: "#06b6d4",
        fraud: "#ef4444",
        safe: "#10b981",
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
