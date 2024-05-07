# emojicoin dot fun

This package is just within the bounds of max publication gas, and cost roughly
1 APT to publish during testing.

## Signer-signer publication

```sh
aptos move publish \
    --assume-yes \
    --included-artifacts=none \
    --max-gas 2000000 \
    --named-addresses emojicoin_dot_fun=$EMOJICOIN_DOT_FUN
```

## Multisig publication

Create a profile:

```sh
aptos init --profile emojicoin-testnet
```

Store the single signer account address:

```sh
SIGNER=<GENERATED_ACCOUNT_ADDRESS>
```

Fund the account to ensure sufficient gas for publication:

```sh
# Run this command twice.
aptos account fund-with-faucet \
    --account $SIGNER \
    --profile emojicoin-testnet
```

Create the multisig:

```sh
aptos multisig create \
    --num-signatures-required 1 \
    --profile emojicoin-testnet
```

Store the multisig address:

```sh
MULTISIG=<GENERATED_MULTISIG_ADDRESS>
```

Build the publish payload:

```sh
aptos move build-publish-payload \
    --included-artifacts none \
    --json-output-file emojicoin_dot_fun.json \
    --named-addresses emojicoin_dot_fun=$MULTISIG \
    --profile emojicoin-testnet
```

Create the transaction, storing only the hash onchain:

```sh
aptos multisig create-transaction \
    --json-file emojicoin_dot_fun.json \
    --multisig-address $MULTISIG \
    --profile emojicoin-testnet \
    --store-hash-only
```

Execute the publication transaction:

```sh
aptos multisig execute-with-payload \
    --json-file emojicoin_dot_fun.json \
    --max-gas 2000000 \
    --multisig-address $MULTISIG \
    --profile emojicoin-testnet
```
