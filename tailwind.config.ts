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
        bg: "var(--bg)",
        surface: "var(--surface)",
        surface2: "var(--surface2)",
        line: "var(--line)",
        muted: "var(--muted)",
        accent: "var(--accent)",
        "accent-strong": "var(--accent-strong)",
        "accent-soft": "var(--accent-soft)",
        pine: "var(--pine)",
        "pine-soft": "var(--pine-soft)",
        gold: "var(--gold)",
        ok: "var(--ok)",
        danger: "var(--danger)",
        /* Legacy platform palette, retargeted onto the merged design tokens so
           the dashboard/catalogue pages inherit the theme — dark mode included —
           without touching ~500 utility classes across those routes. */
        sand: {
          50: "var(--bg)",
          100: "var(--surface2)",
          200: "var(--line)",
          300: "var(--line)",
        },
        ink: {
          DEFAULT: "var(--ink)",
          50: "var(--bg)",
          900: "var(--ink)",
          950: "var(--ink)",
        },
        brand: {
          50: "var(--pine-soft)",
          100: "var(--pine-soft)",
          200: "var(--line)",
          300: "var(--line)",
          400: "var(--pine)",
          500: "var(--pine)",
          600: "var(--pine-deep)",
          700: "var(--pine-deep)",
          800: "var(--pine)",
          900: "var(--pine-deep)",
        },
        spice: {
          50: "var(--accent-soft)",
          100: "var(--accent-soft)",
          300: "var(--accent)",
          500: "var(--accent)",
          600: "var(--accent-strong)",
          700: "var(--accent-strong)",
        },
        heritage: {
          500: "var(--gold)",
          600: "var(--gold)",
        },
        coast: {
          100: "var(--pine-soft)",
          500: "var(--pine)",
          700: "var(--pine-deep)",
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
