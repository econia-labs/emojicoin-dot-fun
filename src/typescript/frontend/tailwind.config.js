/** @type {import('tailwindcss').Config} */
import colors from "tailwindcss/colors";
delete colors.lightBlue;
delete colors.warmGray;
delete colors.lightBlue;
delete colors.trueGray;
delete colors.coolGray;
delete colors.blueGray;
import { fontFamily } from "tailwindcss/defaultTheme";

module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        pixelar: ["var(--font-pixelar)", ...fontFamily.sans],
        forma: ["var(--font-forma)", ...fontFamily.sans],
        "forma-bold": ["var(--font-formaM)", ...fontFamily.sans],
        "forma-thin": ["var(--font-formaDR)", ...fontFamily.sans],
      },
      screens: {
        tall: { raw: "(min-height: 960px)" },
        "mobile-sm": "320px",
        "mobile-md": "375px",
        "mobile-lg": "425px",
        sm: "640.1px",
        md: "768.1px",
        lg: "1024.1px",
        xl: "1280.1px",
        xxl: "1536.1px",
      },
      boxShadow: {
        pretty:
          "-0.5px 0.5px 0.3px rgba(0,0,0,0.04), -1.1px 1.1px 0.7px rgba(0,0,0,0.055), -1.8px 1.8px 1.2px rgba(0,0,0,0.064), -2.7px 2.7px 1.8px rgba(0,0,0,0.071), -3.9px 3.9px 2.6px rgba(0,0,0,0.077), -5.5px 5.5px 3.7px rgba(0,0,0,0.083), -7.8px 7.8px 5.3px rgba(0,0,0,0.089)",
      },
      dropShadow: {
        text: "0 1px 2px #000000dd",
        voltage: "1px 0 5px #ffffff99",
      },
    },
    colors: {
      ...colors,
      white: "#FFFFFF",
      "lighter-gray": "#9A9CB0",
      "light-gray": "#717386",
      "dark-gray": "#33343D",
      black: "#000000",
      blue: "#64A7FF",
      green: "#2FA90F",
      pink: "#CD2F8D",
      "ec-blue": "#086CD9",
      warning: "#FFB119",
      error: "#F3263E",
      transparent: "transparent",
    },
    keyframes: {
      fadeIn: {
        "0%": { opacity: "0" },
        "50%": { opacity: "1" },
        "100%": { opacity: "1" },
      },
      flicker: {
        "0%, 40%, 80%": { opacity: "1", transform: "scale(1) hue-rotate(0deg) brightness(1)" },
        "20%": { opacity: "0.8", transform: "scale(1.05) hue-rotate(40deg) brightness(1.1)" },
        "60%": { opacity: "0.9", transform: "scale(1.03) hue-rotate(-40deg) brightness(1.15)" },
        "100%": { opacity: "0.85", transform: "scale(1.02) hue-rotate(20deg) brightness(1.25)" },
      },
      carousel: {
        "0%": { transform: "translateX(0)" },
        "100%": { transform: "translateX(-4527.83)" },
      },
    },
    animation: {
      fadeIn: "fadeIn 2s ease-in-out forwards",
      flicker: "flicker 1s infinite",
      carousel: "carousel 88.407s linear infinite",
    },
  },
  plugins: [require("@headlessui/tailwindcss")],
};
