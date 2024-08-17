# `emojicoin-dot-fun` rewards

This package contains an overloaded version of the `swap` function for
`emojicoin-dot-fun`, `swap_with_rewards`, which gives users an opportunity for a
reward based on the amount of integrator fees they pay for their swap.

The rewards vault can be loaded up via the `fund_tiers` function.

Rewards distributions are random, and based on a probabilistic threshold
determined by the number of nominal rewards distributions expected for a given
nominal volume amount. See `reward_tiers` for more.

For ease of parameter modeling, named constants use values in `APT`, which are
converted to octas internally.

## Publish command

```sh
emojicoin_dot_fun=0xaaa...
integrator=0xbbb...
rewards=0xccc...
PROFILE=my-profile
```

```sh
aptos move publish \
    --assume-yes \
    --named-addresses \
        emojicoin_dot_fun=$EMOJICOIN_DOT_FUN,integrator=$INTEGRATOR,rewards=$REWARDS
```