#!/bin/bash
# cspell:word localnet
# cspell:word toplevel

# Resolve the docker directory to its absolute path to avoid issues.
root_dir=$(git rev-parse --show-toplevel)
docker_dir="$root_dir/src/docker"
sh_utils_dir="$root_dir/src/sh/utils"

source "$sh_utils_dir/colors.sh"

# Store the original working directory to return to upon exit.
original_cwd=$(pwd)

function cleanup() {
	cd "$original_cwd" || exit 1
}

# Ensure cleanup function is called on exit.
trap cleanup EXIT

cd "$docker_dir" || exit 1

display_help_option() {
	local option=$1
	local description=$2

	indented_option=$(printf "%-16s" "$option")
	colored_option=$(highlight_text "$indented_option")
	printf "  $colored_option %s\n" "$description"
}

show_help() {
	remove_msg="Remove all volumes related to this project."
	remove_msg="$remove_msg This will run before --start."

	echo "Usage: $0 [OPTION]"
	echo 'Control the `emojicoin-dot-fun` Docker Compose environment.'
	echo
	echo "Options:"
	display_help_option \
		"-f, --frontend" \
		"Include the frontend container."
	display_help_option \
		"-s, --start" \
		"Start all containers related to this project."
	display_help_option \
		"-r, --remove" \
		"$remove_msg"
	display_help_option \
		"-l, --local" \
		"Set the network to local and use a local testnet."
	display_help_option \
		"-d, --dry-run" \
		"Print the commands that would be run without executing them."
	display_help_option \
		"--force-restart" \
		'Force containers and volumes to restart. Alias of "--remove --start"'
	echo
	display_help_option \
		"-h, --help" \
		"Display this help message."
}

remove_volumes=""
frontend=""
localnet=""
start=""
dry_run=""

if [ -z "$1" ]; then
	show_help
	exit 1
fi

# Parse command line arguments.
while [[ $# -gt 0 ]]; do
	case $1 in
	--remove) remove_volumes=true ;;
	-r) remove_volumes=true ;;
	--start) start=true ;;
	-s) start=true ;;
	--local) localnet=true ;;
	-l) localnet=true ;;
	--frontend) frontend=true ;;
	-f) frontend=true ;;
	--dry-run) dry_run=true ;;
	-d) dry_run=true ;;
	--force-restart) force_restart=true ;;
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

if [[ -n $force_restart ]]; then
	remove_volumes=true
	start=true
fi

network=""
if [[ -n $localnet ]]; then
	network="local"
else
	network="testnet"
fi

compose_file="-f $docker_dir/compose.yaml"
if [[ -n $localnet ]]; then
	compose_file="-f $docker_dir/compose.local.yaml"
fi

# Export environment variables.
set -a
if [[ -f "$docker_dir/.env" ]]; then
	if [[ -n $dry_run ]]; then
		log_debug source "$docker_dir/example.$network.env"
	else
		source "$docker_dir/example.$network.env"
	fi
fi
if [[ $network == "local" && -n $remove_volumes ]]; then
	if [[ -n $dry_run ]]; then
		log_debug export FORCE_RESTART="true"
	else
		export FORCE_RESTART="true"
	fi
fi
set +a

docker_compose() {
	local compose_action="$1"
	shift

	if [[ -n $dry_run ]]; then
		log_debug docker compose \
			$compose_file \
			${frontend:+--profile frontend} \
			"$compose_action" "$@"
	else
		docker compose \
			$compose_file \
			${frontend:+--profile frontend} \
			"$compose_action" "$@"
	fi
}

if [[ -n $remove_volumes ]]; then
	log_info "Cleaning up emojicoin containers and volumes..."
	docker_compose down --volumes --remove-orphans

	if [[ -n $localnet ]]; then
		node_indexer_db="local-testnet-postgres"
		graphql="local-testnet-indexer-api"

		log_info "Cleaning up the local testnet containers and volumes..."
		# Suppress error output since we don't care if these containers are
		# already running. Just remove them if they are.
		if [[ -n $dry_run ]]; then
			log_debug docker stop $node_indexer_db $graphql
			log_debug docker rm -f $node_indexer_db $graphql --volumes
		else
			docker stop $node_indexer_db $graphql 2>/dev/null || true
			docker rm -f $node_indexer_db $graphql --volumes 2>/dev/null || true
		fi
	fi
fi

if [[ -n $start ]]; then
	log_info "Starting emojicoin containers and volumes..."
	docker_compose up
fi
