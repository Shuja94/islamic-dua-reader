export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        reader: [
          "Noto Naskh Arabic",
          "Noto Sans Thaana",
          "Segoe UI",
          "Tahoma",
          "Arial",
          "sans-serif",
        ],
      },
      colors: {
        cream: "#f7edd9",
        parchment: "#fff8e9",
        gold: "#b6842f",
        ink: "#332514",
        palm: "#286053",
      },
      boxShadow: {
        soft: "0 18px 60px rgba(55, 38, 15, 0.14)",
      },
    },
  },
  plugins: [],
};
