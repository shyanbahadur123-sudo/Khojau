import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0B7168",
          dark: "#095A53",
          light: "#E6F2F0",
        },
        cream: {
          bg: "#F4F1E8",
          card: "#FFFDF8",
        },
        ink: {
          DEFAULT: "#17201F",
          muted: "#66706E",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
