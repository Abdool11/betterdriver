import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["DM Sans", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        bg: {
          DEFAULT: "#111827",
          card: "#1C2333",
          elevated: "#243044",
        },
        amber: {
          DEFAULT: "#F59E0B",
          light: "#FCD34D",
          dark: "#D97706",
        },
        border: "#2d3a4f",
        text: {
          primary: "#F9FAFB",
          secondary: "#9CA3AF",
          muted: "#6B7280",
        },
      },
      borderRadius: {
        sm: "0.375rem",
        md: "0.75rem",
        lg: "1.25rem",
        xl: "1.75rem",
        "2xl": "2.5rem",
      },
      boxShadow: {
        amber: "0 4px 20px rgba(245, 158, 11, 0.3)",
        "amber-lg": "0 8px 40px rgba(245, 158, 11, 0.4)",
        card: "0 2px 12px rgba(0, 0, 0, 0.3)",
      },
    },
  },
  plugins: [],
};

export default config;
