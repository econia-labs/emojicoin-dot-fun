import analyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";

const withBundleAnalyzer = analyzer({
  enabled: process.env.ANALYZE === "true",
});

const DEBUG = process.env.BUILD_DEBUG === "true";
/** @type {import('next').NextConfig} */
const debugConfigOptions = {
  productionBrowserSourceMaps: true,
  outputFileTracing: true,
  swcMinify: false,
  cleanDistDir: true,
};

const nextConfig: NextConfig = {
  crossOrigin: "use-credentials",
  typescript: {
    tsconfigPath: "tsconfig.json",
    ignoreBuildErrors: process.env.IGNORE_BUILD_ERRORS === "true",
  },
  ...(DEBUG ? debugConfigOptions : {}),
  experimental: {
    serverMinification: DEBUG || process.env.NODE_ENV === "development" ? false : true,
    serverSourceMaps: DEBUG || process.env.NODE_ENV === "development" ? true : false,
  },
  transpilePackages: ["@/sdk"],
};

export default withBundleAnalyzer(nextConfig);
