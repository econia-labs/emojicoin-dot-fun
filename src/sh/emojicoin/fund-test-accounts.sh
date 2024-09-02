#!/bin/bash
# cspell:word toplevel
# cspell:word argjson

# ------------------------------------------------------------------------------
#                            		  Setup
# ------------------------------------------------------------------------------
root_dir=$(git rev-parse --show-toplevel)
move_dir="$root_dir/src/move"
sh_dir="$root_dir/src/sh"
this_dir="$sh_dir/emojicoin"

publisher="emojicoin_test_publisher"
big_money_guy="emojicoin_test_big_money_guy"

source $sh_dir/utils/colors.sh
log_header "Funding test accounts"

# ------------------------------------------------------------------------------
#                   Fund the publisher and test APT distributor
# ------------------------------------------------------------------------------
# The amount we'll fund the "publisher" and "big_money_guy" with.
fund_amount=10000000000000000
extra_for_gas=200000000

aptos account fund-with-faucet \
	--profile $publisher \
	--amount $fund_amount

aptos account fund-with-faucet \
	--profile $big_money_guy \
	--amount $((fund_amount + extra_for_gas))

# ------------------------------------------------------------------------------
#                       Fund the other 1,000 test accounts
# ------------------------------------------------------------------------------

if ! command -v jq &>/dev/null; then
	log_error "$(jq) is not installed. This script requires $(jq) to run."
	log_error "Please install $(jq) and try again."
	exit 1
fi

json_path="$this_dir/json"
accounts_json_path="$json_path/test-accounts.json"
batch_fund_path_prefix="$json_path/batch-fund"

num_funded=0

batch_fund() {
	local accounts_per_batch="$1"
	# Calculate the number of accounts.
	num_accounts=$(jq 'keys | length' $accounts_json_path)

	# Calculate amount per key (integer division)
	amount_per_account=$((fund_amount / num_accounts))
	batches=$((num_accounts / accounts_per_batch))

	for ((i = 1; i <= batches; i++)); do
		start_index=$(((i - 1) * accounts_per_batch))
		end_index=$((i * accounts_per_batch))

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
			$accounts_json_path >"${batch_fund_path_prefix}-${i}.json"
	done

	gas_unit_price=100
	max_gas=$(((extra_for_gas / gas_unit_price) / batches))
	# Fund the test accounts and inadvertently create them on-chain.
	# Loop to avoid transaction execution limits.
	for ((i = 1; i <= batches; i++)); do
		batch_fund_output_path="${batch_fund_path_prefix}-${i}.json"
		aptos move run \
			--assume-yes \
			--profile $big_money_guy \
			--json-file $batch_fund_output_path \
			--max-gas $max_gas \
			--gas-unit-price $gas_unit_price
		if [ $? == 0 ]; then
			num_funded=$((num_funded + accounts_per_batch))
		fi
	done
}

batch_fund 500

if [ $num_funded != $num_accounts ]; then
	log_warning "Failed to fund all $num_accounts test accounts."
	log_info "Trying to fund all accounts with fewer accounts per transaction."
	batch_fund 250
	if [ "$num_funded" -lt "$num_accounts" ]; then
		log_error "Failed to fund all $num_accounts test accounts."
	else
		log_info "Funded $num_accounts test accounts."
	fi
else
	log_info "Successfully funded $num_accounts test accounts."
fi
