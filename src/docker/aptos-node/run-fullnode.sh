#!/bin/bash

aptos node run-local-testnet \
  --assume-yes \
  --with-indexer-api \
  --force-restart

# Run forever.
tail -f /dev/null
