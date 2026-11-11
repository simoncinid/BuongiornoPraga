import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          active: "rgb(var(--primary-active) / <alpha-value>)",
          disabled: "rgb(var(--primary-disabled) / <alpha-value>)",
          soft: "var(--primary-soft)",
          "soft-strong": "var(--primary-soft-strong)",
          muted: "var(--primary-muted)"
        },
        navy: "#071A35",
        "navy-soft": "#102747",
        "prague-stone": "#EEE9DF",
        "vltava-blue": "#526C89",
        ink: "#0B1D37",
        body: "#53606F",
        muted: "#7C8490",
        "muted-soft": "#A9AFB7",
        hairline: "#D9D9D3",
        "hairline-soft": "#ECEBE6",
        "border-strong": "#A8A49B",
        canvas: "#FBFAF7",
        "surface-soft": "#F3F0E9",
        "surface-card": "#FFFFFF",
        "surface-strong": "#EEE9DF",
        "on-primary": "#000000",
        "on-dark": "#FFFFFF",
        "legal-link": "#102747",
        "star-rating": "rgb(var(--primary) / <alpha-value>)",
        whatsapp: "#25D366",
        success: "#15803D",
        warning: "rgb(var(--warning) / <alpha-value>)",
        scrim: "#000000"
      },
      borderRadius: {
        xs: "4px",
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px"
      },
      boxShadow: {
        card: "rgba(11, 29, 55, 0.06) 0 1px 2px, rgba(7, 26, 53, 0.08) 0 8px 24px"
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif"
        ],
        display: ["var(--font-display)", "Georgia", "serif"]
      }
    }
  },
  plugins: []
};

export default config;
