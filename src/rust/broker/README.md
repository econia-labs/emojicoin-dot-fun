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

### Arena events

Arena events don't follow the same rules as the other subscriptions.

To subscribe to arena events, simply pass `{ "arena": true }`. The default value
is `false`; i.e., no subscription to arena events.

```json5
// Subscribe to every single event type.
{ "arena": true, "markets": [], "event_types": [] }

// Subscribe to all non-arena event types.
// Both of the JSON objects below are equivalent.
{ "markets": [], "event_types": [] }
{ "arena": false, "markets": [], "event_types": [] }
```

### All markets, all non-arena event types

```json5
// All of the below are equivalent.
// Remember, with `websocat`, your message should be exactly one line.
// This is four different ways to subscribe to all markets and non-arena events.
{}
{ "markets": [] }
{ "event_types": [] }
{ "markets": [], "event_types": [] }
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
