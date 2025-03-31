#!/bin/bash

json_dir="/app/json"
move_dir="/app/move"

source /app/sh/colors.sh

profile="publisher"

log_info "Building and publishing payloads..."

aptos move build-publish-payload \
	--assume-yes \
	--named-addresses emojicoin_dot_fun=$profile \
	--override-size-check \
	--included-artifacts none \
	--package-dir $move_dir/emojicoin_dot_fun/ \
	--json-output-file $json_dir/emojicoin_dot_fun.json

# Note the extra `--skip-fetch-latest-git-deps` flag because the previous
# command already fetches the latest git dependencies and the `rewards` module's
# dependencies are a subset of the dependencies for `emojicoin_dot_fun`.
aptos move build-publish-payload \
	--assume-yes \
	--named-addresses \
	rewards=$profile,integrator=$profile,emojicoin_dot_fun=$profile \
	--override-size-check \
	--included-artifacts none \
	--package-dir $move_dir/rewards/ \
	--json-output-file $json_dir/rewards.json \
	--skip-fetch-latest-git-deps

aptos move build-publish-payload \
	--assume-yes \
	--named-addresses \
	emojicoin_dot_fun=$profile,market_metadata=$profile \
	--package-dir $move_dir/market_metadata/ \
	--json-output-file $json_dir/market_metadata.json \
	--skip-fetch-latest-git-deps

# Ensure the default duration const is in the source file exactly as expected.
original_const="const DEFAULT_DURATION: u64 = 20 \* 3_600_000_000;"
source_file="$move_dir/emojicoin_arena/sources/emojicoin_arena.move"

# Ensure there's exactly 1 appearance in the source code.
if [ $(grep -c "$original_const" "$source_file") -ne 1 ]; then
	log_error "Couldn't find constant DEFAULT_DURATION in the arena move code."
	exit 1
fi

# Replace the default duration with 1 microsecond.
# Instead of trying to finagle setting the value here, just set the first
# one to be really short, and let the test suite set the next melee duration
# and end the first melee immediately.
replacement_const="const DEFAULT_DURATION: u64 = 1;"
sed -i "s/${original_const}/${replacement_const}/" "$source_file"

if [ $(grep -c "$replacement_const" "$source_file") -ne 1 ]; then
	log_error "Couldn't replace the DEFAULT_DURATION value."
	exit 1
fi

aptos move build-publish-payload \
	--assume-yes \
	--named-addresses \
	emojicoin_arena=$profile,integrator=$profile,emojicoin_dot_fun=$profile \
	--package-dir $move_dir/emojicoin_arena/ \
	--json-output-file $json_dir/emojicoin_arena.json \
	--skip-fetch-latest-git-deps
