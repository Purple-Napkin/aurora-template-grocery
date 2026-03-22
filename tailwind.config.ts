import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    // Pick up utilities used in @aurora-studio/starter-core (e.g. CatalogueFilters sidebar md:block)
    "./node_modules/@aurora-studio/starter-core/dist/**/*.js",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      colors: {
        aurora: {
          bg: "var(--aurora-bg, #f4fbf7)",
          surface: "var(--aurora-surface, #ffffff)",
          "surface-hover": "var(--aurora-surface-hover, #ecf7f0)",
          border: "var(--aurora-border, #d8ebe3)",
          accent: "var(--aurora-accent, #1fa971)",
          primary: "var(--aurora-primary, #1fa971)",
          "primary-dark": "var(--aurora-primary-dark, #178c5d)",
          muted: "var(--aurora-muted, #5f6b64)",
          text: "var(--aurora-text, #111827)",
        },
      },
      borderRadius: {
        container: "20px",
        card: "16px",
        component: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
