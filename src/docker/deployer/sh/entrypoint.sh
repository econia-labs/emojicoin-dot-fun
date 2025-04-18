#!/bin/bash

source /app/sh/cli-profile.sh
source /app/sh/colors.sh

profile="publisher"
fund_amount=20000000000000000
extra_for_gas=200000000
gas_unit_price=100

check_faucet_and_rest_API() {
	faucet_url="http://host.docker.internal:8081"
	rest_url="http://host.docker.internal:8080/v1"
	curl -s "$faucet_url" >/dev/null && curl -s "$rest_url" >/dev/null
}

# We only need to wait for the REST API, not the full indexer API.
while ! check_faucet_and_rest_API; do
	sleep 0.1
done

# ------------------------------------------------------------------------------
#               Re-initialize the CLI publisher profile if necessary
# ------------------------------------------------------------------------------
# Check if the previous profile's private key matches the current private key.
# Generally, this will be the profile created at the image build time.
# If it doesn't match, ensure the CLI recreates the profile with the new key.
profile_private_key=$(get_publisher_private_key)
# Checks for address equality, with 0x and without it.
address_eq() {
	[ "$1" == "$2" ] || [ "0x$1" == "$2" ] || [ "$1" == "0x$2" ]
}
if ! address_eq "$profile_private_key" "$PUBLISHER_PRIVATE_KEY"; then
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

	aptos move run \
		--assume-yes \
		--json-file /app/json/market_metadata.json \
		--max-gas 2000000 \
		--gas-unit-price $gas_unit_price \
		--profile $profile

	water_bytes="f09f92a7" # For 💧.
	fire_bytes="f09f94a5"  # For 🔥.
	# Alternatively, you could pass "raw:0104f09f92a7" to properly serialize
	# a vector<vector<u8>> like [[ 0xf09f92a7 ]]
	water_vec_vec_u8_arg="hex:[\"$water_bytes\"]"
	fire_vec_vec_u8_arg="hex:[\"$fire_bytes\"]"

	# Register two markets so it's possible to publish the arena module.
	# Otherwise `init_module` loops infinitely and times out.
	aptos move run \
		--assume-yes \
		--function-id "$profile::emojicoin_dot_fun::register_market" \
		--args $water_vec_vec_u8_arg address:$profile \
		--max-gas 2000000 \
		--gas-unit-price $gas_unit_price \
		--profile $profile

	aptos move run \
		--assume-yes \
		--function-id "$profile::emojicoin_dot_fun::register_market" \
		--args $fire_vec_vec_u8_arg address:$profile \
		--max-gas 2000000 \
		--gas-unit-price $gas_unit_price \
		--profile $profile

	aptos move run \
		--assume-yes \
		--json-file /app/json/emojicoin_arena.json \
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

# Run the initialization steps if the module hasn't been published yet.
if ! already_published; then
	log_info "Funding the publisher and publishing the module."
	fund_and_publish
	fund_test_accounts
fi

log_info "Module is published and test accounts are funded!"
