#!/bin/bash
# cspell:word pyproject
# cspell:word toplevel

original_cwd=$(pwd)

function cleanup() {
	cd "$original_cwd" || exit 1
}

# Ensure cleanup function is called on exit.
trap cleanup EXIT

ROOT_DIR=$(git rev-parse --show-toplevel)
PYTHON_DIR=$ROOT_DIR/src/python
POETRY_SUBDIRECTORY=$PYTHON_DIR/hooks
cd $POETRY_SUBDIRECTORY || exit 1

# In CI, we only ensure that the lock file is in sync with `pyproject.toml`.
# Poetry should already be installed at this point.
if [ "$GITHUB_ACTIONS" == "true" ]; then
	poetry check --lock || {
		echo 'Poetry lock file is out of date. Running `poetry lock --no-update`...'
		exit 1
	}
	echo 'Poetry dependencies in sync, skipping the rest of `poetry check`...'
	exit 0
fi

poetry --version >/dev/null 2>&1 || {
	echo "Poetry is not installed. Please install poetry to continue."
	exit 1
}

# Attempt to install the poetry dependencies.
poetry install --no-root || {
	echo "Poetry install failed."
	exit 1
}

# Check if `poetry.lock` is consistent with `pyproject.toml`.
# We run both commands in case their version of poetry doesn't
# support `poetry check --lock`.
poetry check --lock || poetry lock --check || {
	echo 'Poetry lock file is out of date. Running `poetry lock --no-update`...'
	poetry lock --no-update || {
		echo "Poetry lock failed."
		exit 1
	}
}

exit 0
