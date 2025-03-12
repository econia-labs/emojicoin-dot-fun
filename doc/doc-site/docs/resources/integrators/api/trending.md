---
slug: /integrators/api/trending
title: 📱 Trending
hide_title: false
description: Trending API
---

Route: `/api/trending`.

Query the endpoint with no query params for retrieving the top 25 trending
markets.

Prices are expressed in terms of the base asset being the emojicoin:

- `"quote_price": 0.0123` indicates `1` emojicoin is worth `0.0123` APT.
- `"usd_price": 0.20` indicates `1` emojicoin is worth `0.20 USD`.

**NOTE: `market_cap_usd` and `usd_price` may be absent if APT/USD isn't fetched
successfully.**

All APT and emojicoin values are returned in their decimalized formats; that
is, they are divided by $10^8$.

All addresses are [AIP-40] compliant, meaning that they include leading 0s.

`base` always refers to the emojicoin.

`quote` always refers to APT.

`theoretical_curve_price` is the current spot price.

### Example return data

<!-- markdownlint-disable MD013 -->

```json
[
  {
    "market_id": 413,
    "symbol_bytes": "0xf09fa7a7",
    "symbol_emojis": ["🧧"],
    "market_address": "0x6b0debd0d80e34b073b1de5f8bfe27983dd604497ac457fb082844894a3e548d",
    "theoretical_curve_price": 0.03549040905972445,
    "market_nonce": 26386,
    "in_bonding_curve": false,
    "clamm_virtual_reserves": {
      "base": 0,
      "quote": 0
    },
    "cpamm_real_reserves": {
      "base": 558793.14425783,
      "quote": 19831.79726948
    },
    "cumulative_stats": {
      "base_volume": 102729004.71052358,
      "quote_volume": 515981.96931268,
      "integrator_fees": 5097.70502162,
      "pool_fees_base": 76893.22065444,
      "pool_fees_quote": 626.29825998,
      "n_swaps": 25511,
      "n_chat_messages": 840
    },
    "instantaneous_stats": {
      "circulating_supply": 44441206.85574217,
      "total_quote_locked": 19831.79726948,
      "total_value_locked": 39663.59453896,
      "fully_diluted_value": 1597068.4076876,
      "market_cap_apt": 1577236.61041812,
      "market_cap_usd": 9086302.388957748 // possibly undefined
    },
    "daily_tvl_lp_growth": 1.0004915,
    "daily_volume_quote": 3825.62539183,
    "daily_volume_base": 101609.09655166,
    "quote_price": 0.03557685205345566,
    "quote_price_24h_ago": 0.04263140726110441,
    "quote_price_delta_24h": -16.547788733413714,
    "usd_price": 0.20495468699475275 // possibly undefined
  }
]
```

<!-- markdownlint-enable MD013 -->

[aip-40]: https://github.com/aptos-foundation/AIPs/blob/fa86194b1bd617f7f7f747c5d962b9039286f689/aips/aip-40.md
