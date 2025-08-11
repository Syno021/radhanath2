/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./App.{js,jsx,ts,tsx}",
      "./app/**/*.{js,jsx,ts,tsx}",
      "./screens/**/*.{js,jsx,ts,tsx}"
    ],
    theme: {
      extend: {
        colors: {
          churchOrange: "#FF8C42", // Main orange
          churchDark: "#5A2D0C",   // Dark brown
          churchLight: "#FFF5E6",  // Cream background
          churchAccent: "#FFD580", // Soft gold
        },
        fontFamily: {
          serif: ["Merriweather", "serif"], // Elegant church look
          sans: ["Inter", "sans-serif"],
        }
      },
    },
    plugins: [],
  };
  