#!/bin/bash
# cspell:word toplevel

# ------------------------------------------------------------------------------
#                            Setup for absolute paths
# ------------------------------------------------------------------------------
root_dir=$(git rev-parse --show-toplevel)
docker_dir="$root_dir/src/docker"
move_dir="$root_dir/src/move"
sh_dir="$root_dir/src/sh"
this_dir="$sh_dir/emojicoin"

source $sh_dir/utils/colors.sh

if [ ! -f "$docker_dir/.env" ]; then
	log_info \
		"$docker_dir/.env does not exist. Copying example.local.env to .env"
	cp $docker_dir/example.local.env $docker_dir/.env
fi

bash $this_dir/create-test-profiles.sh

emojicoin_dir="$move_dir/emojicoin_dot_fun"
rewards_dir="$move_dir/rewards"
output_prefix="$this_dir/json/publish"

profile="emojicoin_test_publisher"

{
	output_path="$output_prefix-rewards.json"
	aptos move build-publish-payload \
		--assume-yes \
		--profile $profile \
		--named-addresses \
		rewards=$profile,integrator=$profile,emojicoin_dot_fun=$profile \
		--override-size-check \
		--included-artifacts none \
		--package-dir $rewards_dir \
		--json-output-file $output_path
	log_info "Created publish payload at $(highlight_text $output_path)"
} &
pid_publish_1=$!

{
	output_path="$output_prefix-emojicoin_dot_fun.json"
	aptos move build-publish-payload \
		--assume-yes \
		--profile $profile \
		--named-addresses emojicoin_dot_fun=$profile \
		--override-size-check \
		--included-artifacts none \
		--package-dir $emojicoin_dir \
		--json-output-file $output_path
	log_info "Created publish payload at $(highlight_text $output_path)"
} &
pid_publish_2=$!

wait $pid_publish_1 $pid_publish_2
