// cspell:word dexscreener

// @ts-check
import analyzer from "@next/bundle-analyzer";

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
  },
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(DEBUG ? debugConfigOptions : {}),
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
    staleTimes: {
      dynamic: 0, // Default is normally 30s.
      static: 60, // Default is normally 180s.
    },
  },
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
  transpilePackages: ["@sdk"],
  redirects: async () => [
    {
      source: "/",
      destination: "/home",
      permanent: true,
    },
  ],
  rewrites: async () => [
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
