<!-- cspell:word gamified -->

# Emojicoin arena

## Overview

Emojicoin arena is a gamified trading experience wherein users may trade back
and forth between two emojicoins during a set period known as a melee. The
two emojicoins for a given melee are selected using Aptos randomness, via a
crank mechanism that is called at the beginning of all public APIs.

A user enters a melee by swapping APT into one of two emojicoins, which are held
in escrow to enable constraints and to ease the indexing process. In particular,
a user can only hold one of the two emojicoins in escrow, and if they want to
swap to the other emojicoin, all of their holdings in escrow are swapped into
the other emojicoin. That is, holdings inside the escrow for a given melee are
all-or-nothing for one of the two emojicoins. If a user wishes to top off their
escrow with more emojicoins, they must swap into the kind they already hold.

A user can still hold any combination of the two emojicoins for a melee outside
of escrow in their Aptos wallet, via emojicoin dot fun core functionality.
However in this case they will miss out on:

1. Profit and loss (PnL) indexing and leaderboards that are enabled by escrow.
1. Ease of participation in the melee via the emojicoin arena feature page.
1. Rewards.

Rewards are loaded into and disbursed from a vault that anyone can fund and
anyone can claim from: when a user enters a melee, they can elect to lock in
their contributions, and if they do so, rewards from the vault will be combined
with their APT contribution to buy even more emojicoins. However, once a user
has locked in, they can not exit the melee until it has ended unless they first
pay back in full all APT rewards they have received from matching ("tap out").
Conversely, if a user does not lock in, they can exit at any time without
penalty.

Note that the matching percentage decreases as time goes on, such that if a user
locks in at the beginning of a melee they will be matched at a higher percentage
than if they lock in halfway through. This is to ensure that if users claim
rewards, they are in it for the long haul and will participate through to the
end of the melee. There is a ceiling on how much APT a user can be matched in
one given melee, but this value along with other parameters like the duration of
each melee are configurable.

## Terminology

1. **Melee**: A trading free-for-all between two randomly-selected emojicoins.
   New melees start periodically.
1. **Arena**: The venue inside of which melees take place.
1. **Escrow**: A sandbox of two emojicoins for a given melee.
1. **Entering**: Adding funds to an escrow.
1. **Locking in**: Accepting rewards upon entry.
1. **Topping off**: Adding more funds into an existing escrow.
1. **Exiting**: Withdrawing emojicoins from escrow.
1. **Tapping out**: Exiting a melee before it has ended when locked in, thus
   incurring the penalty of having to pay back all matched rewards.
1. **Match amount**: The amount of APT a user has been rewarded by locking in.

## Indexing

Structs and events are designed according to the principle of minimized onchain
indexing. That is, runtime state and event fields are designed to provide the
minimum amount of information required to enable comprehensive indexing via
writeset-aware offchain processing. In order words, the data model is designed
to enable full indexing using only writesets and events, with as few struct and
event fields as possible.

## Pseudo-randomness

Since randomness is not supported in `init_module` per [`aptos-core` #15436],
pseudo-random substitute implementations are used for the first crank. For a
detailed rationale that explains how this implementation is effectively random
in practice, see [this `emojicoin-dot-fun` pull request comment].

## Publish commands

Set variables:

```sh
EMOJICOIN_ARENA=0xaaa...
EMOJICOIN_DOT_FUN=0xbbb...
INTEGRATOR=0xccc...
PROFILE=my-profile
```

Publish:

```sh
NAMED_ADDRESSES=$(
    printf "%s,%s,%s" \
        "emojicoin_arena=$EMOJICOIN_ARENA" \
        "emojicoin_dot_fun=$EMOJICOIN_DOT_FUN" \
        "integrator=$INTEGRATOR"
)
aptos move publish \
    --assume-yes \
    --max-gas 500000 \
    --named-addresses $NAMED_ADDRESSES \
    --profile $PROFILE
```

Note that the `--max-gas` argument is required to prevent issues with the
simulator reporting that the `emojicoin_arena` module doesn't exist (even though
it shouldn't exist, because it's the one being published).

[this `emojicoin-dot-fun` pull request comment]: https://github.com/econia-labs/emojicoin-dot-fun/pull/408#discussion_r1887856202
[`aptos-core` #15436]: https://github.com/aptos-labs/aptos-core/issues/15436
