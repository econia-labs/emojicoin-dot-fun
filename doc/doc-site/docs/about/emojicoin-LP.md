---
slug: /emojicoin-LP
title: ⛲ Emojicoin LP
hide_title: false
description: Documentation for emojicoin dot fun
---

AMMs, such as those used on the emojicoin platform, enable the creation of
liquidity pools containing tokens X and Y (e.g., emojicoin and APT).
The initial ratio of these tokens sets their starting relative price,
while the liquidity curve dictates price changes with each swap transaction.

## How It Works

### 1. Swapping Tokens

- Users swap one token for another, paying a small transaction fee.

### 2. Providing Liquidity

- Liquidity providers (LPs) contribute both X and Y tokens to the pool.
- In exchange, LPs receive LP tokens, representing their share in the pool,
  which are needed to withdraw their liquidity.
- LPs earn a portion of the transaction fees from swaps.

## Key Concept - Constant Function

Most AMMs, including Uniswap v2, use a Constant Function to calculate the
relative prices of the two tokens. This formula takes the following form:

$$
X*Y=K
$$

- X = Emojicoin
- Y  = APT
- K = Constant Product

This design ensures that the pool maintains its liquidity and cannot be
completely drained. The standard liquidity curve function introduced
by Uniswap v2 is crucial for price stability and availability of liquidity.
