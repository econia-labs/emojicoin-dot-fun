#!/bin/bash
# cspell:word localnet
# cspell:word argjson

# Environment variables.
publisher_address=$EMOJICOIN_MODULE_ADDRESS
publisher_private_key=$PUBLISHER_PRIVATE_KEY

# ------------------------------------------------------------------------------
#                              Publish the contracts
# ------------------------------------------------------------------------------

fund_amount=20000000000000000
extra_for_gas=200000000
gas_unit_price=100

faucet_url="http://host.docker.internal:8081"
rest_url="http://host.docker.internal:8080/v1"

aptos account fund-with-faucet \
	--faucet-url $faucet_url \
	--account $publisher_address \
	--amount $((fund_amount + extra_for_gas))

# Publish with the JSON publish payloads generated in the build step.
aptos move run \
	--json-file /app/json/emojicoin_dot_fun.json \
	--assume-yes \
	--max-gas 2000000 \
	--gas-unit-price $gas_unit_price \
	--url $rest_url \
	--private-key $publisher_private_key \
	--encoding hex

aptos move run \
	--json-file /app/json/rewards.json \
	--assume-yes \
	--max-gas 2000000 \
	--gas-unit-price $gas_unit_price \
	--url $rest_url \
	--private-key $publisher_private_key \
	--encoding hex

# ------------------------------------------------------------------------------
#                              Fund the test accounts
# ------------------------------------------------------------------------------
# Fund test accounts with the batch fund payloads generated in the build step.
batch_fund_path_prefix="/app/json/batch-fund"
max_gas=$(((extra_for_gas / gas_unit_price) / 2))

# Fund the test accounts and inadvertently create them on-chain.
# Do it twice because a single transaction results in an execution limit error.
for i in {1..2}; do
	batch_fund_output_path="${batch_fund_path_prefix}-${i}.json"
	aptos move run \
		--assume-yes \
		--private-key $publisher_private_key \
		--encoding hex \
		--json-file $batch_fund_output_path \
		--max-gas $max_gas \
		--gas-unit-price 100 \
		--url $rest_url \
		--private-key $publisher_private_key \
		--encoding hex
done
