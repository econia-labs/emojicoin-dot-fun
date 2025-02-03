<!-- markdownlint-disable line-length -->

# Coingecko API

The Coingecko API is implemented according to the Coingecko official API
requirements available
[here](https://docs.google.com/document/d/1v27QFoQq1SKT3Priq3aqPgB70Xd_PnDzbOCiuoCyixw/edit?usp=sharing),
with a few necessary changes in order to fit our product.

## `/coingecko/tickers`

`/coingecko/tickers` is implemented as required, but it is paginated. As
`emojicoin-dot-fun` can have up to 10 000 000 markets, pagination needs to be
present.

Pagination is implemented using `skip` and `limit` fields.

`limit` can be up to 500 (and is 100 by default). `skip` is 0 by default.

Tickers are ordered by time of market creation ascending.

### Example

Get all tickers from 150 to 200: `/coingecko/tickers?limit=50&skip=150`.

Get all tickers from 0 to 100: `/coingecko/tickers`.

Get all tickers from 100 to 200: `/coingecko/tickers?skip=100`.

### Example return data

`/coingecko/tickers?limit=1`

```json
[
  {
    "ticker_id": "0xSOME_ADDRESS::coin_factory::Emojicoin_0x1::aptos_coin::AptosCoin",
    "base_currency": "0xSOME_ADDRESS::coin_factory::Emojicoin",
    "target_currency": "0x1::aptos_coin::AptosCoin",
    "pool_id": "😀",
    "last_price": "0.001",
    "base_volume": "1234.56",
    "target_volume": "1.23456",
    "liquidity_in_usd": "123.456"
  }
]
```

## `/orderbook`

As an AMM DEX, this is N/A.

## `/historical_trades`

`/coingecko/historical_trades` is implemented according to the Coingecko supplied
specification, with the addition of the `skip` field.

`start_time` and `end_time` are unix timestamps. Using this fields will result
in an inclusive search (gte for `start_time`, lte for `end_time`).

`type` can be `buy` or `sell`.

`ticker_id` must the the same format as the `ticker_id` field returned by
`/tickers`.

`limit` can be up to 500 (and is 500 by default).

`skip` is 0 by default.

Trades are ordered by time of trade ascending.

`trade_id` starts at 2, and are always ascending, but may not be consecutive,
as IDs are shared with chat messages. `trade_id` are ticker specific, so
multiple trades with the same ID can exist.

### Example

Get the 51st trade for ticker `TICKER` after `TIME` unix timestamp :
`/historical_trades?ticker_id=TICKER&start_time=TIME&limit=1&skip=50`.

Get the first 100 trades for ticker `TICKER` :
`/historical_trades?ticker_id=TICKER&limit=100`.

### Example return data

```json
[
  {
    "trade_id": "1",
    "price": "0.01",
    "base_volume": "123.456",
    "target_volume": "1.23456",
    "trade_timestamp": "1700000000",
    "type": "buy"
  }
]
```
