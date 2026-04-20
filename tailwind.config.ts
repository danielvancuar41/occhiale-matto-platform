import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          black: "#0a0a0a",
          yellow: "#F5D547",
          red: "#E63946"
        }
      },
      fontFamily: {
        display: ["Bebas Neue", "sans-serif"],
        sans: ["Montserrat", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
