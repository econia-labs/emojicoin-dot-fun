#!/bin/bash

# ------------------------------------------------------------------------------
#                               Start the local testnet
# ------------------------------------------------------------------------------
aptos node run-local-testnet \
	--assume-yes \
	--with-indexer-api \
	--force-restart &

seconds=2

check_endpoint() {
    status_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8070/)
    if [ "$status_code" -eq 200 ]; then
		echo "Local testnet is up."
        return 0
    else
		echo "Local testnet is not up yet: [$status_code]. Sleeping $seconds seconds..."
        return 1
    fi
}

# Wait for the local testnet to be up.
while ! check_endpoint; do
    sleep $seconds
done


# ------------------------------------------------------------------------------
#                              Publish the contracts
# ------------------------------------------------------------------------------
# We can use the publisher's profile name as the contract's named address,
# since the Aptos CLI resolves named addresses to a profile if one exists with the
# same name.
export PUBLISHER="publisher"
export BIG_MONEY_GUY="big_money_guy"

aptos init --profile $PUBLISHER \
	--rest-url http://host.docker.internal:8080/v1 \
	--faucet-url http://host.docker.internal:8081 \
	--private-key $PUBLISHER_PK \
	--encoding hex \
	--assume-yes \
	--network custom

aptos init --profile $BIG_MONEY_GUY \
	--rest-url http://host.docker.internal:8080/v1 \
	--faucet-url http://host.docker.internal:8081 \
	--private-key $BIG_MONEY_GUY_PK \
	--encoding hex \
	--assume-yes \
	--network custom

# Fund with 1,000,000 APT.
aptos account fund-with-faucet \
	--profile $PUBLISHER \
	--amount 100000000000000

# Fund with 10,000,000 APT.
aptos account fund-with-faucet \
	--profile $BIG_MONEY_GUY \
	--amount 100000000000000

if [ $PUBLISH_TYPE = "json" ]; then
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
else
	aptos move publish \
		--assume-yes \
		--included-artifacts none \
		--named-addresses emojicoin_dot_fun=$PUBLISHER \
		--override-size-check \
		--max-gas 2000000 \
		--package-dir /app/emojicoin_dot_fun \
		--profile $PUBLISHER

	aptos move publish \
		--assume-yes \
		--included-artifacts none \
		--named-addresses \
		rewards=$PUBLISHER,integrator=$PUBLISHER,emojicoin_dot_fun=$PUBLISHER \
		--override-size-check \
		--max-gas 200000 \
		--package-dir /app/rewards \
		--profile $PUBLISHER
fi

# ------------------------------------------------------------------------------
#                              Fund the test accounts
# ------------------------------------------------------------------------------
# Fund ten addresses and inadvertently create accounts for them on-chain.
aptos move run \
  --assume-yes \
  --profile $BIG_MONEY_GUY \
  --json-file /app/json/batch-fund.json

# Run forever- the local testnet needs to be up indefinitely.
tail -f /dev/null
