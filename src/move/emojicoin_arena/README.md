# Emojicoin Arena

## A note on psuedo-randomness

Since randomness is not supported in `init_module` per [`aptos-core` #15436],
psuedo-random proxies are used for the first crank. For a detailed rationale
that explains how this is effectively random in practice, see
[this `emojicoin-dot-fun` pull request comment].

[`aptos-core` #15436]: https://github.com/aptos-labs/aptos-core/issues/15436
[this `emojicoin-dot-fun` pull request comment]: https://github.com/econia-labs/emojicoin-dot-fun/pull/408#discussion_r1887856202


