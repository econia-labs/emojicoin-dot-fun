# Emojicoin Frontend

## Getting Started

First, install:

```bash
pnpm i
```

To run the app:

```bash
pnpm run dev
```

## Building

### For production

```bash
pnpm run build
```

### To run the production app

```bash
pnpm run start --port 3001
```

We use `--port 3001` as an example here because generally the `postgrest` api
occupies `port 3000`. You can choose any port you want.

This project uses [`next/font`].

[`next/font`]: (https://nextjs.org/docs/basic-features/font-optimization)
