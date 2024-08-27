#!/bin/bash
# cspell:word toplevel

ROOT_DIR=$(git rev-parse --show-toplevel)
DOCKER_DIR_ABS_PATH="$ROOT_DIR/src/docker"

if [ -z "$PUBLISHER_PK" ]; then
	echo "PUBLISHER_PK is not set. Trying to find one in $DOCKER_DIR_ABS_PATH/.env"
	echo "Note that this will override BIG_MONEY_GUY_PK if it exists."
	
	if [ -f "$DOCKER_DIR_ABS_PATH/.env" ]; then
		source "$DOCKER_DIR_ABS_PATH/.env"
	else
		echo "PUBLISHER_PK is not set. Exiting."
		exit 1
	fi
fi

if [ -z "$BIG_MONEY_GUY_PK" ]; then
	echo "BIG_MONEY_GUY_PK is not set. Exiting."
	exit 1
fi

# In simple cases like ours (where there is no account abstraction), the
# deployer of a smart contract on Aptos is the address that's used for the
# contract address.
# Thus we can use the publisher's profile name as the contract's named address,
# since the CLI resolves named addresses to a profile if one exists with the
# same name.
export PUBLISHER="EMOJICOIN_DOT_FUN_TEST_publisher"
export BIG_MONEY_GUY="EMOJICOIN_DOT_FUN_TEST_big_money_guy"

aptos init --profile $PUBLISHER \
	--private-key $PUBLISHER_PK \
	--encoding hex \
	--assume-yes \
	--network local

aptos init --profile $BIG_MONEY_GUY \
	--private-key $BIG_MONEY_GUY_PK \
	--encoding hex \
	--assume-yes \
	--network local

# Fund with 1,000,000 APT.
aptos account fund-with-faucet \
	--profile $PUBLISHER \
	--network local
	--amount 100000000000000

# Fund with 10,000,000 APT.
aptos account fund-with-faucet \
	--profile $BIG_MONEY_GUY \
	--amount 100000000000000

aptos move publish \
	--assume-yes \
	--included-artifacts none \
	--named-addresses emojicoin_dot_fun=$PUBLISHER \
	--override-size-check \
	--max-gas 2000000 \
	--package-dir /app/emojicoin_dot_fun \
	--skip-fetch-latest-git-deps \
	--profile $PUBLISHER

aptos move publish \
	--assume-yes \
	--included-artifacts none \
	--named-addresses \
	rewards=$PUBLISHER,integrator=$PUBLISHER,emojicoin_dot_fun=$PUBLISHER \
	--override-size-check \
	--max-gas 200000 \
	--package-dir /app/rewards \
	--skip-fetch-latest-git-deps \
	--profile $PUBLISHER
