# Reproducing the TypeScript `symbol-emojis.json` data

To reproduce the data in the TypeScript JSON data file `symbol-emojis.json`
`cd` to the root of the repo then run the following commands.

```shell
cd src/python/move_emojis
poetry install
poetry run python -m scripts.generate_code
```

You should now have emoji data in
`src/python/move_emojis/data/symbol-emojis.json`.

Ensure you're in `src/python/move_emojis` still.

To get the new data run the following python code:

```python
import json

fp = 'data/symbol-emojis.json'
new_fp = 'data/symbol-emojis-less-data.json'

emoji_data = json.load(open(fp, 'r'))

# Use the name as the key still but only keep the encoded UTF-8 emoji field as
# each entry's value.
new_data = { k: v['emoji'] for k, v in emoji_data.items() }

# Sort the dictionary by the key.
new_data = sorted(new_data.items(), key=lambda x: x[0])

# Rewrite it back into a dictionary type.
new_data = dict(list(new_data))

# Prettify and dump the new dictionary data to a new file.
json.dump(new_data, open(new_fp, 'w'), indent=2)
```
