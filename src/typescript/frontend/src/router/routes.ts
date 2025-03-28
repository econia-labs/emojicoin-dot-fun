import { expandRoutes } from "./utils";

const _ = "";

// cspell:word dexscreener
const expanded = expandRoutes({
  api: {
    arena: {
      position: _,
      "historical-positions": _,
      candlesticks: _,
    },
    candlesticks: _,
    chats: _,
    dexscreener: {
      asset: _,
      pair: _,
      events: _,
      "latest-block": _,
    },
    pools: _,
    trades: _,
    trending: _,
  },
  arena: _,
  cult: _,
  dev: {
    "color-generator": _,
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

// Manually add the root API route to the `ROUTES`- it's difficult to get the types to work with
// `expandRoutes` properly.
export const ROUTES = {
  ...expanded,
  api: {
    ...expanded.api,
    ".": "/api",
  },
} as const;
