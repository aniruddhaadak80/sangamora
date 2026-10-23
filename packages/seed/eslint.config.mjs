import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // SEED package: pure offline data + PRNG, no React and no pages.
    settings: { react: { version: "19" } },
    rules: { "@next/next/no-html-link-for-pages": "off" },
  },
  globalIgnores(["node_modules/**"]),
]);

export default eslintConfig;
