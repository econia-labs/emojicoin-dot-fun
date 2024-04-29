<!-- markdownlint-disable-file MD025 -->

# Description

1. Incorporate global and local backend-less indexing, to rely solely on GraphQL
endpoint.
1. Update architecture specification for designs.
1. Update tests to incorporate timestamp support.

# Testing

```sh
git ls-files | entr -c aptos move test --dev --package-dir src/move/emojicoin_dot_fun
```

# Checklist

- [x] Did you update relevant documentation?
- [x] Did you add tests to cover new code or a fixed issue?
- [x] ~Did you update the changelog?~
- [x] Did you check off all checkboxes from the linked Linear task?
