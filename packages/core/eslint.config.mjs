import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // CORE is a pure engine package: no React tree, no pages directory.
    settings: { react: { version: "19" } },
    rules: { "@next/next/no-html-link-for-pages": "off" },
  },
  globalIgnores(["node_modules/**"]),
]);

export default eslintConfig;
