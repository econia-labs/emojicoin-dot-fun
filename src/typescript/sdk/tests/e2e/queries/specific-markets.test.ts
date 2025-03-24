import { type Account } from "@aptos-labs/ts-sdk";

import {
  chunk,
  getAptosClient,
  SYMBOL_EMOJI_DATA,
  SYMBOL_EMOJIS,
  type SymbolEmoji,
  toSequenceNumberOptions,
} from "../../../src";
import { EmojicoinClient } from "../../../src/client/emojicoin-client";
import { fetchSpecificMarkets, waitForEmojicoinIndexer } from "../../../src/indexer-v2";
import { getFundedAccounts } from "../../utils/test-accounts";

jest.setTimeout(30000);

/**
 * @see {@link fetchSpecificMarkets}
 */
const MAX_SYMBOLS_PER_FETCH = 100;

const dedupe = (symbols: SymbolEmoji[][]) => {
  const mapped = new Map(symbols.map((symbol) => [symbol.join(""), symbol]));
  const deduped = Array.from(mapped.values());
  return deduped;
};

const parallelizedRegistrations = async (account: Account, symbols: SymbolEmoji[][]) => {
  const emojicoin = new EmojicoinClient();
  const responses = await Promise.all(
    await getAptosClient()
      .getAccountInfo({ accountAddress: account.accountAddress })
      .then((res) => Number(res.sequence_number))
      .then((sequenceNumber) =>
        symbols.map((symbol, i) =>
          emojicoin.register(account, symbol, toSequenceNumberOptions(sequenceNumber + i))
        )
      )
  );
  const largestVersion = responses
    .map((v) => BigInt(v.response.version))
    .sort()
    .pop()!;
  expect(largestVersion).toBeDefined();
  await waitForEmojicoinIndexer(largestVersion);
};

describe("ensures the fetch specific markets query works as expected", () => {
  const [acc0, acc1, acc2] = getFundedAccounts("085", "086", "087");

  it("fetches specific markets", async () => {
    const allSymbols: SymbolEmoji[][] = [["☝️"], ["☝🏻"], ["☝🏼"], ["☝🏽"], ["☝🏾"], ["☝🏿"]];
    await parallelizedRegistrations(acc0, allSymbols);
    const res = await fetchSpecificMarkets(allSymbols);
    const responseSymbolsSorted = res.map((v) => v.market.symbolData.symbol).sort();
    const inputSymbolsSorted = allSymbols.map((v) => v.join("")).sort();
    expect(responseSymbolsSorted).toEqual(inputSymbolsSorted);
  });

  it("doesn't fail on input markets that don't exist", async () => {
    const emoji = "🐈‍⬛";
    expect(SYMBOL_EMOJI_DATA.byEmojiStrict(emoji).bytes.length).toEqual(10);
    const invalidSymbols: SymbolEmoji[][] = Array.from({ length: 10 }).map((_, i) =>
      Array.from({ length: i + 2 }).map((_) => emoji)
    );
    const res = await fetchSpecificMarkets(invalidSymbols);
    expect(res).toBeDefined();
    expect(res.length).toEqual(0);
  });

  it("fetches specific markets with problematic symbol emojis", async () => {
    const problematicSymbols: SymbolEmoji[][] = [
      ["🇺🇸"],
      ["🇨🇳"],
      ["#️⃣"],
      ["0️⃣"],
      ["9️⃣"],
      ["©️", "®️"],
      ["↔️"],
    ];
    await parallelizedRegistrations(acc1, problematicSymbols);
    const res = await fetchSpecificMarkets(problematicSymbols);
    const responseSymbolsSorted = res.map((v) => v.market.symbolData.symbol).sort();
    const inputSymbolsSorted = problematicSymbols.map((v) => v.join("")).sort();
    expect(responseSymbolsSorted).toEqual(inputSymbolsSorted);
  });

  it("properly chunks an input array with more than 100 symbols", async () => {
    const fourByteEmojis = Object.keys(SYMBOL_EMOJIS)
      .map((v) => SYMBOL_EMOJI_DATA.byEmoji(v))
      .filter((v) => !!v)
      .filter((v) => v.bytes.length === 4)
      .map((v) => v.emoji);

    const s1: SymbolEmoji[] = ["⚽", "✨", "⚾"];
    const s2: SymbolEmoji[] = ["✨", "⚾", "⚽"];
    const s3: SymbolEmoji[] = ["⚾", "⚽", "✨"];
    expect(dedupe([s1, s2, s3])).toHaveLength(3);

    // Register the three markets.
    await parallelizedRegistrations(acc2, [s1, s2, s3]);

    expect(fourByteEmojis.length).toBeGreaterThanOrEqual(MAX_SYMBOLS_PER_FETCH);
    // Create 300 unique symbols by appending a symbol to the end. These are invalid symbols,
    // but they're only used to create a really large set of unique symbols for the URL.
    const inputs = Array.from(fourByteEmojis.slice(0, MAX_SYMBOLS_PER_FETCH))
      .map((extraEmoji) => [
        [...s1, extraEmoji],
        [...s2, extraEmoji],
        [...s3, extraEmoji],
      ])
      .flat();
    expect(dedupe(inputs).length).toEqual(inputs.length);
    expect(inputs).toHaveLength(MAX_SYMBOLS_PER_FETCH * 3);

    // Insert the registered markets at the beginning of each eventual chunk.
    inputs[MAX_SYMBOLS_PER_FETCH * 0] = s1;
    inputs[MAX_SYMBOLS_PER_FETCH * 1] = s2;
    inputs[MAX_SYMBOLS_PER_FETCH * 2] = s3;

    // Verify that the query returns exactly the 3 markets.
    const res = await fetchSpecificMarkets(inputs);
    expect(res).toHaveLength(3);
    const uniqueSymbolsInput = dedupe([s1, s2, s3]);
    const uniqueSymbolsReturned = dedupe(res.map((v) => v.market.symbolEmojis));
    expect(uniqueSymbolsInput.sort()).toEqual(uniqueSymbolsReturned.sort());
  });

  /**
   * The chunking and flattening logic used in {@link fetchSpecificMarkets}.
   */
  it("un-chunks a chunked array", () => {
    const res = chunk([1, 2, 3, 4, 5, 6, 7], 2);
    expect(res).toEqual([[1, 2], [3, 4], [5, 6], [7]]);
    expect(res.flat()).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  /**
   * The deduplication logic used in {@link fetchSpecificMarkets}.
   */
  it("properly deduplicates an input symbol array", () => {
    const symbols: SymbolEmoji[][] = [
      ["✨"],
      ["✨", "⚽"],
      ["✨", "⚽", "🌯"],
      ["✨", "⚽", "🌯"],
      ["✨"],
      ["✨"],
      ["✨", "✨"],
      ["⚽", "🌯", "✨"],
      ["⚽", "🌯", "✨"],
      ["⚽", "✨"],
      ["⚽", "✨"],
    ];
    const deduped = dedupe(symbols);
    expect(deduped.sort()).toEqual(
      [
        ["✨"],
        ["✨", "⚽"],
        ["✨", "⚽", "🌯"],
        ["✨", "✨"],
        ["⚽", "🌯", "✨"],
        ["⚽", "✨"],
      ].sort()
    );
  });
});
