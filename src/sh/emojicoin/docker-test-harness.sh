#!/bin/bash
# cspell:word toplevel
# cspell:word localnode

# ------------------------------------------------------------------------------
#                            Setup for absolute paths
# ------------------------------------------------------------------------------
# Resolve the docker directory to its absolute path to avoid issues.
root_dir=$(git rev-parse --show-toplevel)
docker_dir="$root_dir/src/docker"
move_dir="$root_dir/src/move"

# Store the original working directory to return to upon exit.
original_cwd=$(pwd)

cd "$docker_dir" || exit 1

function cleanup() {
	cd "$original_cwd" || exit 1
}

# Ensure cleanup function is called on exit.
trap cleanup EXIT

INFO_COLOR='\033[1;37m'
WARNING_COLOR='\033[38;5;202m'
HEADER_COLOR='\033[1;35m'
NO_COLOR='\033[0m'

INFO="$INFO_COLOR[INFO]$NO_COLOR:"
WARNING="$WARNING_COLOR[WARNING]$NO_COLOR:"

HEADER_BEGIN="$HEADER_COLOR--------------------"
HEADER_END="--------------------$NO_COLOR"

# ------------------------------------------------------------------------------
#                                  Display Help
# ------------------------------------------------------------------------------

show_help() {
	echo "Usage: $0 [OPTION]"
	echo "Control the Docker Compose environment with a local testnet."
	echo
	echo "Options:"
	echo "  -r, --remove      Remove all related containers and volumes, including the local testnet."
	echo "  -s, --start       Start the Docker environment with the local testnet."
	echo "  --no-frontend     Do not start the frontend container."
	echo
	echo "  -h, --help        Display this help message"
	echo
	echo "Specifying both options will remove all container resources and then start the environment."
}

# ------------------------------------------------------------------------------
#                          Parse command line arguments
# ------------------------------------------------------------------------------

remove=false
start=false
include_frontend=true
show_help=false

localnode="local-testnet-postgres"
graphql="local-testnet-indexer-api"

base_compose="compose.yaml"
localnode_compose="compose.localnode.yaml"
frontend_compose="compose.frontend.yaml"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
	case $1 in
	--remove) remove=true ;;
	-r) remove=true ;;
	--start) start=true ;;
	-s) start=true ;;
	--no-frontend) include_frontend=false ;;
	-h | --help)
		show_help
		exit 0
		;;
	*)
		echo "Unknown parameter passed: $1"
		show_help
		exit 1
		;;
	esac
	shift
done

compose_args=""

if [ "$include_frontend" = true ]; then
	compose_args="-f $base_compose -f $localnode_compose -f $frontend_compose"
else
	compose_args="-f $base_compose -f $localnode_compose"
fi

# ------------------------------------------------------------------------------
#                             Main script functions
# ------------------------------------------------------------------------------

remove_container_resources() {
	echo -e "$HEADER_BEGIN----- Removing container resources -----$HEADER_END"
	echo "Removing the remaining containers and volumes..."
	docker compose $compose_args down --volumes

	echo "Removing local testnet containers and volumes..."
	docker stop $localnode $graphql
	docker rm -f $localnode $graphql --volumes 2>/dev/null
}

start_containers() {
	echo -e "$HEADER_BEGIN-------- Starting containers -----------$HEADER_END"
	echo "Starting local testnet..."
	docker compose $compose_args up -d --force-recreate
}

# ------------------------------------------------------------------------------
#                       Ensure the publish payloads exist
# ------------------------------------------------------------------------------
ensure_publish_payloads_exist() {
	source $docker_dir/.env

	# Compile the Move contracts in the form of JSON publish payloads, with the output directory
	# in a place where the Docker publisher container looks so that they can be used to publish
	# the Move modules on the local testnet without having to compile them in the container.
	# This action will always be run in CI because the files won't exist on the GitHub runner since
	# we have a `.gitignore` set up to ignore the JSON files.
	# But locally it will only be skipped if the Move modules directory has not been changed, according
	# to the git diff.
	should_compile=false
	json_output_dir="$docker_dir/aptos-node/json"
	emojicoin_json_path="$json_output_dir/publish-emojicoin_dot_fun.json"
	rewards_json_path="$json_output_dir/publish-rewards.json"

	if [ ! -f "$emojicoin_json_path" ] || [ ! -f "$rewards_json_path" ]; then
		echo "Move JSON publish payloads not found- recompiling the Move modules on the host machine."
		should_compile=true
	else
		if git diff --quiet origin/main -- src/move/; then
			msg="$INFO The Move modules have not been changed- using the existing JSON publish payloads."
			echo -e "$msg"
		else
			msg="$WARNING Files in the Move directory have been changed- recompiling the Move modules."
			echo -e "$msg"
			should_compile=true
		fi
	fi

	if [ "$should_compile" = true ]; then
		address="$EMOJICOIN_MODULE_ADDRESS"
		aptos move build-publish-payload \
			--assume-yes \
			--private-key $PUBLISHER_PK \
			--encoding hex \
			--named-addresses emojicoin_dot_fun=$address \
			--override-size-check \
			--included-artifacts none \
			--package-dir $move_dir/emojicoin_dot_fun/ \
			--json-output-file $emojicoin_json_path &

		aptos move build-publish-payload \
			--assume-yes \
			--private-key $PUBLISHER_PK \
			--encoding hex \
			--named-addresses rewards=$address,integrator=$address,emojicoin_dot_fun=$address \
			--override-size-check \
			--included-artifacts none \
			--package-dir $move_dir/rewards/ \
			--json-output-file $rewards_json_path
	fi
}

# ------------------------------------------------------------------------------
#                Remove and/or start the test harness containers
# ------------------------------------------------------------------------------
if [ "$remove" = true ]; then
	remove_container_resources
fi

if [ "$start" = true ]; then
	ensure_publish_payloads_exist
	start_containers
fi
