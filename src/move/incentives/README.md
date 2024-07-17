# `Incentives`

## Background

This package is designed for disbursement of APT incentives. It has a single
module with two roles: admin, and sender.

Both roles initialize to the package publication address, thereafter the admin
can either set a new admin or a new sender address on demand. In practice, the
admin will be a multisig, and the sender will likely be a hot key controlled by
an offchain bot that is triggered by a frontend claim button or similar.

Whenever the sender calls the `send` API, they trigger an APT transfer from
their account to a recipient's account, and emit a `Send` event. For ease of
indexing, this package can be published at the same address as
`EmojicoinDotFun` such that the `Send` event contains the same package address.

See the [`emojicoin-dot-fun` publication steps](../emojicoin_dot_fun/README.md)
for more.
