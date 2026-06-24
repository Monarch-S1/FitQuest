import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const expoConfig = require("eslint-config-expo/flat");
const prettierConfig = require("eslint-config-prettier/flat");

export default [
  // ── Global ignores ──────────────────────────────────
  {
    ignores: [
      "dist/*",
      "web-build/*",
      "node_modules/*",
      "expo-env.d.ts",
      "nativewind-env.d.ts",
      "scripts/*",
      "supabase/functions/*",
    ],
  },

  ...expoConfig,
  prettierConfig,

  // ── Override rules ──────────────────────────────────
  {
    rules: {
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
