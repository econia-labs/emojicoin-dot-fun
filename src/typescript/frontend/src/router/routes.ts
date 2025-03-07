import { expandRoutes } from "./utils";

// cspell:word dexscreener
export const ROUTES = expandRoutes({
  api: {
    arena: {
      position: "",
      "historical-positions": "",
    },
    candlesticks: "",
    dexscreener: {
      asset: "",
      pair: "",
      events: "",
      "latest-block": "",
    },
    pools: "",
    trending: "",
  },
  arena: "",
  cult: "",
  dev: {
    metadata: "",
    "verify-status": "",
    "verify-api-keys": "",
  },
  home: "",
  launch: "",
  "launching-soon": "",
  maintenance: "",
  market: "",
  "not-found": "",
  pools: "",
  test: "",
  "test-utils": "",
  verify: "",
  wallet: "",
} as const);
