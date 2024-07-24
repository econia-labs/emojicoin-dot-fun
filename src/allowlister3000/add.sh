#!/bin/sh
#
if [ "$#" -eq 1 ]; then
	if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
		echo "Add address to allowlister file"
		echo "Usage: $0 <ADDRESS> <FILE>"
		exit 0
	fi
fi

if [ "$#" -ne 2 ]; then
	echo "Illegal number of parameters"
	echo "Usage: $0 <ADDRESS> <FILE>"
	exit 1
fi

if [ ! -f "$2" ]; then
	echo "File $2 not found, creating"
fi

echo "$1" >>"$2"

pkill -USR1 allowlister3000 >/dev/null || :
