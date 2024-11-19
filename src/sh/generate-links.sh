#!/bin/bash

url="https://emojicoin.fun/generate-qr-code"

for _ in $(seq 1 "$2");do
	private="$(openssl genpkey -algorithm ED25519)"
	public="$(echo "$private" | openssl pkey -pubout)"
	formated_private="$(echo "$private" | head -n 2 | tail -n 1)"
	formated_public="$(echo "$public" | head -n 2 | tail -n 1)"
	echo "$formated_private,$formated_public,$url/$(echo -n "$formated_private" | base64 | jq -sRr @uri)" >> "$3"
done

publics="$(awk -F',' '{print $2}' "$3" | od -An -v -td1 | xargs -I _ echo "[_]" | tr -s ' \n' ',' | sed -E 's/^,(.*),$/\1/g' | tr '\n' ',' | sed -E 's/^(.*),$/\1/g')"

echo "aptos move run --function-id \"$1\"::emojicoin_dot_fun_claim_link::add_public_keys_and_fund_gas_escrows --args \"u8:[$publics]\" u64:10000000"
