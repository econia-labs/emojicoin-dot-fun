import { isValidMarketSymbol, type SymbolEmoji } from "@econia-labs/emojicoin-sdk";

import {
  ARENA_CHART_SYMBOL_DELIMITER,
  decodeSymbolsForChart,
  encodeSymbolsForChart,
  isArenaChartSymbol,
} from "../../src/lib/chart-utils";

describe("checks the encoding and decoding of market symbols used in the chart component", () => {
  it("encodes and decodes a market symbol properly", () => {
    const [emojis0, emojis1]: [SymbolEmoji[], SymbolEmoji[]] = [
      ["🐏", "⛏️"],
      ["🐏", "🪥"],
    ];
    const [symbol0, symbol1] = [emojis0.join(""), emojis1.join("")];
    expect(isValidMarketSymbol(symbol0)).toBe(true);
    expect(isValidMarketSymbol(symbol1)).toBe(true);

    const encoded = encodeSymbolsForChart(symbol0, symbol1);
    expect(isArenaChartSymbol(encoded)).toBe(true);
    expect(encoded).toEqual(`${symbol0}${ARENA_CHART_SYMBOL_DELIMITER}${symbol1}`);

    const { primarySymbol, secondarySymbol } = decodeSymbolsForChart(encoded);
    expect(primarySymbol).toBeDefined();
    expect(secondarySymbol).toBeDefined();
    expect(primarySymbol).toEqual(symbol0);
    expect(secondarySymbol).toEqual(symbol1);
  });
});
