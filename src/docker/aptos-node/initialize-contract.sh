#!/bin/bash

# In simple cases like ours (where there is no account abstraction), the
# deployer of a smart contract on Aptos is the address that's used for the
# contract address.
# Thus we can use the publisher's profile name as the contract's named address,
# since the CLI resolves named addresses to a profile if one exists with the same name.
export PUBLISHER="publisher"
export BIG_MONEY_GUY="big_money_guy"

aptos init --profile $PUBLISHER \
  --rest-url http://host.docker.internal:8080/v1 \
  --faucet-url http://host.docker.internal:8081 \
  --private-key $PUBLISHER_PK \
  --encoding hex \
  --assume-yes \
  --network custom

aptos init --profile $BIG_MONEY_GUY \
  --rest-url http://host.docker.internal:8080/v1 \
  --faucet-url http://host.docker.internal:8081 \
  --private-key $BIG_MONEY_GUY_PK \
  --encoding hex \
  --assume-yes \
  --network custom

# Fund with 1,000,000 APT.
aptos account fund-with-faucet \
    --profile $PUBLISHER \
    --amount 100000000000000

# Fund with 10,000,000 APT.
aptos account fund-with-faucet \
    --profile $BIG_MONEY_GUY \
    --amount 100000000000000

aptos move publish \
  --assume-yes \
  --included-artifacts none \
  --named-addresses emojicoin_dot_fun=$PUBLISHER \
  --override-size-check \
  --max-gas 2000000 \
  --package-dir /app/emojicoin_dot_fun \
  --profile $PUBLISHER

aptos move publish \
  --assume-yes \
  --included-artifacts none \
  --named-addresses rewards=$PUBLISHER,integrator=$PUBLISHER,emojicoin_dot_fun=$PUBLISHER \
  --override-size-check \
  --max-gas 200000 \
  --package-dir /app/rewards \
  --profile $PUBLISHER
