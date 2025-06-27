export function generatePricePath(
  numTrades: number,
  initialPrice: bigint
): { prices: bigint[]; inputAmounts: bigint[] } {
  const mu = 0.0005;
  const sigma = 0.02;
  const prices: bigint[] = [initialPrice];

  for (let i = 1; i < numTrades; i++) {
    // Approximate normal distribution.
    const randomShock = Math.random() * 2 - 1;
    const newPrice = BigInt(
      Math.floor(Number(prices[i - 1]) * Math.exp(mu - 0.5 * sigma ** 2 + sigma * randomShock))
    );
    prices.push(newPrice);
  }

  // Compute input amounts
  const inputAmounts: bigint[] = [];
  for (let i = 1; i < numTrades; i++) {
    const priceChange = prices[i] - prices[i - 1];
    inputAmounts.push(BigInt(Math.abs(Number(priceChange))));
  }

  return { prices, inputAmounts };
}
