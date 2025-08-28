// cspell:word dexscreener

// @ts-check
import analyzer from "@next/bundle-analyzer";
import { ROUTES } from "./src/router/routes";
import { DEFAULT_SORT_BY } from "../sdk/src/indexer-v2/types/common";
import { DEFAULT_STATS_SORT_BY } from "./src/app/stats/(utils)/schema";

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
  experimental: {
    serverMinification: false,
    serverSourceMaps: true,
    isrFlushToDisk: true,
  },
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    // This is the publisher private key used in test. Hard code a fallback for convenience, since
    // an incorrect value would be an obvious, trivial fix that only affects local development.
    PUBLISHER_PRIVATE_KEY:
      process.env.PUBLISHER_PRIVATE_KEY ??
      "eaa964d1353b075ac63b0c5a0c1e92aa93355be1402f6077581e37e2a846105e",
  },
  ...(DEBUG ? debugConfigOptions : {}),
  swcMinify: process.env.NODE_ENV === "development" ? false : undefined,
  crossOrigin: "use-credentials",
  typescript: {
    tsconfigPath: "tsconfig.json",
    ignoreBuildErrors: process.env.IGNORE_BUILD_ERRORS === "true",
  },
  compiler: {
    styledComponents: true,
  },
  /**
   * Match the new default behavior in next 15, without opinionated caching for dynamic pages.
   * @see {@link https://nextjs.org/docs/app/api-reference/config/next-config-js/staleTimes#version-history}
   */
  experimental: {
    // Use turbo when running/building locally. Since it's experimental, avoid it in production.
    turbo: process.env.NODE_ENV === "development" ? {} : undefined,
    // The browser cache stale time. This is a browser/client-side specific cache, not the global
    // data cache.
    staleTimes: {
      dynamic: 0, // Default is normally 30s.
      static: 10, // Default is normally 180s.
    },
    // Not confirmed working: the idea here is to force synchronous revalidation after 60 seconds
    // but allow asynchronous (background) revalidation before that. This way, users wouldn't see
    // an extremely stale page if it hasn't been visited in a while- the most they'd ever see is
    // 60 seconds.
    swrDelta: 60,
    serverMinification: DEBUG || process.env.NODE_ENV === "development" ? false : true,
    serverSourceMaps: DEBUG || process.env.NODE_ENV === "development" ? true : false,
  },
  productionBrowserSourceMaps: DEBUG || process.env.NODE_ENV === "development" ? true : false,
  // Log full fetch URLs if we're in a specific environment.
  logging:
    process.env.NODE_ENV === "development" ||
    process.env.NODE_ENV === "test" ||
    process.env.VERCEL_ENV === "preview" ||
    process.env.VERCEL_ENV === "development"
      ? {
          fetches: {
            fullUrl: true,
          },
        }
      : undefined,
  transpilePackages: ["@/sdk"],
  redirects: async () => [
    {
      source: "/",
      destination: "/home",
      permanent: true,
    },
  ],
  rewrites: async () => [
    // Default slug rewrites.
    {
      source: ROUTES.home,
      destination: `${ROUTES.home}/${DEFAULT_SORT_BY}/1`,
    },
    {
      source: ROUTES.stats,
      destination: `${ROUTES.stats}/${DEFAULT_SORT_BY}/1/desc`,
    },
    // These rewrites have been added after moving all the API routes to the /api folder.
    {
      source: "/candlesticks",
      destination: "/api/candlesticks",
    },
    {
      source: "/pools/api",
      destination: "/api/pools",
    },
    {
      source: "/coingecko/historical_trades",
      destination: "/api/coingecko/historical_trades",
    },
    {
      source: "/coingecko/tickers",
      destination: "/api/coingecko/tickers",
    },
    {
      source: "/dexscreener/asset",
      destination: "/api/dexscreener/asset",
    },
    {
      source: "/dexscreener/events",
      destination: "/api/dexscreener/events",
    },
    {
      source: "/dexscreener/latest-block",
      destination: "/api/dexscreener/latest-block",
    },
    {
      source: "/dexscreener/pair",
      destination: "/api/dexscreener/pair",
    },
    // End of api rewrites
  ],
};

export default withBundleAnalyzer(nextConfig);
