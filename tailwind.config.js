/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#0F1115",
          elevated: "#171A21",
        },
        accent: {
          DEFAULT: "#F59E0B",
        },
        success: {
          DEFAULT: "#10B981",
        },
        error: {
          DEFAULT: "#EF4444",
        },
        warning: {
          DEFAULT: "#F59E0B",
        },
        text: {
          primary: "#F3F4F6",
          secondary: "#9CA3AF",
        },
        border: {
          subtle: "#2A2D35",
          accent: "#F59E0B",
        },
        surface: {
          highlight: "#1F2230",
        },
      },
      fontFamily: {
        heading: ["BebasNeue-Regular", "sans-serif"],
        body: ["Inter-Regular", "sans-serif"],
        "body-semi": ["Inter-SemiBold", "sans-serif"],
        "body-bold": ["Inter-Bold", "sans-serif"],
      },
      borderRadius: {
        hud: "4px",
        panel: "2px",
      },
    },
  },
  plugins: [],
};
