#!/bin/bash

# Environment variables.
publisher_pk=$PUBLISHER_PK
big_money_guy_pk=$BIG_MONEY_GUY_PK

# ------------------------------------------------------------------------------
#                               Start the local testnet
# ------------------------------------------------------------------------------
# The `test-dir` path specified is the default path, but it's here to be
# explicit. This will be copied over to the new image with state pre-loaded
# at the end of the multi-stage build process.
aptos node run-localnet \
	--test-dir /app/.aptos/testnet \
	--assume-yes \
	--force-restart &

seconds=1

check_endpoint() {
	curl -s -f -o /dev/null http://localhost:8070/
}

# Wait for the local testnet to be up.
while ! check_endpoint; do
	echo "Waiting for the local testnet to be up..."
	sleep "$seconds"
done

# ------------------------------------------------------------------------------
#                              Publish the contracts
# ------------------------------------------------------------------------------
# We can use the publisher's profile name as the contract's named address,
# since the CLI resolves named addresses to a profile if one exists with the
# same name.
export PUBLISHER="publisher"
export BIG_MONEY_GUY="big_money_guy"

# The amount we'll fund the "publisher" and "big_money_guy" with.
fund_amount=10000000000000000
extra_for_gas=200000000

aptos init --profile $PUBLISHER \
	--rest-url http://localhost:8080/v1 \
	--faucet-url http://localhost:8081 \
	--private-key $publisher_pk \
	--encoding hex \
	--assume-yes \
	--network local

aptos init --profile $BIG_MONEY_GUY \
	--rest-url http://localhost:8080/v1 \
	--faucet-url http://localhost:8081 \
	--private-key $big_money_guy_pk \
	--encoding hex \
	--assume-yes \
	--network local

# Fund with 1,000,000 APT.
aptos account fund-with-faucet \
	--profile $PUBLISHER \
	--amount $fund_amount

# Fund with 10,000,000 APT.
aptos account fund-with-faucet \
	--profile $BIG_MONEY_GUY \
	--amount $((fund_amount + extra_for_gas))

# Publish with the JSON publish payloads that were built on the host machine
# and copied to the container.
aptos move run \
	--json-file /app/json/publish-emojicoin_dot_fun.json \
	--assume-yes \
	--max-gas 2000000 \
	--profile $PUBLISHER

aptos move run \
	--json-file /app/json/publish-rewards.json \
	--assume-yes \
	--max-gas 2000000 \
	--profile $PUBLISHER

# ------------------------------------------------------------------------------
#                              Fund the test accounts
# ------------------------------------------------------------------------------
accounts_json_path="/app/json/test-accounts.json"
batch_fund_path_prefix="/app/json/batch-fund"

# Calculate the number of accounts.
num_accounts=$(jq 'keys | length' $accounts_json_path)

# Calculate amount per key (integer division)
amount_per_account=$((fund_amount / num_accounts))

for i in {1..2}; do
    start_index=$(( (i-1) * 500 ))
    end_index=$(( i * 500 ))
    
    jq -r --arg amount "$amount_per_account" \
	    --argjson start "$start_index" \
	    --argjson end "$end_index" \
	'
    keys | 
    .[$start:$end] |
    {
      "args": [
        {
          "type": "address",
          "value": .
        },
        {
          "type": "u64",
          "value": map($amount)
        }
      ],
      "function_id": "0x1::aptos_account::batch_transfer",
      "type_args": []
    }
    ' \
	$accounts_json_path > "${batch_fund_path_prefix}-${i}.json"
done

gas_unit_price=100
max_gas=$(((extra_for_gas / gas_unit_price) / 2))

# Fund the test accounts and inadvertently create them on-chain.
# Do it twice because a single transaction results in an execution limit error.
for i in {1..2}; do
	batch_fund_output_path="${batch_fund_path_prefix}-${i}.json"
	aptos move run \
	    --assume-yes \
	    --profile $BIG_MONEY_GUY \
	    --json-file $batch_fund_output_path \
		--max-gas $max_gas \
		--gas-unit-price $gas_unit_price
done
