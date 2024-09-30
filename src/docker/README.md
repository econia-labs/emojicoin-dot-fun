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

Before you run the local testnet, ensure that your Docker Desktop settings are
correct. In your Docker Desktop settings, you must have enabled:

- Resources -> Enable host networking

If you're using WSL 2, you must also enable both of these settings:

- Use the WSL 2 based engine ... -> Add the *.docker.internal names ...

Now your container can run the localnet on the host network:

```shell
docker compose -f compose.local.yaml up
```

The `compose.local.yaml` file `include`s the `compose.yaml` file and
overwrites some settings like the order of dependencies for the services.

Note the order of the `include:` items in `compose.local.yaml` and where
the config overrides are placed.

## Running the frontend container

If you want to include the `frontend` container to run the frontend in a
`docker` container, without running a local testnet:

```shell
docker compose -f compose.yaml up --profile frontend
```

Note that the frontend is *not* included in the default services.

## Force restart the localnet

In order to simplify the pruning process for the localnet, you can simply run
the [prune.sh] script. It will remove all data, containers, and volumes in the
`emojicoin-dot-fun` project, including removing the local testnet data.

```shell
# Ensure you're in the right directory:
cd src/docker/utils

# With a prompt for removal:
./prune.sh

# To skip the prompt, run any of these:
./prune.sh -y
./prune.sh --yes
./prune.sh -r
./prune.sh --reset-localnet
```

### Why not just pass `--force-restart`?

The CLI simply uses a directory for all localnet test data. By default it's
located at `~/.aptos/testnet`. Since it's not a mounted volume, it is ephemeral
and will be removed on each container restart. This is very unintuitive behavior
that results in corrupt indexer data each time you restart the `localnet`
container unless you explicitly prune the database volumes.

To fix this, the data directory in the container is created as a bind-mount to
the host's `localnet/.aptos` folder, making the data persist between container
restarts.

However, if you try to force restart the node in its entrypoint command with
`--force-restart`, you'll get a `Device or resource busy` error. Since
there's no reason we need to run `--force-restart` at runtime, the best way to
handle a restart is by removing the localnet test data directory prior to each
run as well as pruning all the related volumes, which is what [prune.sh] does.

[prune.sh]: ./utils/prune.sh
