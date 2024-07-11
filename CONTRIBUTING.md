<!--- cspell:word wxyz -->

# Contribution Guidelines

The key words `MUST`, `MUST NOT`, `REQUIRED`, `SHALL`, `SHALL NOT`, `SHOULD`,
`SHOULD NOT`, `RECOMMENDED`,  `MAY`, and `OPTIONAL` in this document are to be
interpreted as described in [RFC 2119].

These keywords `SHALL` be in `monospace` for ease of identification.

## Continuous integration and development

### `pre-commit`

This repository uses [`pre-commit`]. If you add a new filetype, you `SHOULD` add
a new [hook][pre-commit hook]. See [adding new hooks] for additional info.

In the `cfg/` directory are all of the `pre-commit` configuration files for
various hooks.

To set up your local workspace to use `pre-commit` or change any of the hook
configurations, please see the [pre-commit configuration README].

If you'd like to run our Python formatter locally to pass `pre-commit` checks,
you can [run our Python format script].

### GitHub actions

This repository uses [GitHub actions] to perform assorted status checks. If you
submit a pull request but do not [run `pre-commit`] then your pull request might
get blocked.

## Pull requests

This repository handles pull requests (PRs) using the [squash and merge method].

The Econia Labs team uses [Linear] for project management, such that PRs titles
start with tags of the form `[ECO-WXYZ]`. All PRs `MUST` include a tag, so if
you are submitting a PR as a community contributor, an Econia Labs member
`SHALL` change your PR title to include an auto-generated tag for internal
tracking purposes.

Pull requests `MUST` include a description written using imperative form that
"tells the repository what to do".

Pull request titles `MUST` also use imperative form, with the first letter after
the tag capitalized. For example `[ECO-WXYZ] Update something in the repo`.

Commit titles `SHOULD` use a similar format, but without a leading tag.

Resolution of a review comment `SHALL` be reserved for the reviewer who made the
comment, except for the case of suggestion acceptance, which automatically
results in the comment being marked as resolved.

## Move design phases

### Preliminary

1. During preliminary design phases, design `SHALL` emphasize abstraction and
   ease of testing, with optimizations in mind, for example, to reduce borrows.
1. Asserts `SHALL` be wrapped in helper functions to reduce failure tests.
1. Inlining `SHALL` only be used for functions that pass up a reference to a
   borrow out of global storage.

## Style

### General

1. Incorrect comments are worse than no comments.
1. Minimize maintainability dependencies.
1. Prefer compact code blocks, delimited by section comments rather than
   whitespace.
1. Titles `SHALL` use `Title Case` while headers `SHALL` use `Sentence case`.
1. Comments `SHALL` start with a capital letter and end with a period `.`, even
   if they are a single line.

### Markdown

1. [Reference links] are `REQUIRED` where possible, for readability and for ease
   of linting.
1. LaTeX display equations `SHALL` be delimited via a `math` fenced code block
   (note that you can render these locally using the `gitlab` delimiter for the
   [VS Code Markdown+Math extension]).

### Move

1. [Reference][move references] variable names `MUST` end in either `_ref` or
   `_ref_mut`, depending on mutability, unless they refer to
   [signers][move signer].
1. [Doc comments] `MUST` use Markdown syntax.
1. Variable names `SHOULD` be descriptive, with minor exceptions for scenarios
   like math utility functions.
1. Error code names `MUST` start with `E_`, for example `E_NOT_ENOUGH_BASE`.
1. Where possible, functions of the form `ensure_property_x()`, which ensure
   that some property holds, `SHALL` be favored over functions of the form
   `assert_property_x()`, which abort if a property does not hold.
1. Until a formatter or linter is available, lines `SHALL` break at 100
   characters per the [Move formatting guidelines][move format].
1. Events `SHALL` be titled in the form `Something`, as opposed to
   `SomethingEvent`, and `SHALL` be emitted v2-style, consistent with
   the [Aptos Framework v2 event refactors].

[adding new hooks]: ./cfg/README.md#adding-new-hooks
[aptos framework v2 event refactors]: https://github.com/aptos-foundation/AIPs/issues/367
[doc comments]: https://move-language.github.io/move/coding-conventions.html?#comments
[github actions]: https://docs.github.com/en/actions
[linear]: https://pre-commit.com/hooks.html
[move format]: https://move-language.github.io/move/coding-conventions.html#formatting
[move references]: https://move-language.github.io/move/references.html
[move signer]: https://move-language.github.io/move/signer.html
[pre-commit configuration readme]: ./cfg/README.md#running-pre-commit-hooks-locally
[pre-commit hook]: https://pre-commit.com/hooks.html
[reference links]: https://mdformat.readthedocs.io/en/stable/users/style.html#reference-links
[rfc 2119]: https://www.ietf.org/rfc/rfc2119.txt
[run our python format script]: ./src/python/hooks/README.md#run-our-formatting-script
[run `pre-commit`]: #pre-commit
[squash and merge method]: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/about-merge-methods-on-github
[vs code markdown+math extension]: https://marketplace.visualstudio.com/items?itemName=goessner.mdmath
[`pre-commit`]: https://github.com/pre-commit/pre-commit
