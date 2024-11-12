import { type SymbolEmoji } from "../../../src";
import {
  fetchChatEvents,
  fetchMarkets,
  fetchMarketState,
  fetchSwapEvents,
} from "../../../src/indexer-v2/queries";

jest.setTimeout(20000);

describe("ensures no errors are thrown when empty rows are returned from queries", () => {
  it("checks an empty all market states query", async () => {
    const searchEmojis: SymbolEmoji[] = ["⛔", "⛔", "⛔"];
    const res = await fetchMarkets({ searchEmojis });
    /* eslint-disable-next-line no-bitwise */
    const veryBigInt = (1n << 63n) - 1n;
    const state = await fetchMarketState({ searchEmojis });
    const chats = await fetchChatEvents({ marketID: veryBigInt });
    const swaps = await fetchSwapEvents({ marketID: veryBigInt });

    for (const response of [res, state, chats, swaps]) {
      if (Array.isArray(response)) {
        if (response.length !== 0) {
          console.warn(response);
        }
        expect(response).toBeDefined();
        expect(response.length).toEqual(0);
      } else {
        expect(response).toBeNull();
      }
    }
  });
});
