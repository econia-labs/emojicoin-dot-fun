#!/bin/bash

set -e

# Note that the response from the readiness endpoint at http://localhost:8070
# is a JSON object of the following structure:
#
# {
#   "ready": [
#       // Objects describing services that are ready.
#   ],
#   "not_ready": [
#       // Objects describing services that are not ready.
#   ]
# }
#
# `curl` the readiness endpoint and check if the `not_ready` array is empty.
# Pipe the output from `jq` to `grep` to check if the length is 0.

# `-e` flag tells `jq` to exit with a status code matching the boolean
# expression. If the expression is true, the status code is 0, otherwise 1.
curl -s http://localhost:8070/ | jq -e '.not_ready | length == 0' > /dev/null

if [[ $? -eq 0 ]]; then
  echo "All CLI services are ready."
else
  echo "Not all CLI indexer processors are ready."
  exit 1
fi

# Check if the indexer data is in sync with the current local testnet.
/app/sh/check-if-stale.sh
exit $?
