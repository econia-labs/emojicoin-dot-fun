#!/bin/bash
# cspell:word localnet
# cspell:word argjson

source /app/sh/cli-profile.sh
source /app/sh/colors.sh

# ------------------------------------------------------------------------------
#               Re-initialize the CLI publisher profile if necessary
# ------------------------------------------------------------------------------
profile="publisher"

# Check if the previous profile's private key matches the current private key.
# Generally, this will be the profile created at the image build time.
# If it doesn't match, ensure the CLI recreates the profile with the new key.
profile_private_key=$(get_publisher_private_key)
if [ "$profile_private_key" != "$PUBLISHER_PRIVATE_KEY" ]; then
	log_warning \
		"The private key for \"publisher\" does not match PUBLISHER_PRIVATE_KEY"
	log_warning "PUBLISHER_PRIVATE_KEY: $PUBLISHER_PRIVATE_KEY"
	log_warning "\"publisher\" profile: $profile_private_key"
	msg="Rebuild the image to skip re-initializing the CLI profile and"
	msg="$msg rebuilding the publish payloads on startup."
	log_warning "$msg"

	bash /app/sh/init-profile.sh
	bash /app/sh/build-publish-payloads.sh
fi

fund_amount=20000000000000000
extra_for_gas=200000000

aptos account fund-with-faucet \
	--profile $profile \
	--account $profile \
	--amount $((fund_amount + extra_for_gas))

# ------------------------------------------------------------------------------
#                              Publish the contracts
# ------------------------------------------------------------------------------
gas_unit_price=100

aptos move run \
	--assume-yes \
	--json-file /app/json/emojicoin_dot_fun.json \
	--max-gas 2000000 \
	--gas-unit-price $gas_unit_price \
	--profile $profile

aptos move run \
	--assume-yes \
	--json-file /app/json/rewards.json \
	--max-gas 2000000 \
	--gas-unit-price $gas_unit_price \
	--profile $profile

# ------------------------------------------------------------------------------
#                              Fund the test accounts
# ------------------------------------------------------------------------------
# Fund test accounts with the batch fund payloads generated in the build step.
num_batches=$(ls $batch_fund_path_prefix-*.json | wc -l)
batch_fund_path_prefix="/app/json/batch-fund"
max_gas=$(((extra_for_gas / gas_unit_price) / num_batches))

# Fund the test accounts and inadvertently create them on-chain.
for i in $(seq 1 $num_batches); do
	batch_fund_output_path="${batch_fund_path_prefix}-${i}.json"
	aptos move run \
		--assume-yes \
		--json-file $batch_fund_output_path \
		--max-gas $max_gas \
		--gas-unit-price 100 \
		--profile $profile
done
