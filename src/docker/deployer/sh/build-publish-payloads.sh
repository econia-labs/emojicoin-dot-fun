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
