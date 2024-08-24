#!/bin/bash

aptos node run-local-testnet \
  --assume-yes \
  --force-restart

# Run forever.
tail -f /dev/null
