# Scripts

This workspace package is primarily intended to use and test the
@econia-labs/emojicoin-sdk, both for testing and developer experience purposes.

**The scripts here are not tested and are only intended to be used in test
environments.**

## Loading environment variables and running a script

### Running a script on the local network

To run a script on the local network, first make sure the indexer and chain
are up and running.

#### Start or restart the local Docker services

```shell
# 1. Wipe all local indexer and chain data and restart both
pnpm run -w docker:restart

# OR

# 2. Start all local services with existing indexer and chain data
pnpm run -w docker:up
```

#### Initialize the arena and make random trades

```shell
# Initialize the local network for the first time, with a new arena:
pnpm run arena:init

# Make a lot of random trades with pre-funded accounts:
pnpm run arena:bots
```

#### Register a random market

```shell
# Register a specific market with a symbol input
pnpm run utils:cli -- register 🍄🍄

 # Or generate a random symbol
pnpm run utils:cli -- register

 # Get help on all available commands
pnpm run utils:cli -- help

 # Get help on a specific command
pnpm run utils:cli -- help register
```

### Running a script for non-local networks

To run a script that doesn't necessarily need to run on a local network, just
load a different environment. You can use the existing `package.json` commands
or pass a custom env file:

```shell
# Use the example testnet environment variables:
pnpm load-env-testnet -- tsx src/your-testnet-script.ts

# Use your own custom .env file:
pnpm load-env -- tsx src/your-script.ts
```
