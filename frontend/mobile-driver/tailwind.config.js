/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#22c55e",   // green-500
        danger:  "#ef4444",   // red-500
        warning: "#f97316",   // orange-500
      },
    },
  },
  plugins: [],
};