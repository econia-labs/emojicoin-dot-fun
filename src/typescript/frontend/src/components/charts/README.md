<!---cspell:words OHLCV -->

# Overview

The `Chart` component for this project receives data from multiple data
sources. In order to elucidate this flow of data, we briefly review the
various data sources for the `Chart` component and how to properly use them
to update the `Chart` component in real time.

## Market Symbol Resolution

The `marketMetadataMap` data is static data passed from a server component to
the chart component before it's rendered. This data contains all currently
registered market's symbol bytes, emoji symbols, and market addresses. These are
the uniquely identifiable values for each market registered when the server
component initially fetches data.

We can supplement this data with an asynchronous fetch in the form of a React
server action to search for and/or resolve market symbols that are created
after the initial render of the chart component, since `searchSymbols` and
`resolveSymbol` are both asynchronous functions inside the [datafeed].

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
all used interchangeably. The `periodBoundary` sometimes used in this repository
most often refers to the start time of the `period`, although it can mean either
side of a period boundary, i.e., the start _or_ the end time for a candlestick
period.

## Datafeed API

The [datafeed API] provides two ways of populating data on the chart.

1. Historical data
1. Streamed/live data, aka from WebSockets or some other similar protocol

We fetch historical candlestick data in the form of periodic state events
with the `getBars` function of the datafeed API. We mostly just provide
an asynchronous function to `getBars` to call to exhaustively get all
candlestick data within a certain range of time.

See the [fetchAllCandlesticksInTimeRange] function and [getBars] documentation
for more implementation details.

### Updating and creating new bar data

Since the contract data does not emit events for updates to the current
candlestick, we must construct this data ourselves through a combination of
logic and on-chain data fetched from the `emojicoin_dot_fun.move` contract's
view functions.

The general process of how we update bar data is:

1. When [a new periodic state event] comes in, we create a new latest bar for
   the chart and update it with all existing in-state swap data that was emitted
   during the new bar's period / time range.
1. When [a new swap event] comes in, we update the existing latest bar.

To visually update the latest bar data, we must use the datafeed API's provided
callback function. We store this callback function in our [EventStore state] and
call it whenever a client is viewing the page for an emoji, with a specific
candlestick resolution based on the chart component's UI.

See the documentation for the [subscribeBars] function for more details.

Since this function will error if it is used to update historical data, we must
ensure that the data passed to it is valid and up to date lest we encounter a
`time violation` error from the datafeed API.

To properly reconcile our existing state data and any new incoming data, we can
utilize the `emojicoin_dot_fun::market_view` view function to calculate the
latest bar. This function returns a market's current state, including all of the
latest periodic states (i.e., each period's candlestick data) in the form of a
`vector<PeriodicStateTracker>`.

Keep in mind that this data is fetched directly from an Aptos fullnode since
it's a view function.

If the user refreshes the page, we will fetch the data again and repeat the
process. Note that since [EventStore state] persists across client
refreshes, even when server components fetch new data, we must implement logic
to ignore and deduplicate events that have already been accounted for.

This process is greatly simplified by simply using the `market_view` endpoint to
calculate the "starting point" for a candlestick instead of creating one
from existing, client-side swap data in the [EventStore state].

We call this function every time the `ClientEmojicoinPage.tsx` server component
is fetched/server-rendered, thus ensuring we have an accurate and consistent
starting point for the candlestick data.

### Updating the current latest bar

After receiving the data from the `market_view` view function as component prop
data from the parent server component, we initialize all period's latest bars
and store them in state.

Then, every time we receive new swap data on the client, we validate that
it can be used to update the latest bar and then process it accordingly.

Here's what we check for before using new swap data to update the current
latest bar:

- Is the swap event in the correct time frame? We handle this by checking if
  it was emitted between the period beginning and end for the current bar.
- Has it already been accounted for? Since we store a unique `guid` for each
  event (calculated from unique event type characteristics and values like
  market/event nonces) added to the `EventStore`, and we know that the
  Javascript runtime is single threaded, we will never add duplicate data as
  long as all of our data flows through/is processed by the `EventStore` before
  we use it.

### Creating a new latest bar

The above section handles updating data for the **current candlestick**, but in
order to handle creating a new one in a robust manner, we can simplify the logic
by only creating a new bar when we receive a new `PeriodicStateEvent`.

When we receive a new `PeriodicStateEvent`, it means the candlestick for that
period has closed/ended, and we should create a new one. Note that periodic
state events and swap events are emitted in the same transaction but arrive
separately in the WebSocket stream, meaning we must somehow reconcile disjoint
swap event data that has the same `marketNonce` value as the periodic state
event. That is, despite the fact that swap event data and periodic state event
data are emitted together in the actual contract, we receive them separately
through the WebSocket stream.

Thus we must ensure that a swap event emitted upon the beginning of a new period
is always used to update a newly created bar, regardless of the order that it
comes in relative to the periodic state event that triggers the creation of a
new Chart `latestBar`.

To do this we simply iterate over all of our `EventStore` swap data, filtering
out data that wasn't emitted between the candlestick's time frame/range (i.e.
from the period start to the period end), and then update the latest bar with
the remaining sequentially ordered data. We do this all within the same function
call where we add the `PeriodicStateEvent` to our `EventStore` state, ensuring
that the newly created candlestick has the most up to date data.

Thus:

1. If a swap event that triggers a new candlestick was stored **before** its
   corresponding `PeriodicStateEvent`, it will be reflected in the same event
   state update where we store the periodic state event.
1. If a swap event comes in **after** the periodic state event is stored, it
   will then update the latest bar in the same manner as any other time we add
   [a new swap event].

Thus, regardless of which event data reaches the `EventStore` first, we will
always account for the swap data emitted upon the creation of a new latest bar.

[a new periodic state event]: ./README.md#updating-the-current-latest-bar
[a new swap event]: ./README.md#creating-a-new-latest-bar
[datafeed]: ./README.md#datafeed-api
[datafeed api]: https://www.tradingview.com/charting-library-docs/latest/connecting_data/Datafeed-API/
[eventstore state]: ../../lib/store/event-store.ts
[fetchallcandlesticksintimerange]: ../../lib/queries/charting/candlesticks-in-time-range.ts
[getbars]: https://www.tradingview.com/charting-library-docs/latest/connecting_data/Datafeed-API/#getbars
[ohlcv candlestick]: https://en.wikipedia.org/wiki/Candlestick_chart
[subscribebars]: https://www.tradingview.com/charting-library-docs/latest/api/interfaces/Charting_Library.IDatafeedChartApi#subscribebars
