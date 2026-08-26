import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1rem", sm: "1.5rem", lg: "2rem" },
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        sand: {
          50: "#FBF8F3",
          100: "#F6F0E7",
          200: "#EAE0D1",
          300: "#D9C9B2",
        },
        ink: {
          50: "#F4F7F6",
          900: "#12211C",
          950: "#0A1512",
        },
        brand: {
          50: "#EFFAF6",
          100: "#D7F2E8",
          200: "#AFE3D1",
          300: "#7CCFB5",
          400: "#46B294",
          500: "#26997C",
          600: "#177C64",
          700: "#126351",
          800: "#104F42",
          900: "#0E4036",
        },
        spice: {
          50: "#FDF3EA",
          100: "#FAE2CE",
          300: "#F0B27E",
          500: "#DE7418",
          600: "#C05E12",
          700: "#9A4A10",
        },
        heritage: {
          500: "#B7791F",
          600: "#96601A",
        },
        coast: {
          100: "#DEF2F8",
          500: "#1E8FB5",
          700: "#14657F",
        },
      },
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
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
