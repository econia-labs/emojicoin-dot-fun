// cspell:word dexscreener
export const ROUTES = {
  root: "/",
  // Alphabetized after this.
  api: {
    trending: "/api/trending",
  },
  arena: "/arena",
<<<<<<< HEAD
  candlesticks: "/candlesticks",
=======
  arenaHistoricalPositions: "/arena/historical-positions",
  arenaPosition: "/arena/position",
>>>>>>> 394c4db9 ([ECO-2811] Bump processor submodule; add/separate SDK test commands for arena; change skip to page; add arena routes to `ROUTES` (#585))
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
