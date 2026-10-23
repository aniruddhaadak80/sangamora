import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // UI is a React-19 primitive kit consumed by the web app.
    settings: { react: { version: "19" } },
  },
  globalIgnores([
    "node_modules/**",
    // Ship no styles; tokens.css is a comment-only compatibility stub.
    "src/tokens.css",
  ]),
]);

export default eslintConfig;
