# @econia-labs/emojicoin-sdk

## Overview

The emojicoin SDK was originally used to supplement the next.js frontend
with server-side queries that use private API keys. As such, there are a few
configuration options and quirks to be mindful of when using the SDK.

### Loading environment variables

Most of the explanations for the environment variables used are in their
respective files.

**In general, if you are using the SDK but not the emojicoin indexer, you can
simply load any of the three network environment variable configs without any
extra setup. See below.**

```shell
# Install dotenv or some form of an environment variable loader.
pnpm -D add dotenv-cli

pnpm dotenv -e ./example.mainnet.env -- pnpm tsx ./my-script.ts
pnpm dotenv -e ./example.testnet.env -- pnpm tsx ./my-script.ts
pnpm dotenv -e ./example.local.env -- pnpm tsx ./my-script.ts
```

You can view the files here:

- [local network]
- [testnet network]
- [mainnet network]

NOTE: The environment variables must be defined prior to runtime, so you
**cannot** use `dotenv.config({ path: "..." })` at runtime to load them.

## Using the auto-generated Move module APIs

The `emojicoin_dot_fun` move functions have corresponding auto-generated
transaction builder classes that you can use to interact with the module.

They are not particularly ergonomic- they are mostly just wrappers for module
entry and view functions; however, you can hover over each class for
documentation based on the corresponding `*.move` function args
and generic types.

For a more ergonomic way to interact with the module please see the
[emojicoin client helper class](#the-emojicoinclient-helper-class).

See the [move module APIs] for all of the possible move module functions.

Here are the basic interactions with the `emojicoin_dot_fun.move` module:

### Setup an account on testnet

```typescript
// Make sure to load proper testnet environment variables. For example:
// `pnpm dotenv -e ./example.testnet.env -- pnpm tsx ./my-script.ts`

import { getAptosClient, ONE_APT } from "@econia-labs/emojicoin-sdk";
import { Ed25519Account } from "@aptos-labs/ts-sdk";

const account = Ed25519Account.generate();
const aptos = getAptosClient();
const accountAddress = account.accountAddress.toString();

await aptos.fundAccount({ accountAddress, amount: ONE_APT });
```

### Register an emojicoin market

```typescript
// Using variables from above...
import {
  RegisterMarket,
  getEvents,
  SymbolEmoji,
  toMarketEmojiData,
  INTEGRATOR_ADDRESS,
} from "@econia-labs/emojicoin-sdk";

const emojis: SymbolEmoji[] = ["🍟", "💤"];
const symbol = emojis.join("");
const bytes = toMarketEmojiData(symbol).emojis.map((b) => b.bytes);

const register = await RegisterMarket.submit({
  aptosConfig: aptos.config,
  registrant: account,
  emojis: bytes,
  integrator: INTEGRATOR_ADDRESS
});

const registerEvents = getEvents(register);
console.log(registerEvents.marketRegistrationEvents[0]);
```

### Swap APT for an Emojicoin

<!-- markdownlint-disable MD013 -->

```typescript
// Using variables from above...
import { getMarketAddress, toEmojicoinTypesForEntry } from "@econia-labs/emojicoin-sdk";

const marketAddress = getMarketAddress(emojis);
const typeTags = toEmojicoinTypesForEntry(marketAddress);

await SwapWithRewards.submit({
  aptosConfig: aptos.config,
  swapper: account,
  marketAddress,
  inputAmount: 100n, // 100 octas of APT.
  isSell: false, // Buy.
  minOutputAmount: 1n,
  typeTags,
});
```

### Send a chat message for an emojicoin market

```typescript
// Using variables from above...

// If you set `message` to the type `AnyEmoji[]`, you should get all valid
// symbol and chat emojis as auto-completion suggestions inside quotes.
const myFavoriteEmojis: AnyEmoji[] = ["🆕", "🐥", "💿"];
const [a, b, c] = myFavoriteEmojis;
const message = [a, a, b, a, b, c, c, b].join("");

// message === "🆕🆕🐥🆕🐥💿💿🐥"

const { emojiBytes, emojiIndicesSequence } = toChatMessageEntryFunctionArgs(message);

await Chat.submit({
  aptosConfig: aptos.config,
  user: account,
  marketAddress,
  emojiBytes,
  emojiIndicesSequence,
  typeTags,
});
```

<!-- markdownlint-enable MD013 -->

## The EmojicoinClient helper class

The EmojicoinClient class is a helper class primarily for local and test
development. It facilitates terse, imperative code to interact with the
module's multiple entry and view functions.

### Not intended for web applications

The EmojicoinClient was primarily made as a utility class for local development.
The default configuration options are not as explicit as the auto-generated
Move module classes above.

Please be mindful of the default configuration options in the client.
See the [EmojicoinClient] and the default values passed to the constructor
for more details.

### Using the EmojicoinClient

You must import the `EmojicoinClient` from the SDK explicitly:

```typescript
import { EmojicoinClient } from "@econia-labs/emojicoin-sdk/client";
```

Note that the client uses indexer code, so you may run into [an import error]
when using it.

To run the equivalent of the sample code above:

```typescript
// Load environment variables for testnet:
// `pnpm dotenv -e ./example.testnet.env -- pnpm tsx ./my-script.ts`

import { AnyEmoji } from "@econia-labs/emojicoin-sdk";
import { EmojicoinClient } from "@econia-labs/emojicoin-sdk/client";

const emojicoin = new EmojicoinClient();
const account = Ed25519Account.generate();
const accountAddress = account.accountAddress.toString();
await aptos.fundAccount({ accountAddress, amount: ONE_APT });

const emojis: SymbolEmoji[] = ["🍟", "💤"];
await emojicoin.register(account, emojis);
const amountBought = await emojicoin.rewards
  .buy(account, emojis, 100n)
  .then((res) => res.swap.event.netProceeds);
await emojicoin.rewards.sell(account, emojis, amountBought);

// Using an array will let you use auto-complete suggestions for emojis.
const arr: AnyEmoji[] = ["🆕", "🆕", "🐥", "🆕", "🐥", "💿", "💿", "🐥"];
// You can also simply use a string: "🆕🆕🐥🆕🐥💿💿🐥🆕"
await emojicoin.chat(account, emojis, arr);

// As a bonus, check if the market exists:
const exists = await emojicoin.view.marketExists(emojis);
if (exists) {
  console.log(`Yes, ${emojis.join("")} exists!`);
}
```

## Using the WebSocketClient

You can use the custom WebSocketClient class as a light wrapper around
a simple WebSocket connection to the `broker` service. It automatically
parses events emitted from the `broker` into emojicoin event models.

Here's a simple example of an automatically reconnecting connection:

```typescript
import { sleep } from "@aptos-labs/ts-sdk";
import {
  WebSocketClient,
  isSwapEventModel,
  isEventModelWithMarket,
  toNominalPrice,
  calculateCurvePrice,
} from "@econia-labs/emojicoin-sdk";

export const connect = () => {
  // The WebSockets endpoint for the `broker` service. See `src/rust/broker`
  // and `src/docker` for more info on running the broker locally.
  const url = "ws://localhost:3009";

  const client = new WebSocketClient({
    url,
    listeners: {
      // Callback upon receiving any WebSocket message. `event` is automatically
      // deserialized into an emojicoin event model.
      onMessage(event) {
        if (isSwapEventModel(event)) {
          const { swap, state } = event;
          console.log({
            ...event.swap,
            avgPrice: toNominalPrice(swap.avgExecutionPriceQ64).toFixed(9),
            curvePrice: calculateCurvePrice(state).toFixed(9),
          });
        }
        if (isEventModelWithMarket(event)) {
          console.log(event.market.symbolEmojis, event.eventName);
        }
      },
      onConnect(_e) {
        client.subscribeEvents(
          // Subscribe to the following basic emojicoin_dot_fun events.
          ["Swap", "Chat", "MarketLatestState"],
          {
            // Subscribe to all base arena events (Melee, Swap, Enter, Exit).
            baseEvents: true,
            // Subscribe to 1H candlestick updates for the current arena melee.
            arenaPeriodRequest: {
              action: "subscribe",
              period: "OneHour",
            }
          }
        );
      },
      onError(e) {
        console.error(e);
      },
      onClose(_e) {
        setTimeout(() => {
          console.info("Attempting to reconnect...");
          connect();
        }, 1000);
      },
    },
    permanentlySubscribeToMarketRegistrations: true,
  });
};

export const main = async () => {
  connect();
  while (true) {
    await sleep(10000);
  }
};

main();
```

Example output of a swap:

<!-- markdownlint-disable MD013 -->

```typescript
{
  swapper: '0x5c6e0b64f018af5b4bdcd043cf87e69004691ee3c160c266bf0966688a83f3c0',
  integrator: '0x99994f5124fa5cc95538217780cbfc01e4c4f842dfcc453890755b2ce4779999',
  integratorFee: 4773161n,
  inputAmount: 640733754055n,
  isSell: true,
  integratorFeeRateBPs: 100,
  netProceeds: 471349707n,
  baseVolume: 640733754055n,
  quoteVolume: 471349707n,
  avgExecutionPriceQ64: 13570172258320925n,
  poolFee: 1193290n,
  startsInBondingCurve: false,
  resultsInStateTransition: false,
  balanceAsFractionOfCirculatingSupplyBeforeQ64: 2879374649688647n,
  balanceAsFractionOfCirculatingSupplyAfterQ64: 0n,
  avgPrice: '0.000735641',
  curvePrice: '0.000743749'
}
[ '🐝' ] Swap
[ '🐝' ] State
```

## Common errors

### Error: Missing environment variables \$\{key}

You need to load the environment variables before running. See
[loading-environment-variables](#loading-environment-variables).

### Error: This module cannot be imported from a Client Component module

```shell
Error: This module cannot be imported from a Client Component module. It should
only be used from a Server Component.
```

This error occurs because you've imported code that has a "server-only" import
guard at the top of the file. See the next.js docs on
[keeping server-only code out of the client environment] for more information.

It will always throw an error _unless_ the `NODE_OPTIONS` environment
variable has specified the condition: `--react-server`.

There are two ways to fix this:

#### 1. Satisfy the `react-server` condition

If you know what you're doing, you can silence the warning like so:

```shell
pnpm dotenv -v NODE_OPTIONS="--react-server" -e "example.testnet.env" -- ./my-local-script.ts
```

#### 2. Narrow your import to avoid importing types and functions you don't need

Most indexer types and helper functions are available at
`@econia-labs/emojicoin-sdk`. You shouldn't need to import
`@econia-labs/emojicoin-sdk/indexer-v2` to use them.

Please [file an issue] if you need access to an import that's not available!

<!-- markdownlint-enable MD013 -->

[an import error]: #error-this-module-cannot-be-imported-from-a-client-component-module
[emojicoinclient]: src/client/emojicoin-client.ts
[file an issue]: https://github.com/econia-labs/emojicoin-dot-fun/issues
[keeping server-only code out of the client environment]: https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns#keeping-server-only-code-out-of-the-client-environment
[local network]: ../example.local.env
[mainnet network]: ../example.mainnet.env
[move module apis]: src/emojicoin_dot_fun/move-modules/
[testnet network]: ../example.testnet.env
