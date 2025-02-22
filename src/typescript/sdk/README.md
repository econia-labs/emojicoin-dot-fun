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

## Common errors

### Error: Missing environment variables \$\{key}

You need to load the environment variables before running. See
[loading-environment-variables](#loading-environment-variables).

### Error: This module cannot be imported from a Client Component module

```shell
Error: This module cannot be imported from a Client Component module. It should
only be used from a Server Component.
```

This is because you're inadvertently importing indexer queries or functions that
import server-side environment variables. You can fix this one of two ways:

#### 1. Narrow your import to avoid importing types and functions you don't need

Most indexer types and helper functions are available at
`@econia-labs/emojicoin-sdk`. You shouldn't need to import
`@econia-labs/emojicoin-sdk/indexer-v2` to use them.

Please [file an issue] if you need access to an import and it's impossible
or difficult to use.

#### 2. Satisfy the `react-server` condition

If you are just using the SDK to run scripts or know what you're doing, you can
silence the warning like so:

```shell
file="example.testnet.env"
pnpm dotenv -v NODE_OPTIONS="--react-server" -e "$file" -- ./my-local-script.ts
```

The error arises because you've imported code that has a "server-only" import
guard at the top of the file. Essentially, this file acts as protection against
accidentally leaking server-side secrets like API keys client-side in browser
based applications where the application code is sent to the client.

It will always throw an error _unless_ the `NODE_OPTIONS` environment
variable has specified the condition: `--react-server`.

If you are getting this error in your frontend application, _you should
heed its warning_ and understand the implications of not doing so!

[an import error]: #error-this-module-cannot-be-imported-from-a-client-component-module
[contract apis]: src/emojicoin_dot_fun/contract-apis/
[default config]: https://github.com/econia-labs/emojicoin-dot-fun/blob/974e29fa607fa7d4bf391be3f8ed42e74d36cf87/src/typescript/sdk/src/client/emojicoin-client.ts#L153
[emojicoinclient]: src/client/emojicoin-client.ts
[file an issue]: https://github.com/econia-labs/emojicoin-dot-fun/issues
[local network]: ../example.local.env
[mainnet network]: ../example.mainnet.env
[testnet network]: ../example.testnet.env
