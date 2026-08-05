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
        primary: "#D6AD57",
        "primary-active": "#B98D35",
        "primary-disabled": "#ECD59C",
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
        "on-primary": "#071A35",
        "on-dark": "#FFFFFF",
        "legal-link": "#102747",
        "star-rating": "#D6AD57",
        whatsapp: "#25D366",
        success: "#15803D",
        warning: "#E87500",
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
        card: "rgba(20, 50, 75, 0.06) 0 1px 2px, rgba(18, 104, 214, 0.1) 0 8px 24px"
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
