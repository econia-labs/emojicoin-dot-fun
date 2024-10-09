// @ts-check
import analyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = analyzer({
  enabled: process.env.ANALYZE === "true",
});

const DEBUG = process.env.BUILD_DEBUG === "true";
const styledComponentsConfig = {
  displayName: true,
  ssr: true,
  fileName: true,
  minify: false,
};
/** @type {import('next').NextConfig} */
const debugConfigOptions = {
  productionBrowserSourceMaps: true,
  outputFileTracing: true,
  cleanDistDir: true,
  experimental: {
    serverMinification: false,
    serverSourceMaps: true,
    staleTimes: {
      dynamic: 0, // Default is normally 30s.
      static: 30, // Default is normally 180s.
    },
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  crossOrigin: "use-credentials",
  typescript: {
    tsconfigPath: "tsconfig.json",
  },
  compiler: {
    styledComponents: DEBUG ? styledComponentsConfig : true,
  },
  ...(DEBUG ? debugConfigOptions : {}),
  transpilePackages: [
    "@sdk",
    "@mizuwallet-sdk/aptos-wallet-adapter",
    "@mizuwallet-sdk/core",
    "@mizuwallet-sdk/core/dist",
    "graphql-request",
    "@aptos-labs/wallet-adapter-react",
    "@aptos-labs/wallet-adapter-core",
  ]
};
