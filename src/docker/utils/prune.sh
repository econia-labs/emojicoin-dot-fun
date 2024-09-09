#!/bin/bash

root_dir=$(git rev-parse --show-toplevel)
docker_dir=$root_dir/src/docker
sh_utils=$root_dir/src/sh/utils

source $sh_utils/colors.sh

yes=''

################################################################################
#                                 Display help                                 #
################################################################################

display_help_option() {
	local option=$1
	local description=$2

	indented_option=$(printf "%-16s" "$option")
	colored_option=$(highlight_text "$indented_option")
	printf "  $colored_option %s\n" "$description"
}

show_help() {
	echo "Usage: $0 [COMMAND] [OPTION]"
	echo 'Prune the `emojicoin-dot-fun` Docker Compose environment.'
	echo
	echo "Options:"
    display_help_option \
        "-y, --yes" \
        "Skip the confirmation prompt and force restart/delete the localnet."
    display_help_option \
        "-f, --force-restart" \
        "Skip the confirmation prompt and force restart/delete the localnet."
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
    --force-restart) yes=true ;;
    -f) yes=true ;;
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
prompted=false
if [ -z "$yes" ]; then
    prompted=true
    msg='This script will force restart the localnet and delete all `emojicoin`'
    msg+=" container and volume data."
    log_warning "$msg"
    msg="Are you sure you want to continue? (y/n)"
    warning=$(log_warning "$msg")

    input='n'
    read -r -p "$warning " input

    if [[ "$input" == "y" || "$input" == "Y" || "$input" == "yes" ]]; then
        yes=true
    fi
fi

if [ -z "$yes" ]; then
    log_info "Exiting..."
    exit 0
fi

msg="Removing all containers, volumes, and localnet data."
log_info "$msg" $'\n'


################################################################################
#                                     Prune                                    #
################################################################################
docker compose -f compose.local.yaml down --volumes

postgres="local-testnet-postgres"
api="local-testnet-indexer-api"

docker stop -t 1 $postgres 2>/dev/null || echo "$postgres"
docker stop -t 1 $api 2>/dev/null || echo "$api"
docker rm -f $postgres --volumes 2>/dev/null
docker rm -f $api 2>/dev/null
docker volume rm -f $postgres-data

rm -rf $docker_dir/localnet/.aptos/*
