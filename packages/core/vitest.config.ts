import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // The mass-conservation and state-shape tests step the simulation 900-1000
    // times. That is comfortably under a second on a fast laptop but can cross
    // the 5s default on shared CI runners, so give the suite a wider budget.
    testTimeout: 20_000,
  },
});
