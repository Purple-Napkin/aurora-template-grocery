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
          bg: "var(--aurora-bg, #F8FAF5)",
          surface: "var(--aurora-surface, #FFFFFF)",
          "surface-hover": "var(--aurora-surface-hover, #F1F5E8)",
          border: "var(--aurora-border, #E5E7EB)",
          accent: "var(--aurora-accent, #15803D)",
          primary: "var(--aurora-primary, #15803D)",
          "primary-dark": "var(--aurora-primary-dark, #166534)",
          muted: "var(--aurora-muted, #64748B)",
          text: "var(--aurora-text, #1C1917)",
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
