# Scripts

This workspace package is primarily intended to use and test the
@econia-labs/emojicoin-sdk, both for testing and developer experience purposes.

**The scripts here are not tested and are only intended to be used in test
environments.**

## Loading environment variables and running a script

### Running a script for the local network

Run the local stack:

```shell
# To wipe all local indexer and local network data:
pnpm run -w docker:restart

# To boot up the local stack with existing processor/local network data:
pnpm run -w docker:up
```

```shell
# Initialize the local network for the first time, with a new arena:
pnpm run arena:init

# Make a lot of random trades with pre-funded accounts:
pnpm run arena:bots
```

### Running a script for non-local networks

To run another script, just load a different environment. You can use the
existing `package.json` commands or pass a custom env file:

```shell
# Use the example testnet environment variables:
pnpm load-env-testnet -- tsx src/your-testnet-script.ts

# Use your own custom .env file:
pnpm load-env -- tsx src/your-script.ts
```
