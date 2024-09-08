<!---cspell:word OHLCV -->

# Overview

The `Chart` component for this project receives data from multiple data
sources. In order to elucidate this flow of data, we briefly review the
various data sources for the `Chart` component and how to properly use them
to update the `Chart` component in real time.

## Market Symbol Resolution

The `registeredMarketMap` data is data managed by the event store. Since changes
to the zustand state don't cause re-renders if we retrieve it through a getter,
we `get()` the registered market map and search all registered market symbol
data with it. This data contains all currently registered market's symbol bytes,
emoji symbols, and market addresses. These are the uniquely identifiable values
for each market registered.

We update this state data with WebSocket updates and any time the current user
registers a market. It's also fetched from the server component initially- thus
we have a full and up to date picture of the currently registered markets.

This data facilitates searching for market data in the search bar in the Chart
component.

## Interchangeable Terms

Note that throughout this repository, we refer to periodic state events and
terms related to them in multiple ways. Colloquially, most people are familiar
with certain terms like `candlesticks` and `time frames`, but there are a few
other ways to refer to these concepts.

To disambiguate the terms we use here, keep in mind the following:

`emojicoin_dot_fun.move` contract events of the type `PeriodicStateEvent`
represent a single [OHLCV candlestick], also referred to as a `bar` or
as our `periodic state event` type. Each `candlestick` exists for a specific
`period` or `resolution`. This is the `time frame` or `time range` used for the
candlestick bar.

To be clear: `candlestick`, `bar`, `candlestick bar`, `PeriodicStateEvent`,
`periodic state event`, and `latestBar` all refer to the same concept of an
OHLCV candlestick.

Each candlestick has a corresponding `period`, `resolution`, or `time frame`,
all used interchangeably. The `period boundary` sometimes used in this codebase
most often refers to the `start time` of the `period`, although it can mean
either side of a period boundary, i.e., the start _or_ the end time for a
candlestick period.

The `PeriodDuration` enum indicates the actual time of the period in
microseconds, as specified in the Move smart contract.

## Datafeed API

The [datafeed API] provides two ways of populating data on the chart.

1. Historical data
1. Streamed/live data, i.e., data from a WebSockets connection or some other
   similar protocol. In our case we use an MQTT client with a secure WebSockets
   connection, aka the `wss` protocol. The data is updated visually on the chart
   with the [subscribeBars] callback function upon arrival of new bar data.

For historical candlestick data, we fetch bar data in the form of periodic state
events within the `getBars` function of the datafeed API. We mostly just provide
an asynchronous function to `getBars` to call to exhaustively get all
candlestick data within a certain range of time.

See the [fetchAllCandlesticksInTimeRange] function and [getBars] documentation
for more implementation details.

For streamed/live data, the process is more complex, detailed in the following
sections.

## Updating and creating new bar data

Since the contract data does not emit events for updates to the current
candlestick, we must construct this data ourselves through a combination of
logic and on-chain data fetched from the `emojicoin_dot_fun.move` contract's
view functions.

The general process of how we create and update bar data is detailed below.

### On initial load/fetch

The `Chart` component initially calls `getBars` several times to populate
the initial data. We fetch this data from our server by calling a candlestick
fetch function that exhaustively retrieves all candlesticks within the specified
time range. This is a necessary requirement from the TradingView datafeed API.

We also check if the `getBars` call is fetching the most recent candlestick
data by checking if the `end` time argument is in the future- indicating that
this is for the most recent batch of bar data. If it is, we call the
`market_view` function to get the most recent candlestick data and push it onto
the resulting `bars` array returned from our server's `fetchCandlesticks`
response.

Note that because we add the most recent bar directly to the `bars` array within
`getBars`, the initial data fetch will always show the current candlestick
without having to use the callback function to update the latest bar.

We also currently update all candlestick data to use the previous bar's closing
price as its open price. This is additional logic that supersedes the `open`
values emitted from the contract. This is so we can display contiguous bar
data in the chart, which is typical for most 24/7 markets.

### On the arrival of a swap or periodic state event from the MQTT/wss client

1. When a new periodic state event comes in through the client's MQTT/WebSocket
   connection, we create a new latest bar for the chart and update it with all
   existing in-state swap data that was emitted during the new bar's period /
   time range.
1. When a new swap event comes in and it's part of the current period, we
   update the existing latest bar.
1. When a new swap event comes in and it should be part of a new candlestick
   bar, we create a new bar based off of the swap data.

Once we've deserialized the stream buffer data into proper contract events, we
store them in state and visually update the latest bar data with the
[subscribeBars] callback function provided by the datafeed API.

This function is created by the datafeed API specifically for each combination
of a market and a candlestick time frame. We store this function in our
[EventStore state] in the `EventStore` market ID map, which also has a
corresponding `period` field containing an object that holds the callback
function.

For example, if our `EventStore` encounters a swap event for the market with a
market ID of `3`, we iterate over all resolutions (aka period duration types
and check if we should update the latest bar and/or invoke the datafeed API
callback function.

Something like this:

```typescript
// We retrieve our data with the `zustand/immer` `set` function, since we are
// possibly mutating the data in the form of updating the `latestBar` state.
set((state) => {
  // Logic to check if we've already processed the event
  // ...

  // For all periods/resolutions, i.e., 1m, 5m, 15m, 30m, 1h, 4h, 1d.
  for (const period of PERIOD_DURATIONS) {
    const marketID = event.marketID.toString();
    const market = state.markets.get(marketID);
    const periodData = market[period];
    if (periodData) {
      // Process the data, possibly update or create a new latest bar...
      // ...

      // In essence, we eventually do this:
      if (periodData.latestBar && periodData.callback) {
        // Thus, our callback is only invoked if we are currently subscribed
        // to that specific market ID + period combination.
        periodData.callback(periodData.latestBar);
      }
    }
  }
});
```

If the event's corresponding market + resolution combination possesses a valid
callback function in state, we call it, and thus the `Chart` component visually
updates the latest bar for that specific market + resolution.

The callback function is replaced with `undefined` whenever `unsubscribeBars` is
called by the datafeed API.

Since this function will error if it is used to update historical data, we must
ensure that the data passed to it is valid and up to date lest we encounter a
`time violation` error from the datafeed API. Here's what we check for before
using new data to update the current latest bar:

- Is the swap/periodic state event event in the correct time frame? We check if
  it was emitted between the period beginning and end for the current bar.
- If not, we create a new bar, specific to whether or not it's a swap or
  periodic state event.
- We then avoid duplication of events in state (and thus double-recording values
  like bar volume) by creating a unique `guid` for each event. These `guids` are
  created by concatenating event unique field values like market nonces and
  the event type together. When we add an event to the `EventStore`, we check
  its derived `guid` and see if we've already stored it in state before updating
  any state values. Since the JavaScript runtime is single threaded, we will
  never add duplicate data as long as all of our data flows through the
  `EventStore` before we use it.

Note that despite being emitted in a single transaction on-chain, swap events
and periodic state events are received separately on the client, meaning we
have to reconcile receiving them out of order. This is also handled in our
`EventStore` logic, specifically by using existing in-state swap data - filtered
for the current bar period - to update a new bar when a `PeriodicStateEvent`
triggers a new bar creation.

When a swap data triggers a new bar creation, we simply use the swap's data
as the new bar data.

To reiterate:

1. If a swap event that triggers a new candlestick was stored **before** its
   corresponding `PeriodicStateEvent`, it will be reflected in the same event
   state update where we store the periodic state event.
1. If a swap event comes in **after** the periodic state event is stored, it
   will then update the latest bar in the same manner as any other time we add
   a new swap event.

Thus, regardless of which event data reaches the `EventStore` first, we will
always account for the swap data emitted upon the creation of a new latest bar.

### When the user submits a transaction and we store the response in state

To briefly explain, when the user submits a transaction, we parse the events
in the response and push it to our `EventStore` state with the same function
logic that we do for events that come in through `WebSockets`, but the data is
received by parsing the fullnode's `UserTransactionResponse` events rather than
through the indexer => MQTT/wss client => application data flow.

The below is an explanation of how this data is reconciled with other
application data and the motivation behind why we store state this way.

#### Intercepting events with `AptosContextProvider`

Our `AptosContextProvider` handles the transaction submission flow for all
on-chain function calls in our application. We utilize this to intercept the
post-transaction submission flow for user transactions (transactions that update
state on-chain) and parse any events returned from a valid, awaited
`UserTransactionResponse`.

When it comes across a relevant contract event, like a `SwapEvent` or a
`PeriodicStateEvent`, it stores it in state. It is pushed into state with the
same function that events received through the `WebSocket` connection are, using
the same deduplication and chart subscription/visual update logic.

Although we'd eventually receive the event data from a MQTT/WebSocket message or
a server fetch, storing events in state like this is most often the fastest way
to store new on-chain state events in state and thus let the user see it
visually, since it circumvents our custom indexer processor and the mqtt/wss
connection.

Since our `EventStore` uses unique ids (the `guids` field in our `EventStore`)
to avoid duplicating events in state, we know that we won't inadvertently count
incoming swap data twice in the latest bar. This means our volume data is
accurate despite using data from three separate sources.

[datafeed api]: https://www.tradingview.com/charting-library-docs/latest/connecting_data/Datafeed-API/
[eventstore state]: ../../lib/store/event-store.ts
[fetchallcandlesticksintimerange]: ../../lib/queries/charting/candlesticks-in-time-range.ts
[getbars]: https://www.tradingview.com/charting-library-docs/latest/connecting_data/Datafeed-API/#getbars
[ohlcv candlestick]: https://en.wikipedia.org/wiki/Candlestick_chart
[subscribebars]: https://www.tradingview.com/charting-library-docs/latest/api/interfaces/Charting_Library.IDatafeedChartApi#subscribebars
