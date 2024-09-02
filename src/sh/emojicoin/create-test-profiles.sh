#!/bin/bash
# cspell:word toplevel

# ------------------------------------------------------------------------------
#                            		  Setup
# ------------------------------------------------------------------------------
root_dir=$(git rev-parse --show-toplevel)
docker_dir="$root_dir/src/docker"
sh_dir="$root_dir/src/sh"

source $sh_dir/utils/colors.sh

if [ ! -f "$docker_dir/.env" ]; then
	log_info
		"$docker_dir/.env does not exist. Copying example.local.env to .env"
	cp $docker_dir/example.local.env $docker_dir/.env
fi

source $docker_dir/.env

all_profiles=$(aptos config show-profiles)
check_profile() {
	local profile="$1"
	echo $all_profiles | grep $profile >/dev/null
}

publisher="emojicoin_test_publisher"
big_money_guy="emojicoin_test_big_money_guy"

initialize_and_fund() {
	local profile="$1"
	local private_key="$2"
	aptos init \
		--profile "$profile" \
		--private-key "$private_key" \
		--encoding hex \
		--network local \
		--assume-yes \
	&& aptos account fund-with-faucet \
		--profile "$profile" \
		--amount 100000000000000000
}

maybe_initialize_and_fund() {
	local profile="$1"
	local private_key="$2"
	if ! check_profile "$profile"; then
		initialize_and_fund "$profile" "$private_key"
	fi
}

if ! check_profile "$publisher" || ! check_profile "$big_money_guy"; then
	log_header "Creating test profiles"

	maybe_initialize_and_fund "$publisher" "$PUBLISHER_PRIVATE_KEY"
	maybe_initialize_and_fund "$big_money_guy" "$BIG_MONEY_GUY_PRIVATE_KEY"
fi
