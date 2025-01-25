<!-- cspell:word geoblocking -->

<!-- cspell:word PYMZ -->

<!-- cspell:word LGAJCWP -->

<!-- cspell:word ACYTYRCBY -->

# How to build and deploy this application

## Environment variable explanations

### Aptos Network & Contract Addresses

#### `NEXT_PUBLIC_APTOS_NETWORK`

The Aptos network. Options: `mainnet`, `testnet`, `devnet`, `local`, or `custom`

- **Example**: `"testnet"`

#### `NEXT_PUBLIC_MODULE_ADDRESS`

The contract address of the main `emojicoin-dot-fun` module.

<!-- markdownlint-disable MD013 -->

- **Example**: `"0x11113ddc70ea051ffd8a7cde7b96818326aabf56fdfd47807f7700e2b46e1111"`

#### `NEXT_PUBLIC_REWARDS_MODULE_ADDRESS`

The contract address of the rewards module with an overloaded swap function.

- **Example**: `"0x22227920701e36651a6649be2067cd7eebf3fabb94717ff3b256e3ada58b2222"`

#### `NEXT_PUBLIC_INTEGRATOR_ADDRESS`

The integrator address for the contract, aka the address that receives fees.

- **Example**: `"0x33332c9ea4c220e0572b7f83f397164f8171e1c9f681136bb8ab78efa6c43333"`

<!-- markdownlint-enable MD013 -->

______________________________________________________________________

### Emojicoin Indexer, Broker, and Allowlister

#### `EMOJICOIN_INDEXER_URL`

The indexer's PostgREST REST API endpoint.
**Note**: In production, it's recommended to use an API key for this URL. See
`EMOJICOIN_INDEXER_API_KEY`.

- **Example**: `"http://localhost:3000"`

#### `NEXT_PUBLIC_BROKER_URL`

The broker's WebSocket endpoint.
**Note**: In local development, the broker must use an insecure WebSocket
(`ws://`). In production, use `wss://`.

- **Example**: `"ws://localhost:3009"`

#### `ALLOWLISTER3K_URL`

The allowlister endpoint that returns whether or not an address is allowlisted.
This field can be empty if `NEXT_PUBLIC_IS_ALLOWLIST_ENABLED` is not `"true"`.

- **Example**: `"http://localhost:3000"`

______________________________________________________________________

### Unit/E2E Tests

#### `DB_URL`

Used for inserting directly into the database.

- **Example**: `"postgres://emojicoin:emojicoin@localhost/emojicoin"`

#### `PUBLISHER_PRIVATE_KEY`

Used for publishing the contract.

<!-- markdownlint-disable MD013 -->

- **Example**: `"eaa964d1353b075ac63b0c5a0c1e92aa93355be1402f6077581e37e2a846105e"`

<!-- markdownlint-enable MD013 -->

**Note**: These variables can be empty when not running unit tests.

______________________________________________________________________

### Miscellaneous Frontend Configurations

#### `NEXT_PUBLIC_INTEGRATOR_FEE_RATE_BPS`

The BPS fee rate for each swap or liquidity provision/removal.

- **Example**: `"100"`

#### `NEXT_PUBLIC_IS_ALLOWLIST_ENABLED`

Determines whether to gate access to the site with an allowlist.
If `true`, `ALLOWLISTER3K_URL` must be set.

- **Example**: `"false"`

#### `NEXT_PUBLIC_LINKS`

Social and TOS links.
Use single quotes to avoid escaping inner quotes.

- **Example**:

  ```json
  NEXT_PUBLIC_LINKS='{
    "x": "",
    "github": "",
    "discord": "",
    "tos": ""
  }'
  ```

#### `NEXT_PUBLIC_DISCORD_METADATA_REQUEST_CHANNEL`

Discord channel name for adding social links.

- **Example**: \`"A link to a discord channel here."

#### `REVALIDATION_TIME`

A Next.js setting to determine some queries' revalidation length (in seconds).

- **Example**: `"1"`

#### `HASH_SEED`

A private environment variable used to hash the user address and store it in a
cookie after the user has been verified.
This facilitates more efficient middleware while still requiring validation.

- **Example**: `"some random string that is not public"`

#### `GEOBLOCKED`

A JSON list of ISO 3166-2 codes of countries and regions to geoblock.
This can be empty, undefined, or `{}` to disable geoblocking.

- **Example**:

  ```json
  GEOBLOCKED='{"countries":[],"regions":[]}'
  ```

#### `NEXT_PUBLIC_CDN_URL`

Refer to the [CDN setup guide] for instructions on how to configure one.

The CDN must include:

- The TradingView library code. See [PrivateChart.tsx] for more info.
- The required frontend fonts. See [fonts.ts] for more info.

Without this variable being set, the application will:

- Use different fonts.
- Fail to properly display the TradingView chart on each market page.

______________________________________________________________________

### API Keys

#### `EMOJICOIN_INDEXER_API_KEY`

An optional API key for the indexer. If set, all requests to the indexer will
include the header:

```json
"X-Api-Key": "$EMOJICOIN_INDEXER_API_KEY"
```

#### `COINGECKO_API_KEY`

The CoinGecko API key used to retrieve the APT price in USD.
If absent, prices will be denominated in APT.

#### `NEXT_PUBLIC_<NETWORK>_APTOS_API_KEY`

The public Aptos API keys for the various networks. Only the key corresponding
to the active network needs to be set.

These keys:

- Must be **exposed publicly**, as they are passed to the wallet adapter context
  provider.

- Are safe to expose.

- **Example**:

```shell
NEXT_PUBLIC_TESTNET_APTOS_API_KEY="AG-FL4PYMZ1YX1LGAJCWP2R1ACYTYRCBY1GB"
```

Refer to the [Aptos API key documentation] for more details.

#### `SERVER_<NETWORK>_APTOS_API_KEY`

The backend/private Aptos API keys for the various networks. Only the key
corresponding to the active network needs to be set.

These keys:

- Must **NOT** be exposed publicly.

- **Example**:

<!-- markdownlint-disable MD013 -->

```shell
SERVER_TESTNET_APTOS_API_KEY="aptoslabs_aXjFX8fDdZv_AXMynDZvp711WTBpSBmqLyj12RV9RFA6B"
```

<!-- markdownlint-enable MD013 -->

## Ensure the environment variables are loaded

This repository loads environment variables in multiple ways.

To load environment variables while running test scripts, each `package.json`
file in the `sdk` folder specifies how to load these environment variables. Most
scripts run the `dotenv-cli` package as a wrapper, like so:

```shell
# In sdk/package.json:
"test": "dotenv -e ../ci.env -- pnpm jest",

# I run this command
pnpm run test

# Which loads the env variables in `../ci.env` and runs `jest`
```

Where `../ci.env` is the environment file located in the `typescript` parent
directory.

To avoid having to define environment variables in multiple places, we've
intentionally omitted environment variables from the `frontend` directory to
enforce that the project be built and run in a certain order.

## Copy the `example.env` file to a `.env` file

Most commands load `.env.local` first then `.env`, so copy the environment
example file to your own file.

```shell
cp example.env .env
```

## Run the `frontend` application

```shell
cd src/typescript
pnpm i

# to rebuild everything and run
pnpm run build
pnpm run start

# or, for hot reloads (does not rebuild)
pnpm run dev
```

Sometimes, `turbo` and `next` have build caches that persist and cause errors.
This can be avoided with a clever build process, however, you can also just
delete the `.next` and `.turbo` folders in each directory.

You can also run:

```shell
pnpm run full-clean
```

Note this remove's each project's `node_modules`, although it does not remove
the `pnpm-lock.yaml` file.

## Vercel deployment

To allow Vercel to clone the private submodule, you'll need to grant it access.

On GitHub:

1. Create a private personal fork of the charting library named
   `charting_library`.
1. Create a fine-grained personal access token:
   1. Select repository access for only your `charting_library` fork.
   1. Grant read-only access to `Repository permissions > Contents`.
   1. Grant read-only access to `Repository permissions > Metadata`.

On Vercel project settings:

1. General settings:
   1. `Build & Development Settings > Install Command`:
      `pnpm run vercel-install`
   1. `Root Directory`: `src/typescript/frontend`
1. Environment variables:
   1. All variables under `example.env`.
   1. `GITHUB_ACCESS_TOKEN`: the token you generated above.
   1. `TRADING_VIEW_REPO_OWNER`: your GitHub username.

This will allow Vercel to run the `frontend/vercel-install` script in order to
download the charting library from your private personal fork.

[aptos api key documentation]: https://developers.aptoslabs.com/docs/api-access/api-keys
[cdn setup guide]: https://github.com/econia-labs/cloud-infra/blob/main/doc/cdn.md
[fonts.ts]: ./frontend/src/styles/fonts.ts
[privatechart.tsx]: ./frontend/src/components/charts/PrivateChart.tsx
