# Reproducing the TypeScript `symbol-emojis.json` data

To reproduce the data in the TypeScript JSON data file `symbol-emojis.json`
`cd` to the root of the repo then run the following commands.

```shell
cd src/python/move_emojis
poetry install
poetry run python -m scripts.generate_code
```
