const js = require("@eslint/js");

module.exports = [
  js.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx,js,jsx}"],
  },
  {
    ignores: ["dist/", "node_modules/"],
  },
];
