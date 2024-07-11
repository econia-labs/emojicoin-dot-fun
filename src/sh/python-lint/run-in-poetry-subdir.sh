#!/bin/bash
# cspell:word autoflake
# cspell:word realpath
# cspell:word toplevel
# cspell:word venv

# Capture the first argument, which is the command we're wrapping for
# the pre-commit hook.
COMMAND=$1
# Then skip it so we can pass "$@" to the command.
shift

# Capture and skip like above.
ERROR_MESSAGE=$1
shift

ABSOLUTE_PATHS=""

ROOT_DIR=$(git rev-parse --show-toplevel)
PYTHON_DIR="$ROOT_DIR/src/python"
POETRY_SUBDIRECTORY="$PYTHON_DIR/hooks"

# Convert all paths to absolute paths.
for path in "$@"; do
	ABSOLUTE="$ROOT_DIR/$path"
	ABSOLUTE_PATHS="$ABSOLUTE_PATHS $ABSOLUTE"
done

cd "$POETRY_SUBDIRECTORY" || exit 1

# Then run the script passed into this script, with the absolute paths.
# This is so we can define individual pre-commit hooks for each linter,
# each with their own output status codes.
fail="false"

eval $COMMAND $ABSOLUTE_PATHS || fail="true"

if [ "$fail" = "true" ]; then
	echo ''
	echo "$ERROR_MESSAGE"
	exit 1
fi

exit 0
