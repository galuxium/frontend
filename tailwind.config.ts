import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "media", 
  content: [
    "./app/**/*.{ts,tsx,js,jsx}",
    "./components/**/*.{ts,tsx,js,jsx}",
    "./pages/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--color-background)",
        surface: "var(--color-surface)",
        foreground: "var(--color-foreground)",
        primary: "var(--color-primary)",
        "primary-dark": "var(--color-primary-dark)",
        accent: "var(--color-accent)",
        "accent-dark": "var(--color-accent-dark)",
        secondary: "var(--color-secondary)",
        border: "var(--color-border)",
        "text-primary": "var(--color-primary-text)",
        "text-secondary": "var(--color-secondary-text)",
        success: "var(--color-success)",
        error: "var(--color-error)",
        info: "var(--color-info)",
        button:"var(--color-button)"
      },
    },
  },
  plugins: [],
};

export default config;
