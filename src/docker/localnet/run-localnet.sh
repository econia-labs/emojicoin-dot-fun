#!/bin/sh
# cspell:word localnet

# Note that the `--bind-to 0.0.0.0` flag is required to undo the default CLI
# behavior of binding to 127.0.0.1 since `aptos` v2.3.2.
# This is because the CLI is assumed to not be running inside a container, and
# issues can arise on Windows when binding to 0.0.0.0.
# See: https://github.com/aptos-labs/aptos-core/commit/d8eef35

# Reasoning behind using `exec`: https://stackoverflow.com/a/68578067/2142219
exec aptos node run-localnet \
	--assume-yes \
	--with-indexer-api \
	--bind-to 0.0.0.0
