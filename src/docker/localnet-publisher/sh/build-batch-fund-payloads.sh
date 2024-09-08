#!/bin/bash
# cspell:word argjson

source /app/sh/colors.sh

distribution_amount=10000000000000000

accounts_json_path="/app/json/test-accounts.json"
batch_fund_path_prefix="/app/json/batch-fund"

# Calculate the number of accounts.
num_accounts=$(jq 'keys | length' $accounts_json_path)

# Calculate amount per key (integer division)
amount_per_account=$((distribution_amount / num_accounts))

msg="Building the payload for"
msg="$msg distributing $distribution_amount to $num_accounts accounts"
log_info "$msg"

for i in {1..2}; do
	start_index=$(((i - 1) * 500))
	end_index=$((i * 500))

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
