# Emojicoin Frontend

## Getting Started

```bash
# Install the dependencies.
pnpm i
```

```bash
# Run the development environment application.
pnpm run dev
```

```bash
# Build the production environment application.
pnpm run build

# Start the production application on port 3001:
pnpm run start --port 3001
```

We use `--port 3001` as an example here to avoid conflicts with our `postgrest`
API that occupies `port 3000`. You can choose any port you want as long as it
doesn't conflict with ports already in use.

This project uses [`next/font`].

## Understanding the data flow architecture

The data flow for this application is fairly involved, since the application
receives data from multiple sources:

1. Client-side fetches
1. Server-side fetches in the form of React server actions and server components
1. Live updates/events from a MQTT client using a secure WebSockets connection

The `Chart` component utilizes all of these data sources and interacts with the
TradingView [datafeed API], so we've written a high level overview of the data
architecture in [charts/README.md] to elucidate how we receive and ultimately
display data on the chart.

It captures a lot of the data flow architecture and is a good starting point for
understanding how we process, store, and display data in the application.

[charts/readme.md]: ./src/components/charts/README.md
[datafeed api]: https://www.tradingview.com/charting-library-docs/latest/connecting_data/Datafeed-API/
[`next/font`]: (https://nextjs.org/docs/basic-features/font-optimization)
