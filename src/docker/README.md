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
docker compose -f compose.yaml -f compose.local.yaml up
```
