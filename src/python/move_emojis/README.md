# Description

The scripts in this directory are intended to ingest the Unicode list of all
emojis and each of their possible iterations, and then convert them to Move
hex strings with corresponding Move-friendly const variable names.

The data files used are from the [Unicode emoji data files].

## Install the poetry environment

```shell
poetry install
```

## Run the generation script

```shell
poetry run -m emojis_to_const
```

### Viable Emojis

Please see the [Unicode emoji index] to understand more how `qualifications`
and `ZWJ sequences` work.

### Move `const` hex strings output

The generated `move_consts.txt` file contains the text we copy over to a Move
contract to populate the contract with all viable emoji hex strings.

[unicode emoji data files]: https://unicode.org/Public/emoji/latest/
[unicode emoji index]: https://unicode.org/emoji/charts/index.html
