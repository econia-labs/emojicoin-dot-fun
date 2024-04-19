#!/bin/bash
# cspell:word randint
# cspell:word toplevel
# cspell:word zfill

network=$1
json_name=$2

if [[ -z $network ]]; then
	echo "Please provide a network."
	exit 1
fi

function print_green_lines {
	echo -e "\e[32m----------------------------------------------------------------------------------------------------\e[0m"
}

original_cwd=$(pwd)

function cleanup() {
	cd "$original_cwd" || exit 1
}

# Ensure cleanup function is called on exit.
trap cleanup EXIT

python_command="from random import randint; print(''.join([hex(randint(0, 255))[2:].zfill(2) for x in range(32)]))"
pk=$(python3 -c "$python_command")

GIT_ROOT_DIR=$(git rev-parse --show-toplevel)
EMOJICOIN_CONTRACT_DIR=$GIT_ROOT_DIR/src/move/emojicoin_dot_fun/
cd $EMOJICOIN_CONTRACT_DIR

print_green_lines
aptos init --profile random_account --assume-yes --network $network --encoding hex --private-key $pk

print_green_lines
aptos account fund-with-faucet --profile random_account

print_green_lines
aptos move publish \
	--profile random_account \
	--named-addresses emojicoin_dot_fun=random_account \
	--included-artifacts=none \
	--assume-yes \
	--max-gas 2000000 \
	--skip-fetch-latest-git-deps
