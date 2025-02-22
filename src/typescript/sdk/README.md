# @econia-labs/emojicoin-sdk

## Overview

The emojicoin SDK was originally used to supplement the next.js frontend
with server-side queries and API keys. As such, there are a few setup
configurations and quirks to be mindful of when using the SDK.

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

## Using the auto-generated Move contract APIs

The `emojicoin_dot_fun` move functions have corresponding auto-generated
transaction builder classes that you can use to interact with the contract.

They are not particularly ergonomic- they are mostly just wrappers for contract
entry and view functions; however, you can hover over each class for
documentation based on the corresponding `*.move` function args
and generic types.

For a more ergonomic way to interact with the contract please see the
[emojicoin client helper class](#the-emojicoinclient-helper-class).

See the [contract APIs] for all of the possible smart contract functions.

Here are the basic interactions with the `emojicoin_dot_fun.move` contract:

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
  integrator: INTEGRATOR_ADDRESS,
});

const registerEvents = getEvents(register);
console.log(registerEvents.marketRegistrationEvents[0]);
```

### Swap APT for an Emojicoin

<!-- markdownlint-disable MD013 -->

```typescript
// Using variables from above...
import { getMarketAddress, toCoinTypesForEntry } from "@econia-labs/emojicoin-sdk";

const marketAddress = getMarketAddress(emojis);
const typeTags = toCoinTypesForEntry(marketAddress);

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

### Not intended for web applications

The EmojicoinClient is primarily for local and test development. Please be
mindful of configuration options in the client that are set by default.

See [EmojicoinClient] and the [default config] for more details.

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

// Using an array will let you use auto-complete suggestions.
const arr: SymbolEmoji[] = ["🆕", "🆕", "🐥", "🆕", "🐥", "💿", "💿", "🐥"];
// You can also simply use a string: "🆕🆕🐥🆕🐥💿💿🐥🆕"
await emojicoin.chat(account, emojis, arr);

// As a bonus, check if the market exists:
const exists = await emojicoin.view.marketExists(emojis);
if (exists) {
  console.log(`Yes, ${emojis.join("")} exists!`);
}
```

## Using the WebSocketClient

The simplest way to test the WebSocketClient and endpoint is by running a local
network. You can do this by navigating to `src/typescript` and running:

```shell
# Please note this may overwrite any existing Aptos local network data.
pnpm run docker:up
```

Then you can interact with the contract locally and see events come in in real
time with the code below:

```typescript
import { sleep } from "@aptos-labs/ts-sdk";
import {
  WebSocketClient,
  isSwapEventModel,
  isEventModelWithMarket,
} from "@econia-labs/emojicoin-sdk";

export const main = async () => {
  const client = new WebSocketClient({
    // The WebSockets endpoint for the `broker` service. See `src/rust/broker`
    // and `src/docker`. If you are running the local development stack with
    // `pnpm run docker:up`, you can use the default value set in
    // `example.local.env`.
    url: "ws://localhost:3009",
    listeners: {
      // Callback upon receiving any WebSocket message. `event` is automatically
      // deserialized into an emojicoin event model.
      onMessage(event) {
        if (isSwapEventModel(event)) {
          console.log(event.swap);
        }
        if (isEventModelWithMarket(event)) {
          console.log(event.market.symbolEmojis, event.eventName);
        }
      },
      onConnect(_e) {
        const innerClient = client.client;
        console.log("Connected!");
        console.log("Client state:", innerClient.readyState);
        console.log("Open state:", innerClient.OPEN);
        client.subscribeEvents(["Swap", "Chat", "MarketLatestState"]);
      },,
      onError(e) {
        console.error(e);
      },
      onClose(e) {
        console.info("Closing!", e);
      },
    },
    permanentlySubscribeToMarketRegistrations: true,
  });

  while (true) {
    await sleep(10000);
  }
};

main().then(() => console.log("Done!"));
```

Example output of a swap:

<!-- markdownlint-disable MD013 -->

```typescript
{
  swapper: '0xf0592f4cfada893dedec5e1f7c164d925ba423b0ddf098ad91a1eb3d34d77430',
  integrator: '0x99994f5124fa5cc95538217780cbfc01e4c4f842dfcc453890755b2ce4779999',
  integratorFee: 50000n,
  inputAmount: 5000000n,
  isSell: false,
  integratorFeeRateBPs: 100,
  netProceeds: 35273041585n,
  baseVolume: 35273041585n,
  quoteVolume: 4950000n,
  avgExecutionPriceQ64: 2588701712746337n,
  poolFee: 88403612n,
  startsInBondingCurve: false,
  resultsInStateTransition: false,
  balanceAsFractionOfCirculatingSupplyBeforeQ64: 145424341860594414n,
  balanceAsFractionOfCirculatingSupplyAfterQ64: 145601208616530340n
}
[ '🐘' ] Swap
[ '🐘' ] State
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
[contract apis]: src/emojicoin_dot_fun/contract-apis/
[default config]: https://github.com/econia-labs/emojicoin-dot-fun/blob/974e29fa607fa7d4bf391be3f8ed42e74d36cf87/src/typescript/sdk/src/client/emojicoin-client.ts#L153
[emojicoinclient]: src/client/emojicoin-client.ts
[file an issue]: https://github.com/econia-labs/emojicoin-dot-fun/issues
[keeping server-only code out of the client environment]: https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns#keeping-server-only-code-out-of-the-client-environment
[local network]: ../example.local.env
[mainnet network]: ../example.mainnet.env
[testnet network]: ../example.testnet.env
