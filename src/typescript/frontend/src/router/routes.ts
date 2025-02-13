// cspell:word dexscreener
export const ROUTES = {
  root: "/",
  // Alphabetized after this.
  api: {
    trending: "/api/trending",
    candlesticks: "/api/candlesticks",
    pools: "/api/pools",
  },
  arena: {
    ".": "/arena",
    historicalPositions: "/arena/historical-positions",
    position: "/arena/position",
  },
  cult: "/cult",
  dexscreener: "/dexscreener",
  docs: "https://docs.emojicoin.fun/category/--start-here",
  home: "/home",
  launch: "/launch",
  launching_soon: "/launching",
  maintenance: "/maintenance",
  market: "/market",
  notFound: "/not-found",
  pools: "/pools",
  verify: "/verify",
  wallet: "/wallet",
} as const;
