#!/bin/bash

set -e

if [ -z "$PUBLISHER_PRIVATE_KEY" ]; then
	echo "PUBLISHER_PRIVATE_KEY is not set. Exiting."
	exit 1
fi

source /app/sh/cli-profile.sh
source /app/sh/colors.sh

current_key=$(get_publisher_private_key)
if [ "$current_key" == "$PUBLISHER_PRIVATE_KEY" ]; then
	echo "Profile publisher already exists. Skipping profile initialization."
	exit 0
fi

# This script initializes a profile on the `testnet` network and then updates
# the profile to use the `custom` network with the correct rest and faucet URLs.
# This is a workaround to avoid having to run a local testnet during the image
# build process.
# This facilitates checking the derived address against the expected address at
# build time and initializing the profile and subsequent `aptos` config.yaml
# file without having to run a local testnet.
# This could always be run with a local testnet started prior to building the
# image if necessary. It's just easier to avoid that if possible.

# See the note above for why we use `testnet` here.
profile="publisher"

result_json=$(aptos init \
	--assume-yes \
	--profile $profile \
	--private-key $PUBLISHER_PRIVATE_KEY \
	--encoding hex \
	--network testnet 2>/dev/null)

result=$(echo $result_json | jq -r '.Error')

if [ -n "$result" ]; then
	# As long as the private key is correct, we have what we need.
	current_key=$(get_publisher_private_key)
	if [ "$current_key" != "$PUBLISHER_PRIVATE_KEY" ]; then
		log_error "Failed to initialize profile \"$profile\""
		log_error $(echo $result | jq -r '.Error')
		exit 1
	fi
fi

log_info "Profile successfully created."

# Update the profile to use network: `Local` with correct REST and faucet URLs.
config_path="/app/.aptos/config.yaml"
rest_url="http://host.docker.internal:8080/v1"
faucet_url="http://host.docker.internal:8081"

yq eval "
    .profiles.$profile.network = \"Local\" |
    .profiles.$profile.rest_url = \"$rest_url\" |
    .profiles.$profile.faucet_url = \"$faucet_url\"
" -i "$config_path"
