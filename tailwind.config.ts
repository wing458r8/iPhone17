import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Hiragino Sans"',
          '"Yu Gothic UI"',
          "sans-serif",
        ],
      },
      colors: {
        apple: {
          blue: "#0071e3",
          "blue-hover": "#0077ed",
          green: "#34c759",
          red: "#ff3b30",
          orange: "#ff9500",
          gray: {
            50: "#f5f5f7",
            100: "#e8e8ed",
            200: "#d2d2d7",
            400: "#86868b",
            600: "#515154",
            900: "#1d1d1f",
          },
        },
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
