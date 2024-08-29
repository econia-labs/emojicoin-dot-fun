#!/bin/bash

# This just needs to be some address in `batch-fund.json`.
# Once this account exists on-chain, the healthcheck will pass.
# Since the account will only exist at the very end of the `run-fullnode.sh` script,
# we know that the node and smart contract are fully initialized and ready to serve requests.
ADDRESS="0x000276e7908d952b7639672a07da760969c7791315fdde140c00228427fe6000"

# Make a request to the account endpoint
response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8080/v1/accounts/$ADDRESS")

echo $response
echo curl --help
curl -s -o -v /dev/null -w "%{http_code}" "http://localhost:8080/v1/accounts/$ADDRESS"

# Check if the response is 200.
if [ "$response" -eq 200 ]; then
	echo "Healthcheck passed: Account endpoint returned 200"
	exit 0
else
	echo "Healthcheck failed: Account endpoint returned $response"
	exit 1
fi
