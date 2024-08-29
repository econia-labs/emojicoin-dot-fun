#!/bin/bash
# cspell:word toplevel
# cspell:word localnode
# cspell:word buildable

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

LIGHT_PURPLE='\033[1;35m'
NO_COLOR='\033[0m'

HEADER_BEGIN="$LIGHT_PURPLE--------------------"
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
	echo "  -j, --json        Publish the smart contracts with JSON publish payload files."
	echo "  -c, --compile     Publish the smart contracts by compiling at container build time."
	echo "  --no-compile      Do not build the smart contract publish payloads if they already exist."
	echo "  --no-frontend     Do not start the frontend container."
	echo
	echo "  -h, --help        Display this help message"
	echo
	echo "Specifying both options will remove all container resources and then start the environment."
	echo "You must specify either the JSON or compile option to publish the smart contracts."
}

# ------------------------------------------------------------------------------
#                          Parse command line arguments
# ------------------------------------------------------------------------------

remove=false
start=false
include_frontend=true
show_help=false
publish_json=false
publish_compile=false
no_cache=false
no_compile=false
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
	--json) publish_json=true ;;
	-j) publish_json=true ;;
	--compile) publish_compile=true ;;
	-c) publish_compile=true ;;
	--no-compile) no_compile=true ;;
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
#                                Run the script
# ------------------------------------------------------------------------------

if [ "$publish_json" = true ]; then
	export PUBLISH_TYPE="json"
elif [ "$publish_compile" = true ]; then
	export PUBLISH_TYPE="compile"
else
	if [ "$build" = true ] || [ "$start" = true ]; then
		echo "Must specify either JSON or compile option."
		show_help
		exit 1
	fi
fi

if [ "$publish_json" = true ] && [ "$publish_compile" = true ]; then
	echo "Cannot specify both JSON and compile options."
	show_help
	exit 1
fi

source $docker_dir/.env

# The publish type ("json" or "compile") are specified as environment variables
# to be used in the Dockerfile. We set them here before building the containers.
if [ "$PUBLISH_TYPE" = "json" ]; then
	echo

	skip_compilation=false
	if [ "$no_compile" = true ]; then
		if [ ! aptos-node/json/publish-rewards.json ] || [ ! aptos-node/json/publish-emojicoin_dot_fun.json ]; then
			echo "JSON publish payloads not found."
			echo "Ignoring $(--no-compile) and building the JSON publish payloads on the host machine."
		else
			echo "JSON publish payloads found. Skipping compilation."
			skip_compilation=true
		fi
	else
		echo "Publish type is set to JSON. Building the JSON publish payloads on the host machine."
	fi

	if [ "$skip_compilation" = false ]; then
		addr=$EMOJICOIN_MODULE_ADDRESS

		aptos move build-publish-payload \
			--assume-yes \
			--private-key $PUBLISHER_PK \
			--encoding hex \
			--named-addresses emojicoin_dot_fun=$addr \
			--override-size-check \
			--included-artifacts none \
			--package-dir $move_dir/emojicoin_dot_fun/ \
			--json-output-file aptos-node/json/publish-emojicoin_dot_fun.json &

		aptos move build-publish-payload \
			--assume-yes \
			--private-key $PUBLISHER_PK \
			--encoding hex \
			--named-addresses rewards=$addr,integrator=$addr,emojicoin_dot_fun=$addr \
			--override-size-check \
			--included-artifacts none \
			--package-dir $move_dir/rewards/ \
			--json-output-file aptos-node/json/publish-rewards.json
	fi
fi

if [ "$remove" = true ]; then
	remove_container_resources
fi

if [ "$start" = true ]; then
	start_containers
fi
