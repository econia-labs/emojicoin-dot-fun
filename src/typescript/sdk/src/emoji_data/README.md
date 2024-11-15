# Reproducing the TypeScript `symbol-emojis.json` data

To reproduce the data in the TypeScript JSON data file `symbol-emojis.json`
`cd` to the root of the repo then run the following commands.

```shell
cd src/python/move_emojis
poetry install
poetry run python -m scripts.generate_code
```

Note that the `symbol-names.json` and `chat-names.json` are not duplicated data;
they're merely used for type resolution in TypeScript, since TypeScript can't
resolve to actual values when resolving to the value field in an imported JSON
`[key]: value` type.
