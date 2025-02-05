/* eslint-disable @typescript-eslint/no-explicit-any */
// cspell:word writeset
import { AccountAddress, type WriteSetChangeWriteTableItem } from "@aptos-labs/ts-sdk";
import { getPublishHelpers } from "../utils/helpers";
import {
  CHAT_EMOJI_DATA,
  SYMBOL_EMOJI_DATA,
  allChatEmojis,
  allSymbolEmojis,
  getRegistryResourceFromWriteSet,
  isEntryFunctionUserTransactionResponse,
  isWriteSetChangeWriteTableItem,
  normalizeHex,
} from "../../src";
import { SYMBOL_EMOJIS } from "../../src/emoji_data/symbol-emojis";
import { CHAT_EMOJIS } from "../../src/emoji_data/chat-emojis";
import { getPublishTransactionFromIndexer } from "../utils/get-publish-txn-from-indexer";
import { getFundedAccount } from "../utils/test-accounts";
import TestHelpers from "../utils/helpers";
import { waitForEmojicoinIndexer } from "../../src/indexer-v2/queries";
import { fetchMarketRegistrationEvents } from "./queries";
import { ORDER_BY } from "../../src/indexer-v2/const";

jest.setTimeout(10000);

describe("verification of typescript emoji JSON data", () => {
  const { aptos } = getPublishHelpers();

  let symbolEmojisTableHandle: AccountAddress;
  let chatEmojisTableHandle: AccountAddress;
  let tableItemWrites: WriteSetChangeWriteTableItem[];

  beforeAll(async () => {
    const transactionHash = (await getPublishTransactionFromIndexer()).transaction_hash;
    const res = await aptos.waitForTransaction({ transactionHash });
    if (!isEntryFunctionUserTransactionResponse(res)) {
      throw new Error("This should always be true.");
    }
    const registryResource = getRegistryResourceFromWriteSet(res)!;
    expect(registryResource).toBeDefined();

    symbolEmojisTableHandle = AccountAddress.from(registryResource.coinSymbolEmojis.handle);
    chatEmojisTableHandle = AccountAddress.from(registryResource.supplementalChatEmojis.handle);
    tableItemWrites = res.changes.filter(isWriteSetChangeWriteTableItem);
  });

  it("verifies symbol emoji JSON data with on-chain changes in the publish txn", async () => {
    // Filter all writeset changes for emojis being added to the coin_symbol_emojis table.
    const symbolEmojisInWriteSets = tableItemWrites.filter((ch) => {
      return (
        AccountAddress.from(ch.handle).equals(symbolEmojisTableHandle) &&
        ch.data?.key_type === "vector<u8>" &&
        ch.data?.value === 0 &&
        ch.data?.value_type === "u8"
      );
    });

    // From the Move changesets.
    const numEmojisAdded = symbolEmojisInWriteSets.length;
    // From our TS JSON file.
    const jsonEntries = Object.entries(SYMBOL_EMOJIS);
    const encoder = new TextEncoder();
    const emojisInJSON = jsonEntries.map(([symbol, _name]) => normalizeHex(encoder.encode(symbol)));

    const moveTableChangeKeys = symbolEmojisInWriteSets.map((ch) => (ch as any).data.key);
    const moveEmojiHexStringsAsSet = new Set(moveTableChangeKeys);

    // From our TS JSON file.
    const emojisInJSONAsSet = new Set(emojisInJSON);

    // Check the set length is equal to the original array lengths and the json set length.
    expect(moveEmojiHexStringsAsSet.size).toStrictEqual(numEmojisAdded);
    expect(moveEmojiHexStringsAsSet.size).toStrictEqual(moveTableChangeKeys.length);
    expect(moveEmojiHexStringsAsSet.size).toStrictEqual(jsonEntries.length);
    expect(moveEmojiHexStringsAsSet.size).toStrictEqual(emojisInJSONAsSet.size);
    expect(moveEmojiHexStringsAsSet.size).toStrictEqual(emojisInJSON.length);
    expect(moveEmojiHexStringsAsSet.size).toStrictEqual(allSymbolEmojis.length);

    for (const emojiHex of moveEmojiHexStringsAsSet) {
      expect(emojisInJSONAsSet.has(emojiHex)).toBe(true);
      expect(SYMBOL_EMOJI_DATA.hasHex(emojiHex)).toBe(true);
      expect(SYMBOL_EMOJI_DATA.byHex(emojiHex)).toBeDefined();
      expect(SYMBOL_EMOJI_DATA.byEmoji(SYMBOL_EMOJI_DATA.byHex(emojiHex)!.emoji)).toBeDefined();
      expect(SYMBOL_EMOJI_DATA.byName(SYMBOL_EMOJI_DATA.byHex(emojiHex)!.name)).toBeDefined();
      // Finally, test equality.
      expect(SYMBOL_EMOJI_DATA.byHex(emojiHex)!.hex).toBe(emojiHex);
    }

    // To be extra paranoid.
    const [moveValues, jsonValues] = [
      Array.from(moveEmojiHexStringsAsSet),
      Array.from(emojisInJSONAsSet),
    ];
    moveValues.sort();
    jsonValues.sort();
    expect(moveValues).toStrictEqual(jsonValues);
  });

  it("verifies chat emoji JSON data with on-chain changes in the first registration", async () => {
    // Since the table items aren't added until the first market is registered, we must get the
    // writeset changes for the first registered market, not the publish package transaction.
    // We must also register a market to ensure that there is at least one registered market.
    const { registerResponse } = await TestHelpers.registerMarketFromEmojis({
      registrant: getFundedAccount("999"),
      emojis: ["🚽", "🚽"],
    });
    await waitForEmojicoinIndexer(registerResponse.version);

    const firstRegisterTxn = await fetchMarketRegistrationEvents({
      orderBy: ORDER_BY.ASC,
      minimumVersion: registerResponse.version,
    }).then((res) =>
      aptos.getTransactionByVersion({ ledgerVersion: res[0].transaction.version }).then((res) => {
        if (!isEntryFunctionUserTransactionResponse(res)) {
          throw new Error("This should always be true.");
        }
        return res;
      })
    );
    const chatTableItemWrites = firstRegisterTxn.changes.filter(isWriteSetChangeWriteTableItem);

    // Filter all writeset changes for emojis being added to the coin_symbol_emojis table.
    const chatEmojisInWriteSet = chatTableItemWrites.filter((ch) => {
      return (
        AccountAddress.from(ch.handle).equals(chatEmojisTableHandle) &&
        ch.data?.key_type === "vector<u8>" &&
        ch.data?.value === 0 &&
        ch.data?.value_type === "u8"
      );
    });

    // From the Move changesets.
    const numEmojisAdded = chatEmojisInWriteSet.length;
    // From our TS JSON file.
    const jsonEntries = Object.entries(CHAT_EMOJIS);
    const encoder = new TextEncoder();
    const emojisInJSON = jsonEntries.map(([symbol, _name]) => normalizeHex(encoder.encode(symbol)));

    const moveTableChangeKeys = chatEmojisInWriteSet.map((ch) => (ch as any).data.key);
    const moveEmojiHexStringsAsSet = new Set(moveTableChangeKeys);

    // From our TS JSON file.
    const emojisInJSONAsSet = new Set(emojisInJSON);

    // Check the set length is equal to the original array lengths and the json set length.
    expect(moveEmojiHexStringsAsSet.size).toStrictEqual(numEmojisAdded);
    expect(moveEmojiHexStringsAsSet.size).toStrictEqual(moveTableChangeKeys.length);
    expect(moveEmojiHexStringsAsSet.size).toStrictEqual(jsonEntries.length);
    expect(moveEmojiHexStringsAsSet.size).toStrictEqual(emojisInJSONAsSet.size);
    expect(moveEmojiHexStringsAsSet.size).toStrictEqual(emojisInJSON.length);
    expect(moveEmojiHexStringsAsSet.size).toStrictEqual(allChatEmojis.length);

    for (const emojiHex of moveEmojiHexStringsAsSet) {
      expect(emojisInJSONAsSet.has(emojiHex)).toBe(true);
      expect(CHAT_EMOJI_DATA.hasHex(emojiHex)).toBe(true);
      expect(CHAT_EMOJI_DATA.byHex(emojiHex)).toBeDefined();
      expect(CHAT_EMOJI_DATA.byEmoji(CHAT_EMOJI_DATA.byHex(emojiHex)!.emoji)).toBeDefined();
      expect(CHAT_EMOJI_DATA.byName(CHAT_EMOJI_DATA.byHex(emojiHex)!.name)).toBeDefined();
      // Finally, test equality.
      expect(CHAT_EMOJI_DATA.byHex(emojiHex)!.hex).toBe(emojiHex);
    }

    // To be extra paranoid.
    const [moveValues, jsonValues] = [
      Array.from(moveEmojiHexStringsAsSet),
      Array.from(emojisInJSONAsSet),
    ];
    moveValues.sort();
    jsonValues.sort();
    expect(moveValues).toStrictEqual(jsonValues);
  });
});
