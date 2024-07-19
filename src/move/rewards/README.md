# `EmojicoinDotFunRewards`

This package provides an overloaded swap function that randomly rewards a fixed
percentage of swaps that exceed of an arbitrary volume. Funds are autonomously
disbursed from a resource account with an APT vault that can be topped off
permissionlessly.

Per the [undergassing docs], the winning path requires the most gas per the
final logical branch:

```move
let result = randomness::u64_range(0, WIN_PERCENTAGE_DENOMINATOR);
if (result < WIN_PERCENTAGE_NUMERATOR) {
    // If user wins ...
```

To view the bytecode result:

```sh
aptos move compile --dev
aptos move disassemble --bytecode-path \
    build/EmojicoinDotFunRewards/bytecode_modules/emojicoin_dot_fun_rewards.mv
```

Then inside `build/EmojicoinDotFunRewards/bytecode_modules`, open
`emojicoin_dot_fun_rewards.asm` and note:

```asm
B4:
	56: LdU64(0)
	57: LdConst[6](U64: [16, 39, 0, 0, 0, 0, 0, 0])
	58: Call randomness::u64_range(u64, u64): u64
	59: LdConst[7](U64: [231, 3, 0, 0, 0, 0, 0, 0])
	60: Lt
	61: BrFalse(85)
```

Here, the `false` (losing) branch is essentially an instant return, while the
`true` (winning) branch requires additional logic.

Note that even if the `BrFalse` instruction were to be exceptionally expensive
for the `false` branch, it would still not be able to make the losing path more
expensive in the general case, because the winning path *also* has a `BrFalse`
statement where the preferred case is the `false` outcome, specifically:

```move
let reward_amount = if (vault_balance < REWARD_AMOUNT_IN_OCTAS) vault_balance
    else REWARD_AMOUNT_IN_OCTAS;
```

Hence the winning path is necessarily more expensive than the losing path
because it contains all of the same instructions as the losing path, and more,
except in the extreme hypothetical edge case where:

1. `BrFalse` for the `false` branch is set absurdly high in a gas schedule
   update, such that its execution cost vastly exceeds all other instructions in
   the winning path combined.
2. The user is the last lottery winner, sweeping a vault that has less than the
   single rewards amount inside.

Yet even this can issue can be mitigated, by simply filling up the vault with
an integer number of standard reward amounts, because then the lottery will
never evaluate due to this statement:

```move
if (vault_balance == 0) return;
```

Then open `build/EmojicoinDotFunRewards/bytecode_modules/emojicoin_dot_fun_rewards.asm
[undergassing docs]: https://aptos.dev/en/build/smart-contracts/randomness#undergasing-attacks-and-how-to-prevent
