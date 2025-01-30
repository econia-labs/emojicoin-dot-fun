#!/bin/bash
# cspell:word obase

# Strip the leading "0x" from the address and remove all leading zeros.
function standardize_address() {
	local str="${1#0x}"
	echo "obase=16; $((16#$str))" | bc
}

# Compare two addresses by standardizing them first.
function compare_addresses() {
	local addr1=$(standardize_address "$1")
	local addr2=$(standardize_address "$2")
	[[ $addr1 == $addr2 ]]
}
