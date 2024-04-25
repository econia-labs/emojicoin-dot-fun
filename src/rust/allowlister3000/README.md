# AllowLister3K

AllowLister3K is a simple web server that will respond with either `true` or
`false`, depending on wether the provided 32-byte address is present in its
allow list or not.

## Running

To run the AllowLister3K, you first need to set the `ALLOWLIST_FILE`
environment variable to the path of the file containing the allowlist. You can
then start the program by running `cargo run --release`.

To update the allowlist, add the desired address(es) to the allowlist file.
Then, **restart the program**.

## Allowlist format

The allowlist file format is just a plain text file with one address per line.

## Address format

Addresses must start with `0x`, and can have any amount of leading zeros.
AllowLister3K does not check for invalid hex strings. AllowLister3K checks that
incoming addresses over the network aren't bigger than 66 characters (`0x` +
64). This check is not performed on the allowlist file.

## HTTP requests

To make a request to AllowLister3K, simply make a GET request to `/address`
where `address` is the address in the correct format you want to check.
