import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#111111",
          dark: "#000000",
          light: "#F5F5F5",
        },
        accent: {
          DEFAULT: "#C9A227",
          hover: "#B8941F",
          ink: "#7A5C00",
          glow: "#E3C565",
        },
        cream: {
          bg: "#FAFAFA",
          card: "#FFFFFF",
        },
        ink: {
          DEFAULT: "#0A0A0A",
          muted: "#6B7280",
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
