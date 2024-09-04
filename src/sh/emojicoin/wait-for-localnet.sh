#!/bin/bash

check_endpoint() {
	curl -s -f -o /dev/null http://localhost:8070/
}

while ! check_endpoint; do
	echo "Waiting for the local testnet to be up..."
	sleep "$seconds"
done
