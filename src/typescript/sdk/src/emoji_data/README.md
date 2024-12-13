# Reproducing the TypeScript `*-emojis.ts` data

To reproduce the data in the TypeScript data files `*-emojis.ts`
`cd` to the root of the repo then run the following commands.

```shell
cd src/python/move_emojis
poetry install
poetry run python -m scripts.generate_code
```

Then alter the file such that it's prepended with a `const` declaration:

```json
{
  "🥇": "1st place medal",
  "🥈": "2nd place medal",
  ...
}
```

Becomes:

```typescript
const SYMBOL_EMOJIS = {
  "🥇": "1st place medal",
  "🥈": "2nd place medal",
  ...
} as const;
```

Note the `as const;` at the end of the object. It _must_ be there for the types
to be resolved correctly.
