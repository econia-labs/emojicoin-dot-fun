import { expandRoutes } from "./utils";

const _ = "";

// cspell:word dexscreener
export const ROUTES = expandRoutes({
  api: {
    arena: {
      position: _,
      "historical-positions": _,
      candlesticks: _,
    },
    candlesticks: _,
    dexscreener: {
      asset: _,
      pair: _,
      events: _,
      "latest-block": _,
    },
    pools: _,
    trending: _,
  },
  arena: _,
  cult: _,
  dev: {
    metadata: _,
    "verify-status": _,
    "verify-api-keys": _,
  },
  home: _,
  launch: _,
  "launching-soon": _,
  maintenance: _,
  market: _,
  "not-found": _,
  pools: _,
  test: _,
  "test-utils": _,
  verify: _,
  wallet: _,
} as const);
