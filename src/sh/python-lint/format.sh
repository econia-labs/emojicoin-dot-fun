#!/bin/sh
# cspell:word subdir
# cspell:word toplevel

ROOT_DIR=$(git rev-parse --show-toplevel)
DIR_ABS_PATH="$ROOT_DIR/src/sh/python-lint"

"$DIR_ABS_PATH/poetry-check.sh" && "$DIR_ABS_PATH/run-in-poetry-subdir.sh" "poetry run python -m format"
