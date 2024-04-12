# Description

The scripts in this directory are intended to ingest the unicode list of all
emojis and each of their possible iterations, and then convert them to Move
hex strings with corresponding Move-friendly const variable names.

The `data/emoji-test.txt` and `data/emoji-zwj-sequences.txt` files are from
the [Unicode emoji data files].

## Install the poetry environment

```shell
poetry install
```

## Run `emojis_to_const.py` with the command

```shell
poetry run -m emojis_to_const
```

And you will see two new files:

- `data/viable_emojis.json`
- `move_consts.txt`

### Viable Emojis

The `data/viable_emojis.json` file is solely for viewing purposes locally to
see how emojis are filtered based on their hex string byte size.

Please see the [Unicode emoji index] to understand more how `qualifications`
and `zwj sequences` work.

### Move `const` hex strings output

The generated `move_consts.txt` file contains the text we copy over to a Move
contract to populate the contract with all viable emoji hex strings.

[unicode emoji data files]: https://unicode.org/Public/emoji/latest/
[unicode emoji index]: https://unicode.org/emoji/charts/index.html
