import { createRequire } from "node:module";

import eslintPluginPrettier from "eslint-plugin-prettier";

const require = createRequire(import.meta.url);
const expoConfig = require("eslint-config-expo/flat");
const prettierConfig = require("eslint-config-prettier/flat");

export default [
  // ── Global ignores ──────────────────────────────────
  // Must be a standalone config object for flat config format
  {
    ignores: ["dist/*", "web-build/*", "node_modules/*", "expo-env.d.ts", "nativewind-env.d.ts", "scripts/*"],
  },

  ...expoConfig,
  prettierConfig,

  // ── Override rules ──────────────────────────────────
  {
    plugins: {
      prettier: eslintPluginPrettier,
    },
    rules: {
      "prettier/prettier": "error",

      // ── Relaxed React 19 hooks rules ─────────────────
      // These are too aggressive for real-world application code.
      // They flag intentional patterns that are safe in practice.
      // Downgraded to "warn" so they don't block CI.
      "react-hooks/refs": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
    },
  },
];
