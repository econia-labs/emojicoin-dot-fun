#!/bin/bash
# cspell:word localnet
# cspell:word toplevel

root_dir=$(git rev-parse --show-toplevel)
docker_dir=$root_dir/src/docker
sh_utils=$root_dir/src/sh/utils

source $sh_utils/colors.sh

yes=''
reset_localnet=''

################################################################################
#                                 Display help                                 #
################################################################################

display_help_option() {
	local option=$1
	local description=$2

	indented_option=$(printf "%-24s" "$option")
	colored_option=$(highlight_text "$indented_option")
	printf "  $colored_option %s\n" "$description"
}

show_help() {
	echo
	executable=$(debug_text $0)
	options=$(very_dim_text "[OPTIONS]")
	echo "Usage: $executable $options"
	echo
	echo 'Prune the `emojicoin-dot-fun` Docker Compose environment.'
	echo 'This will delete all `emojicoin` container and volume data.'
	echo
	echo "Options:"
	display_help_option \
		"-y, --yes" \
		"Skip the confirmation prompt and prune."
	display_help_option \
		"-r, --reset-localnet" \
		"Reset the localnet data as well."
	echo
	display_help_option \
		"-h, --help" \
		"Display this help message."
}

################################################################################
#                           Parse command line args                            #
################################################################################

while [[ $# -gt 0 ]]; do
	case $1 in
	--yes) yes=true ;;
	-y) yes=true ;;
	-r) reset_localnet=true ;;
	--reset-localnet) reset_localnet=true ;;
	-h)
		show_help
		exit 0
		;;
	--help)
		show_help
		exit 0
		;;
	*)
		log_error "Unknown parameter passed: $1"
		show_help
		exit 1
		;;
	esac
	shift
done

################################################################################
#                                Prompt the user                               #
################################################################################

if [ -z "$yes" ]; then
	reset_msg=""
	if [ -n "$reset_localnet" ]; then
		reset_msg="force restart the localnet and delete"
	else
		reset_msg="delete"
	fi
	msg="This will $reset_msg all \`emojicoin\`"
	msg+=" container and volume data."
	log_warning "$msg"
	msg="Are you sure you want to continue? (y/n)"
	warning=$(log_warning "$msg")

	input='n'
	read -r -p "$warning " input

	if [[ $input == "y" || $input == "Y" || $input == "yes" ]]; then
		yes=true
	fi
fi

if [ -z "$yes" ]; then
	log_info "Exiting..."
	exit 0
fi

msg="Pruning things...🗑️"
log_info "$msg" $'\n'

# Store the original working directory so we can return to it upon any exit.
original_cwd=$(pwd)

function cleanup() {
	cd "$original_cwd" || exit 1
}

# Call `cleanup` on exit.
trap cleanup EXIT

################################################################################
#                                     Prune                                    #
################################################################################

cd $docker_dir

postgres="local-testnet-postgres"
api="local-testnet-indexer-api"

docker stop -t 1 $postgres 2>/dev/null || echo "$postgres"
docker stop -t 1 $api 2>/dev/null || echo "$api"
docker rm -f $postgres --volumes 2>/dev/null
docker rm -f $api 2>/dev/null
docker volume rm -f $postgres-data

if [ -n "$reset_localnet" ]; then
	# In order to avoid having to run `sudo rm -rf src/docker/localnet/.aptos`,
	# we can run an ephemeral `docker` container that bind-mounts `localnet`.
	# Bind-mounting the parent of `.aptos` gives the container the right to
	# delete it.
	docker run --rm -v "$docker_dir/localnet:/pwd" busybox rm -rf /pwd/.aptos
	docker compose -f compose.local.yaml down --volumes
else
	docker compose -f compose.local.yaml down
fi
