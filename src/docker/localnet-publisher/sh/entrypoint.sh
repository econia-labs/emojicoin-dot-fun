#!/bin/bash

source /app/sh/cli-profile.sh
source /app/sh/colors.sh

profile="publisher"
fund_amount=20000000000000000
extra_for_gas=200000000
gas_unit_price=100

# ------------------------------------------------------------------------------
#               Re-initialize the CLI publisher profile if necessary
# ------------------------------------------------------------------------------
# Check if the previous profile's private key matches the current private key.
# Generally, this will be the profile created at the image build time.
# If it doesn't match, ensure the CLI recreates the profile with the new key.
profile_private_key=$(get_publisher_private_key)
if [ "$profile_private_key" != "$PUBLISHER_PRIVATE_KEY" ]; then
	log_warning \
		'The private key for "publisher" does not match PUBLISHER_PRIVATE_KEY'
	log_warning "PUBLISHER_PRIVATE_KEY: $PUBLISHER_PRIVATE_KEY"
	log_warning "\"publisher\" profile: $profile_private_key"
	msg="Rebuild the image to skip re-initializing the CLI profile and"
	msg="$msg rebuilding the publish payloads on startup."
	log_warning "$msg"

	# Re-initialize the profile and rebuild the publish payloads so that the
	# new publisher profile is interpolated into the payloads.
	bash /app/sh/init-profile.sh
	bash /app/sh/build-publish-payloads.sh
fi

already_published() {
	aptos move view \
		--function-id "$profile"::emojicoin_dot_fun::registry_view \
		--profile $profile >/dev/null 2>&1
	return $?
}

fund_and_publish() {
	aptos account fund-with-faucet \
		--profile $profile \
		--account $profile \
		--amount $((fund_amount + extra_for_gas))

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
}

fund_test_accounts() {
	batch_fund_path_prefix="/app/json/batch-fund"
	num_batches=$(ls $batch_fund_path_prefix-*.json | wc -l)
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
}

# Run the initialization steps if the contract doesn't exist or if the user
# forces a restart.
if [ -n "$FORCE_RESTART" ] || ! already_published; then
	log_info "Funding the publisher and publishing the contract."
	fund_and_publish
	fund_test_accounts
fi

log_info "Smart is published and test accounts are funded!"
