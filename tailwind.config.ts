import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1rem", sm: "1.5rem", lg: "2rem" },
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        surface2: "rgb(var(--surface2) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        "accent-strong": "rgb(var(--accent-strong) / <alpha-value>)",
        "accent-soft": "rgb(var(--accent-soft) / <alpha-value>)",
        pine: "rgb(var(--pine) / <alpha-value>)",
        "pine-soft": "rgb(var(--pine-soft) / <alpha-value>)",
        gold: "rgb(var(--gold) / <alpha-value>)",
        ok: "rgb(var(--ok) / <alpha-value>)",
        danger: "rgb(var(--danger) / <alpha-value>)",
        /* Legacy platform palette, retargeted onto the merged design tokens so
           the dashboard/catalogue pages inherit the theme — dark mode included —
           without touching ~500 utility classes across those routes. */
        sand: {
          50: "rgb(var(--bg) / <alpha-value>)",
          100: "rgb(var(--surface2) / <alpha-value>)",
          200: "rgb(var(--line) / <alpha-value>)",
          300: "rgb(var(--line) / <alpha-value>)",
        },
        ink: {
          DEFAULT: "rgb(var(--ink) / <alpha-value>)",
          50: "rgb(var(--bg) / <alpha-value>)",
          900: "rgb(var(--ink) / <alpha-value>)",
          950: "rgb(var(--ink) / <alpha-value>)",
        },
        brand: {
          50: "rgb(var(--pine-soft) / <alpha-value>)",
          100: "rgb(var(--pine-soft) / <alpha-value>)",
          200: "rgb(var(--line) / <alpha-value>)",
          300: "rgb(var(--line) / <alpha-value>)",
          400: "rgb(var(--pine) / <alpha-value>)",
          500: "rgb(var(--pine) / <alpha-value>)",
          600: "rgb(var(--pine-deep) / <alpha-value>)",
          700: "rgb(var(--pine-deep) / <alpha-value>)",
          800: "rgb(var(--pine) / <alpha-value>)",
          900: "rgb(var(--pine-deep) / <alpha-value>)",
        },
        spice: {
          50: "rgb(var(--accent-soft) / <alpha-value>)",
          100: "rgb(var(--accent-soft) / <alpha-value>)",
          300: "rgb(var(--accent) / <alpha-value>)",
          500: "rgb(var(--accent) / <alpha-value>)",
          600: "rgb(var(--accent-strong) / <alpha-value>)",
          700: "rgb(var(--accent-strong) / <alpha-value>)",
        },
        heritage: {
          500: "rgb(var(--gold) / <alpha-value>)",
          600: "rgb(var(--gold) / <alpha-value>)",
        },
        coast: {
          100: "rgb(var(--pine-soft) / <alpha-value>)",
          500: "rgb(var(--pine) / <alpha-value>)",
          700: "rgb(var(--pine-deep) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-fraunces)", "var(--font-display)", "Georgia", "serif"],
        mono: ["var(--font-plex-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(18,33,28,.06), 0 4px 16px rgba(18,33,28,.06)",
        lift: "0 4px 12px rgba(18,33,28,.10), 0 12px 32px rgba(18,33,28,.10)",
      },
      keyframes: {
        shimmer: { "100%": { transform: "translateX(100%)" } },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        fadeUp: "fadeUp .35s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
