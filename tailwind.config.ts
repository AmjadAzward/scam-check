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
          DEFAULT: "#142357",
          hover: "#0e193f",
          light: "#1c327a",
        },
        trust: {
          DEFAULT: "#3157D5",
          hover: "#2544a8",
          subtle: "#eef2fd",
          muted: "#8ea4ee",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F7F8FA",
          subtle: "#F0F2F5",
          border: "#E4E7EC",
          borderSubtle: "#EDF0F4",
        },
        text: {
          primary: "#172033",
          secondary: "#667085",
          tertiary: "#98A2B3",
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
        soft: "0 1px 3px rgba(16, 24, 40, 0.05), 0 1px 2px rgba(16, 24, 40, 0.03)",
        card: "0 2px 8px -2px rgba(16, 24, 40, 0.06), 0 1px 4px -1px rgba(16, 24, 40, 0.04)",
        elevated: "0 8px 24px -4px rgba(16, 24, 40, 0.08), 0 4px 12px -2px rgba(16, 24, 40, 0.04)",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
