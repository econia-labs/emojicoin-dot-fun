#!/bin/bash

# In simple cases like ours (where there is no account abstraction), the
# deployer of a smart contract on Aptos is the address that's used for the
# contract address.
# Thus we can use the publisher's profile name as the contract's named address,
# since the CLI resolves named addresses to a profile if one exists with the same name.
export PROFILE_NAME="publisher"

aptos init --profile $PROFILE_NAME \
  --rest-url http://host.docker.internal:8080/v1 \
  --faucet-url http://host.docker.internal:8081 \
  --private-key $PUBLISHER_PK \
  --encoding hex \
  --assume-yes \
  --network custom

# Fund with 1,000,000 APT.
aptos account fund-with-faucet \
    --profile $PROFILE_NAME \
    --amount 100000000000000

aptos move publish \
  --assume-yes \
  --included-artifacts none \
  --named-addresses emojicoin_dot_fun=$PROFILE_NAME \
  --override-size-check \
  --max-gas 2000000 \
  --package-dir /app/emojicoin_dot_fun \
  --profile $PROFILE_NAME

aptos move publish \
  --assume-yes \
  --included-artifacts none \
  --named-addresses rewards=$PROFILE_NAME,integrator=$PROFILE_NAME \
  --override-size-check \
  --max-gas 200000 \
  --package-dir /app/emojicoin_dot_fun_rewards \
  --profile $PROFILE_NAME
