<!-- markdownlint-disable-file MD024 -->

<!-- cspell:word netcat -->

# Using the WebSockets broker server

To subscribe to markets and/or event types, you send a JSON payload to our
WebSockets server with a WebSockets connection.

To easily send a JSON payload to our server to test the broker functionality,
you can use `websocat`, the equivalent of `netcat` or `curl` but for a `ws`
connection.

If you use homebrew, you can install `websocat` with `brew install websocat`.

Otherwise, see <https://crates.io/crates/websocat> for installation of the Rust
crate.

## Connecting to our WebSockets server

Connect to the server with `websocat`:

```shell
# Where `3009` here is the `BROKER_PORT` in `compose.yaml`.
websocat -t 'ws://127.0.0.1:3009'
```

This will bring you into a shell where everything you send is sent directly
to the websockets server.

## Subscription command examples

You can send the example messages below to subscribe to different markets
and event types.

Note that they're typed *exactly* as shown below. If you try to send the JSON
payload over multiple lines through `websocat`, it will error out and parse
the JSON payload incorrectly.

### Basic subscriptions

The fields `markets`, `event_types`, and `arena` all work by overwriting the
current subscription state each time a message is received by the broker from
the client.

There is currently no granular control over arena event types, the only
way to subscribe to them is by simply passing `{ "arena": true }`. The default
value is `false`; i.e., no subscription to arena events.

Note that if you do not pass a value, it uses the default value, which for
`markets` is all markets, for `event_types` is all event types, and for `arena`
is false.

```json5
// Subscribe to every single event type for all markets, including arena events.
{ "markets": [], "event_types": [], "arena": true }

// Effectively the same message as above:
{ "arena": true }

// Subscribe to all non-arena event types for all markets.
// The following are all equivalent, note this *does not* include arena events:
{ }
{ "markets": [] }
{ "event_types": [] }
{ "markets": [], "event_types": [] }
```

Keep in mind, for `markets`, `event_types`, and `arena`, each message overwrites
the last value, even if you did not pass it explicitly:

```json5
// Subscribe to all event types for all markets and arena events.
{ "arena": true }

// Subscribe to all event types for markets 1 and 2 and effectively unsubscribe
// from arena events.
{ "markets": [1, 2] }
```

### Arena candlesticks

Arena candlesticks don't follow the same rules as the other subscriptions. To
subscribe to arena candlesticks, you must pass the specific arena period
as well as the intent behind it.

You can `subscribe` or `unsubscribe` to a `period` by including the following
data in a subscription message to the broker:

```json5
// Subscribes to 1h candlesticks.
{
  // "markets": [],      // implicit default value, even if you don't pass it.
  // "event_types": [],  // implicit default value, even if you don't pass it.
  // "arena": false,     // implicit default value, even if you don't pass it.
  "arena_period": {
    "action": "subscribe",
    "period": "OneHour",
  }
}

// Adds 15s candlesticks to the current subscription of periods.
{
  // "markets": [],      // implicit default value, even if you don't pass it.
  // "event_types": [],  // implicit default value, even if you don't pass it.
  // "arena": false,     // implicit default value, even if you don't pass it.
  "arena_period": {
    "action": "subscribe",
    "period": "FifteenSeconds",
  }
}

// Remove 1h candlesticks from current arena period subscriptions.
{
  // "markets": [],      // implicit default value, even if you don't pass it.
  // "event_types": [],  // implicit default value, even if you don't pass it.
  // "arena": false,     // implicit default value, even if you don't pass it.
  "arena_period": {
    "action": "unsubscribe",
    "period": "OneHour",
  }
}

// This would leave you with the following subscriptions:
{
    "markets": [], // all markets
    "event_types": [], // all event types
    "arena": false, // no arena events
    "arena_candlestick_periods": ["FifteenSeconds"] // only 15s candlesticks
}
```

### Specific markets, all event types

To subscribe to markets 4 and 5 for all non-arena event types:

```json
{ "markets": [4, 5] }
```

### Specific markets, specific event types

To subscribe to a specific event type, you can provide a JSON array with any of
the `EmojicoinDbEventType` enum field names.

For example, to subscribe to multiple event types on all markets:

```json
{ "markets": [], "event_types": ["Swap", "Chat", "MarketRegistration"] }
```

### Specific markets, specific event types

To subscribe to `Swap` and `Chat` event types for the market with ID 1:

```json
{ "markets": [1], "event_types": ["Swap", "Chat"] }
```

To subscribe to `Swap` and `Chat` event types for the markets with ID 1 and 2:

```json
{ "markets": [1, 2], "event_types": ["Swap", "Chat"] }
```
