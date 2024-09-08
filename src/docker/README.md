<!-- cspell:word localnet -->

# Running the emojicoin dot fun indexer with Docker

Ensure you've successfully pulled all submodule repositories required to
build the processor, otherwise you will get errors.

```shell
git submodule update --init --recursive
```

Ensure that your environment variables are set, typically with an `.env`
file that mirrors the `example.local.env` or `example.testnet.env`, depending on
which environment you're running in.

Then you can follow the simple examples below showing how to run the processor
with and without an Aptos local fullnode.

## Run the indexer processor by itself

```shell
docker compose -f compose.yaml up
```

## Run a local Aptos fullnode as well

```shell
docker compose -f compose.local.yaml up
```

The `compose.local.yaml` file `include`s the `compose.yaml` file and
overwrites some settings like the order of dependencies for the services.

See `localnet-publisher/processor-override.yaml` and note the order of the
`include:` items in `compose.local.yaml`

## Running the frontend container

If you want to include the `frontend` container to run the frontend in a
`docker` container, without running a local testnet:

```shell
docker compose -f compose.yaml up --profile frontend
```

Note that the frontend is *not* included in the default services.

## Forcing a restart with the `aptos-cli` container

If you want to force a restart when running the local testnet, you can set the
environment variable `FORCE_RESTART` to anything other than an empty string,
and it will pass `--force-restart` to the container's entrypoint command.

```shell
FORCE_RESTART=true docker compose -f compose.local.yaml up
```

Note that this will *not* coordinate pruning/removing the emojicoin indexer
processor volume/database data. See the section about [using the helper script]
for more info.

## Using the helper script to orchestrate restarting containers and volumes

When you restart the local testnet data with a `--force-restart` flag, the
emojicoin indexer processor doesn't also necessarily restart, so its volume
data will immediately be out of sync with the local testnet blockchain state.

This will result in erroneous behavior- sometimes not even immediately halting
but waiting or hanging with no discernible reason. To ensure that they are
always synced, you can use the helper script that coordinates all of the
relevant services and their volumes.

```shell
# Removes the local testnet volumes and the emojicoin indexer volumes, including
# the frontend container. See the script for more details.
./src/docker/utils/helper.sh --remove --local --frontend
```

If you'd like to see what the script will do before actually running it, you
can pass `--dry-run` to preview the script execution without running it:

<!-- markdownlint-disable MD013 -->

```shell
>> ./src/docker/utils/helper.sh --remove --local --start --dry-run
[DEBUG] source src/docker/example.local.env
[DEBUG] export FORCE_RESTART=true
[INFO] Cleaning up emojicoin containers and volumes...
[DEBUG] docker compose -f src/docker/compose.local.yaml down --volumes --remove-orphans
[INFO] Cleaning up the local testnet containers and volumes...
[DEBUG] docker stop local-testnet-postgres local-testnet-indexer-api
[DEBUG] docker rm -f local-testnet-postgres local-testnet-indexer-api --volumes
[INFO] Starting emojicoin containers and volumes...
[DEBUG] docker compose -f src/docker/compose.local.yaml up
```

<!-- markdownlint-enable MD013 -->

Run the help command to see more info.

```shell
./src/docker/utils/helper.sh --help
```

[using the helper script]: #using-the-helper-script-to-orchestrate-restarting-containers-and-volumes
