import { createRequire } from "node:module";

import eslintPluginPrettier from "eslint-plugin-prettier";

const require = createRequire(import.meta.url);
const expoConfig = require("eslint-config-expo/flat");
const prettierConfig = require("eslint-config-prettier/flat");

export default [
  ...expoConfig,
  prettierConfig,
  {
    plugins: {
      prettier: eslintPluginPrettier,
    },
    rules: {
      "prettier/prettier": "error",
    },
    ignores: [
      "dist/*",
      "web-build/*",
      "node_modules/*",
      "expo-env.d.ts",
      "nativewind-env.d.ts",
      "*.config.js",
      "*.config.ts",
    ],
  },
];
