# Overview

This directory contains all of the configuration files for the various
`pre-commit` hooks, linters, formatters, and workspace actions that this
repository uses.

This repository uses [`pre-commit`] hooks to perform various formatter and
linter verifications upon PR submission. In order to merge a PR, all hooks
must complete successfully.

## Adding new hooks

If you need to add a new hook to the list of `pre-commit` hooks, you can do so
by adding it into the `pre-commit-config.yaml` configuration file.

You can add a new hook either by [adding an existing plugin] or [creating a new
custom hook entirely][creating a new custom hook entirely].

## Running `pre-commit` hooks locally

To avoid your PR contributions failing the CI pipeline checks, you can install
the `pre-commit` hooks locally so that they automatically run right before you
add a new commit.

### Installing the required tools

To properly install the full `pre-commit` environment for this repository,
you'll need the following command-line tools:

- `git`, `python`, and `pip` (if you're not using `brew`)
- `poetry` and `pre-commit`

You can install all of these tools with your preferred package manager.
If you have `python` and `pip` installed already, you might use:

- `pip install poetry`
- `pip install pre-commit`

If you use `brew` on MacOS:

- `brew install poetry`
- `brew install pre-commit`

### Installing the `poetry` and `pre-commit` environments

You'll also need to set up your `poetry` and `pre-commit` environments for this
repository:

First ensure you're in the `emojicoin-dot-fun` repository at the root directory.
If you haven't cloned it yet, this might look something like:

```shell
git clone https://github.com/econia-labs/emojicoin-dot-fun
cd emojicoin-dot-fun
```

Then install the Python hooks `poetry` dependencies:

```shell
poetry install -C src/python/hooks --no-root
```

To install `pre-commit` to run prior to every time you `git commit ...` when
relevant files change:

```shell
pre-commit install --config cfg/pre-commit-config.yaml
```

Or you can run the hooks manually yourself against all files:

```shell
pre-commit run --all-files --config cfg/pre-commit-config.yaml
```

If you'd like to bypass `pre-commit` hooks for any reason once you've installed
our `pre-commit` hooks with `pre-commit-config.yaml`, you can bypass the checks
with:

```shell
git commit -m "Some change pre-commit hooks..." --no-verify
```

Note that this will allow you to push your commit onto your branch even if it
fails the `pre-commit` checks, but will likely fail in CI when it runs its
own `pre-commit` checks.

## Running the Python formatters

If you'd like to automate the Python formatting and linting as much as possible,
you can [run our Python format script].

[adding an existing plugin]: https://pre-commit.com/#plugins
[creating a new custom hook entirely]: https://pre-commit.com/#new-hooks
[run our python format script]: ../src/python/hooks/README.md#run-our-formatting-script
[`pre-commit`]: https://pre-commit.com
