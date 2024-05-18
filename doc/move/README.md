# Move DocGen

To generate, run from repository root:

```sh
move_dir=src/move/emojicoin_dot_fun
doc_dir=doc/move/
aptos move document \
    --dev \
    --include-dep-diagram \
    --include-impl \
    --package-dir $move_dir
cp -r $move_dir/doc/* $doc_dir
```
