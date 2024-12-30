<!-- cspell:word permissioned -->

# `emojicoin-dot-fun` market metadata

This package contains functions to set and get metadata about markets in a
permissioned way.

## Publish commands

Set variables:

```sh
MARKET_METADATA=0xaaa...
EMOJICOIN_DOT_FUN=0xbbb...
PROFILE=my-profile
```

Publish:

```sh
NAMED_ADDRESSES=$(
    printf "%s,%s" \
        "market_metadata=$MARKET_METADATA" \
        "emojicoin_dot_fun=$EMOJICOIN_DOT_FUN"
)
aptos move publish \
    --assume-yes \
    --move-2 \
    --named-addresses $NAMED_ADDRESSES \
    --profile $PROFILE
```

## Add admin

```sh
NEW_ADMIN=0xccc...
MARKET_METADATA=0xaaa...
PROFILE_NAME=my-profile

aptos move run \
  --args address:$NEW_ADMIN \
  --function-id $MARKET_METADATA::emojicoin_dot_fun_market_metadata::add_admin \
  --profile $PROFILE_NAME
```

## Remove admin

```sh
ADMIN_TO_REMOVE=0xccc...
MARKET_METADATA=0xaaa...
PROFILE_NAME=my-profile

aptos move run \
  --args address:$ADMIN_TO_REMOVE \
  --function-id \
    $MARKET_METADATA::emojicoin_dot_fun_market_metadata::remove_admin \
  --profile $PROFILE_NAME
```

## Add properties

> If market metadata entry does not exist, create an empty entry. Then, add
> market properties, overwriting existing properties if they already exist.

```sh
MODULE=emojicoin_dot_fun_market_metadata
FUNCTION=add_market_properties
PACKAGE_ADDRESS=0xabc...
MARKET_ADDRESS=0xdef...
PROFILE=my-profile
PROPERTIES='"X profile","Website","Telegram"'
VALUES='"foo","bar","baz"'
```

```sh
aptos move run \
    --args \
        "address:$MARKET_ADDRESS" \
        'string:['$PROPERTIES']' \
        'string:['$VALUES']' \
    --function-id "$PACKAGE_ADDRESS::$MODULE::$FUNCTION" \
    --profile $PROFILE
```

## Remove properties

> If the market has an entry, remove all specified keys. If the market has no
> entries after removing the keys, remove the market from the metadata registry.

```sh
MODULE=emojicoin_dot_fun_market_metadata
FUNCTION=remove_market_properties
PACKAGE_ADDRESS=0xabc...
MARKET_ADDRESS=0xdef...
PROFILE=my-profile
PROPERTIES='"X profile","Website"'
```

```sh
aptos move run \
    --args "address:$MARKET_ADDRESS" 'string:['$PROPERTIES']' \
    --function-id "$PACKAGE_ADDRESS::$MODULE::$FUNCTION" \
    --profile $PROFILE
```

## Set properties

> Clear all properties for the given market if it has any, then set the supplied
> values. If there are no supplied key-value pairs, remove the market's entry
> from the metadata registry.

```sh
MODULE=emojicoin_dot_fun_market_metadata
FUNCTION=set_market_properties
PACKAGE_ADDRESS=0xabc...
MARKET_ADDRESS=0xdef...
PROFILE=my-profile
PROPERTIES='"X profile","Website","Telegram"'
VALUES='"foo","bar","baz"'
```

```sh
aptos move run \
    --args \
        "address:$MARKET_ADDRESS" \
        'string:['$PROPERTIES']' \
        'string:['$VALUES']' \
    --function-id "$PACKAGE_ADDRESS::$MODULE::$FUNCTION" \
    --profile $PROFILE
```

## Emojicoin special properties

The `emojicoin dot fun` frontend will only consider the following values:

- `Discord`
- `Telegram`
- `Website`
- `X profile`

For example, to set the website to `https://example.org` and the x profile to
`0xabcd` for the `0xabcd` market, you can use the following variables:

```sh
PROPERTIES='"Website","X profile"'
VALUES='"https://example.org","https://x.com/0xabcd"'
```
