# emojicoin dot fun Architecture Specification

The key words `MUST`, `MUST NOT`, `REQUIRED`, `SHALL`, `SHALL NOT`, `SHOULD`,
`SHOULD NOT`, `RECOMMENDED`,  `MAY`, and `OPTIONAL` in this document are to be
interpreted as described in [RFC 2119].

These keywords `SHALL` be in `monospace` for ease of identification.

## Terminology

1. Price `SHALL` be interpreted as a ratio of quote to base.
1. Volume `SHALL` be interpreted in terms of the net proceeds to transactional
   counterparties, independent of fees: base volume `SHALL` be interpreted as
   the swapper's net proceeds in a buy, or the amount deposited into the market
   in a sell; quote volume `SHALL` be interpreted as the swapper's net proceeds
   in a sell, or the amount deposited into the market in a buy.

## General mechanism

1. Each emojicoin market `SHALL` be denominated in `APT`.
1. Each market `SHALL` operate in two states: an initial bonding curve, then a
   simple constant product pool.
1. The bonding curve state `SHALL` implement a concentrated liquidity automated
   market maker curve that contains purely emojicoins upon initialization,
   eventually exhausted fully into `APT` upon bonding curve state completion.
1. After completing the bonding curve state, the `APT` generated from initial
   buy orders `SHALL` be locked into a constant product pool with set aside
   emojicoin reserves, such that market price is identical before and after the
   state transition.
1. The entire emojicoin supply `SHALL` be minted upon market initialization,
   with mint, burn, and freeze capabilities destroyed after minting total
   supply, to be allocated for bonding curve and constant-product states.
1. A buy order that breaks the market out of the bonding curve `SHALL` continue
   to fill after the state transition, rather than fragmenting the order into
   two transactions.

## Indexing

1. The user interface `SHALL` rely solely on the Aptos GraphQL endpoint for
   indexing purposes, enabling for example a leaderboard based on market
   capitalization of each emojicoin market.
1. A `State` event `SHALL` be emitted for every operation, to enable fetching
   market state as of the most recent event.
1. Each market `SHALL` track a vector of internal `PeriodicState` event
   accumulators, to enable volume and price versus times charts, with an
   internal variable for the last time the event was emitted. Each granularity,
   for example `1min`, `30min`, `1hr`, `6hr`, and `24hr`, `SHALL` track the last
   time it was emitted, and use integer time truncation to check that a new
   period has not started. When an operation results in a new period, a
   `PeriodicState` event `SHALL` be emitted for each granularity that has
   lapsed.
1. A view function shall enable enable lookup of global total value locked,
   number of emojicoin markets, and cumulative volume, via aggregators when
   necessary.
1. Events to simulate swap and liquidity provisioning operations `SHALL` be
   calculated via simulation functions that can be called directly from view
   functions.
1. Simulation functions `SHALL` be paired with simulation commitment functions
   such that results can be applied during runtime, using the same logic as
   view function indexing functions.
1. Events `SHALL` include timestamps for chronological indexing.
1. Events `SHALL` include information for fees charged, accumulated at the
   market and global level.
1. The total number of trades `SHALL` be indexed at the market and global level.
1. Cumulative fees `SHALL` be indexed at the market and global level.
1. Liquidity provider APR `SHALL` be tracked by comparing the ratio of liquidity
   to issued liquidity provider tokens over time.

## Frontend

1. The frontend `MAY` implement a market capitalization leaderboard with
   logarithmic scaling to enable viewing of prevalent markets.
1. The frontend `SHALL` enable a king-of-the-hill style mechanism to show
   emojicoins passing others in market capitalization.
1. The frontend `SHALL` enable permissionless registration of a new emojicoin
   market that has not yet been registered.
1. The frontend `SHALL` display the percent bonding curve progress in terms of
   the proportion of quote that must be deposited for the state transition.
1. The frontend `SHALL` show as many features as possible, stopping just short
   of transaction submission for blocked users.
1. The frontend `SHALL` stipulate that all values are specified in `APT`.

## Coin definitions

1. New coins `SHALL` use the same number of decimals as `APT` for ease of
   constant product calculations.
1. Each Emojicoin's `symbol` field `SHALL` use hex-encoded UTF8.
1. Each Emojicoin's `name` field `SHALL` use the format `<symbol> emojicoin`
   where `<symbol>` is identical to the bytes from its `symbol` field.
1. Each Emojicoin `SHALL` have a unique liquidity provider coin (LP coin)
   associated with it.
1. Each LP coin's `symbol` field `SHALL` use the format `LP-<market ID>`
   where `<market ID>` is the corresponding market's `market_id`.
1. Each LP coin's `name` field `SHALL` use the format `<symbol> emojicoin LP`
   where `<symbol>` is identical to the bytes from the corresponding emojicoin's
   `symbol` field.

## Global tracking

1. A registry `SHALL` track uniquely registered emojicoin markets and reject
   attempted re-registrations, enforcing canonical markets for each emojicoin.
1. For parallelism, `APT` for each pool `SHALL` be contained locally. To enable
   total value locked calculations, an aggregator `SHALL` track all `APT`
   deposited into the Move package.
1. View functions `SHALL` enable lookup of markets by symbol.
1. Each market `SHALL` be assigned a 1-indexed `market_id: u64`.

## APIs

1. Trade functions `SHALL` include an `integrator_fee_rate_bps` and an
   `integrator_address` to be assessed on the `APT` volume from the trade (asset
   in for a buy, asset out for a sell) and deposited to the integrator's wallet.
1. Market registration functions `SHALL` charge 1 `APT`, deposited to the
   integrator's wallet, to mitigate excessive registrations.

## Assorted implementation details

1. Integer truncation `SHALL` result in fractional subunits kept in the pool.
1. The state transition `SHALL` check that the real quote ceiling has been
   reached, withdrawing all base in the case that truncation has resulted in
   extra subunits left in the bonding curve.
1. Multiplication operations `SHALL` use intermediate `u128` and `u256` values
   as needed to avoid overflow.
1. Objects `SHALL` be non-transferrable.
1. The implementation `MAY` enable a start time variable that can only be set
   once, to delay trading from the onset of package publication.
1. The package `SHALL` be published immutably.

## Presentation

1. The implementation `SHALL` use the stylized format `emojicoin dot fun`.
1. Indivisible subunits `SHALL` be referred to as `emos`.

[rfc 2119]: https://www.ietf.org/rfc/rfc2119.txt
