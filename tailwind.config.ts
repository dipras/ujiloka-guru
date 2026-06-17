import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#162033",
        muted: "#637083",
        canvas: "#f5f7fb",
        panel: "#ffffff",
        line: "#dbe2ea",
        primary: "#1b63b7",
        accent: "#0f9f8f",
        success: "#17803d",
        warning: "#b7791f",
        danger: "#c24136",
      },
      boxShadow: {
        soft: "0 16px 48px rgba(20, 32, 54, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
