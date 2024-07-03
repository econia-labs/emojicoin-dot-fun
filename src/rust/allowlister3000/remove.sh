#!/bin/sh

if [ "$#" -eq 1 ]; then
	if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
		echo "Remove address from allowlister file, creating a backup file"
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
	echo "File $2 not found"
	echo "Usage: $0 <ADDRESS> <FILE>"
	exit 2
fi

sed -i.bak "/$1/d" "$2"

pkill -USR1 allowlister3000 >/dev/null || :
