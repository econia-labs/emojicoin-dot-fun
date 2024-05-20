# emojicoin dot fun

<!-- markdownlint-disable MD036 -->

*Sponsored by a grant from the Aptos Foundation*

## Cloning this repository's submodules

This repository uses a closed-source implementation of the TradingView charting
library for the production website.

If you don't have access to TradingView's `charting_library` repository, please
run the command below to clone the appropriate submodules:

```shell
git submodule update --init --recursive src/inbox
```

If you do have access to the `charting_library` repository:
```shell
git submodule update --init --recursive
```

<!-- markdownlint-enable MD036 -->

[![pre-commit shield]][pre-commit repo]

[pre-commit repo]: https://github.com/pre-commit/pre-commit
[pre-commit shield]: https://img.shields.io/badge/pre--commit-enabled-brightgreen?logo=pre-commit
