import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "#B8922A",
          dark: "#9a7820",
          light: "#d4a843",
        },
        gold: {
          DEFAULT: "#B8922A",
          light: "#d4a843",
          lighter: "#f4e4a8",
          dark: "#9a7820",
        },
        navy: {
          DEFAULT: "#1a2e4a",
          dark: "#0f1e33",
        },
      },
      fontFamily: {
        serif: ["Playfair Display", "Georgia", "serif"],
        sans: ["Manrope", "sans-serif"],
        mono: ["JetBrains Mono", "Courier New", "monospace"],
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(135deg, #B8922A 0%, #d4a843 50%, #9a7820 100%)",
        "hero-gradient": "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 100%)",
        "dark-gradient": "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(184,146,42,0.12) 0%, transparent 70%)",
      },
      boxShadow: {
        luxury: "0 40px 80px rgba(184, 146, 42, 0.2)",
        gold: "0 0 30px rgba(184, 146, 42, 0.25)",
        glass: "0 8px 32px rgba(0, 0, 0, 0.08)",
        soft: "0 2px 12px rgba(0, 0, 0, 0.04)",
      },
      backdropBlur: {
        glass: "20px",
      },
      animation: {
        "fade-up": "fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) forwards",
        "marquee": "marquee-scroll 32s linear infinite",
        "grain": "grain-drift 8s steps(2) infinite",
        "shimmer": "shimmer 2s linear infinite",
        "blob": "blob 7s infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        blob: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
