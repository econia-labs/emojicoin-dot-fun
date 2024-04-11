# Emojicoin Dot Fun Architecture Specification

The key words `MUST`, `MUST NOT`, `REQUIRED`, `SHALL`, `SHALL NOT`, `SHOULD`,
`SHOULD NOT`, `RECOMMENDED`,  `MAY`, and `OPTIONAL` in this document are to be
interpreted as described in [RFC 2119].

These keywords `SHALL` be in `monospace` for ease of identification.

## General mechanism

1. Each emojicoin market `SHALL` be denominated in `APT`.
1. Each market `SHALL` operate in two states: an initial bonding curve, then a
   simple constant product pool.
1. The bonding curve state `SHALL` implement a concentrated liquidity automated
   market maker curve that contains purely emojicoins upon initialization,
   eventually exhausted fully into `APT` upon bonding curve phase completion.
1. After completing the bonding curve phase, the `APT` generated from initial
   buy orders `SHALL` be locked into a constant product pool with set aside
   emojicoin reserves, such that market price is identical before and after the
   state transition.
1. The entire emojicoin supply `SHALL` be minted upon market initialization,
   with mint, burn, and freeze capabilities destroyed after minting total
   supply, to be allocated for bonding curve and constant-product states.
1. A buy order that breaks the market out of the bonding curve `SHALL` continue
   to fill after the state transition, rather than fragmenting the order into
   two transactions.

## Coin definitions

1. New coins `SHALL` use the same number of decimals as `APT` for ease of
   constant product calculations.
1. Each Emojicoin's `symbol` field `SHALL` use hex-encoded UTF8.
1. Each Emojicoin's `name` field `SHALL` use the format `A [+ B] emojicoin`
   where `A` and optionally `B` are the official emoji name, for example
   "Globe with Meridians emojicoin" or "Rocket + Rocket emojicoin".

## Global tracking

1. A registry `SHALL` track uniquely registered emojicoin markets and reject
   attempted re-registrations, enforcing canonical markets for each emojicoin.
1. For parallelism, `APT` for each pool `SHALL` be contained locally. To enable
   total value locked calculations, an aggregator `SHALL` track all `APT`
   deposited into the Move package.

## APIs

1. Trade functions `SHALL` include an `integrator_fee_rate_bps` and an
   `integrator_address` to be assessed on the `APT` volume from the trade (asset
   in for a buy, asset out for a sell) and deposited to the integrator's wallet.

[rfc 2119]: https://www.ietf.org/rfc/rfc2119.txt
