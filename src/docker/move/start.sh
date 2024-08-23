#!/bin/bash

echo $PUBLISHER_PK > /publisher.key

aptos init \
  --assume-no \
  --network custom \
  --rest-url http://host.docker.internal:8080 \
  --faucet-url http://host.docker.internal:8081 \
  --private-key-file /publisher.key \
  --profile emojicoin_dot_fun

aptos account fund-with-faucet \
    --profile emojicoin_dot_fun

aptos move publish \
  --assume-yes \
  --included-artifacts none \
  --named-addresses emojicoin_dot_fun=$EMOJICOIN_MODULE_ADDRESS \
  --override-size-check \
  --max-gas 2000000 \
  --package-dir /app/emojicoin_dot_fun \
  --profile emojicoin_dot_fun
