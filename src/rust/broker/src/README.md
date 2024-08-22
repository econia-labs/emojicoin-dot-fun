
# Using the WebSockets broker server
To test out the websocket server and broker functionality, you can use
`websocat`, the equivalent of `netcat` or `curl` but for a `ws` connection.

If you use homebrew, you can install `websocat` with `brew install websocat`.

Otherwise, see https://crates.io/crates/websocat for installation of the Rust
crate.

## Example of using our WebSockets server

```shell
# Where `3009` here is the `BROKER_PORT` in `compose.yaml`.
websocat -t 'ws://127.0.0.1:3009/ws'
```

This will bring you into a shell where everything you send is sent directly
to the websockets server.
To subscribe to all events and markets, you'd enter any of the following,
since they're all equivalent. Note that they're typed *exactly* as shown below:

`{"markets":[]}`

`{"event_types":[]}`

`{"markets":[],"event_types":[]}`

`{}`

To subscribe to markets 4 and 5 for all event types:

`{"markets":[4,5]}`

To subscribe to a specific event type, you can provide a JSON array with any of
the `EmojicoinDbEventType` enum field names.

For example, to subscribe to multiple event types on all markets:
{"markets":[],"event_types":["Swap", "Chat", "MarketRegistration"]}

To subscribe to one on all markets:
{"markets":[],"event_types":["Swap"]}

To subscribe to `Swap` and `Chat` event types for the market with ID 1:
{"markets":[1],"event_types":["Swap", "Chat"]}

To subscribe to `Swap` and `Chat` event types for the markets with ID 1 and 2:
{"markets":[1, 2],"event_types":["Swap", "Chat"]}
