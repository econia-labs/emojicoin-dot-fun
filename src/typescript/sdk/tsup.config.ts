// cspell:word tsup

import { defineConfig } from "tsup";
import type { Options, Format } from "tsup";

// Ensure that these option fields are not undefined.
type MandatoryOptions = Options & {
  outDir: string;
  format: Format | Format[];
};

// Default config, used as a base template
const DEFAULT_CONFIG: Options = {
  bundle: true,
  clean: true,
  dts: true,
  minify: true,
  entry: ["src/index.ts"], // Include everything exported from src/index.ts.
  skipNodeModulesBundle: true,
  sourcemap: true,
  splitting: true,
  target: "es2020",
  platform: "node",
};

// Common.js config
const COMMON_CONFIG: MandatoryOptions = {
  ...DEFAULT_CONFIG,
  entry: ["src/index.ts", "src/indexer-v2/index.ts", "src/client/index.ts"],
  format: "cjs",
  outDir: "dist/common",
};

// ESM config
const ESM_CONFIG: MandatoryOptions = {
  ...DEFAULT_CONFIG,
  entry: ["src/**/*.ts"],
  format: "esm",
  outDir: "dist/esm",
};

export default defineConfig([COMMON_CONFIG, ESM_CONFIG]);
