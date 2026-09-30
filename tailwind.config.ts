import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#102A43",
          hover: "#0B2136",
          light: "#1F4567",
        },
        trust: {
          DEFAULT: "#2563EB",
          hover: "#1D4ED8",
          subtle: "#EFF6FF",
          muted: "#93B4F4",
        },
        accent: {
          DEFAULT: "#0F8B8D",
          hover: "#0B7375",
          subtle: "#EAF8F7",
          muted: "#72C9C7",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F3F6FA",
          subtle: "#E8EEF5",
          border: "#C9D5E2",
          borderSubtle: "#DCE5EE",
        },
        text: {
          primary: "#132238",
          secondary: "#4B5D73",
          tertiary: "#718096",
        },
        risk: {
          low: "#157A55",
          "low-bg": "#EBF8F2",
          "low-border": "#A7E4CB",
          medium: "#B7791F",
          "medium-bg": "#FEF7E6",
          "medium-border": "#FBD38D",
          high: "#C53A3A",
          "high-bg": "#FDF2F2",
          "high-border": "#F8B4B4",
          critical: "#8B1E1E",
          "critical-bg": "#FDF0F0",
          "critical-border": "#EAA8A8",
        },
      },
      borderRadius: {
        card: "14px",
      },
      boxShadow: {
        soft: "0 3px 10px rgba(16, 42, 67, 0.10)",
        card: "0 14px 34px -20px rgba(16, 42, 67, 0.38), 0 3px 10px rgba(16, 42, 67, 0.07)",
        elevated: "0 22px 48px -18px rgba(16, 42, 67, 0.42), 0 10px 22px -14px rgba(37, 99, 235, 0.26)",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
