#!/bin/bash

source /app/sh/colors.sh

distribution_amount=10000000000000000

accounts_json_path="/app/json/test-accounts.json"
batch_fund_path_prefix="/app/json/batch-fund"

# Calculate the number of accounts.
num_accounts=$(jq 'keys | length' $accounts_json_path)

# Calculate amount per key (integer division)
amount_per_account=$((distribution_amount / num_accounts))

log_info "Distributing $distribution_amount to $num_accounts accounts"

for i in {1..3}; do
	start_index=$(((i - 1) * 333))
  
  if [ $i != 3 ]; then
	  end_index=$((i * 333))
  else
    end_index=$num_accounts
  fi

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
