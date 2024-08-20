// cspell:word writeset
import {
  type UserTransactionResponse,
  type WriteSetChangeWriteResource,
  type WriteSetChangeWriteTableItem,
} from "@aptos-labs/ts-sdk";
import { getTestHelpers } from "@econia-labs/emojicoin-test-utils";
import { STRUCT_STRINGS, SYMBOL_DATA, normalizeHex } from "../../src";
import EmojiJSONData from "../../src/emoji_data/symbol-emojis.json";

jest.setTimeout(10000);

describe("verification of typescript emoji JSON data", () => {
  const { aptos, publishPackageResult } = getTestHelpers();

  it("checks the on-chain changes in the publish txn to verify the JSON data", async () => {
    const publishResult = publishPackageResult;
    const transactionHash = publishResult.transaction_hash;
    const res = (await aptos.waitForTransaction({ transactionHash })) as UserTransactionResponse;
    const { changes } = res;

    // Find the table handle in the `Registry` write resource change.
    const registryWrite = changes.find((change) => {
      const changeType = change.type;
      if (changeType !== "write_resource") {
        return false;
      }
      const resourceType = (change as WriteSetChangeWriteResource).data.type;
      if (resourceType !== STRUCT_STRINGS.Registry) {
        return false;
      }
      const changeData = (change as WriteSetChangeWriteResource).data.data as any;
      return changeData.coin_symbol_emojis?.handle?.startsWith("0x");
    });

    expect(registryWrite).toBeDefined();
    const writeset = registryWrite as WriteSetChangeWriteResource;
    const data = writeset.data.data as any;
    const tableHandle = data.coin_symbol_emojis.handle;

    const emojisInChangeSet = changes.filter((change) => {
      const changeType = change.type;
      if (changeType !== "write_table_item") {
        return false;
      }
      const ch = change as WriteSetChangeWriteTableItem;
      return (
        ch.handle === tableHandle &&
        ch.data?.key_type === "vector<u8>" &&
        ch.data?.value === 0 &&
        ch.data?.value_type === "u8"
      );
    });

    // From the Move changesets.
    const numEmojisAdded = emojisInChangeSet.length;
    // From our TS JSON file.
    const jsonEntries = Object.entries(EmojiJSONData);
    const encoder = new TextEncoder();
    const emojisInJSON = jsonEntries.map(([_name, value]) => normalizeHex(encoder.encode(value)));

    // From the Move changesets.
    const moveTableChangeKeys = emojisInChangeSet.map((ch) => (ch as any).data.key);
    const moveEmojiHexStringsAsSet = new Set(moveTableChangeKeys);

    // From our TS JSON file.
    const emojisInJSONAsSet = new Set(emojisInJSON);

    // Check the set length is equal to the original array lengths and the json set length.
    expect(moveEmojiHexStringsAsSet.size).toStrictEqual(numEmojisAdded);
    expect(moveEmojiHexStringsAsSet.size).toStrictEqual(moveTableChangeKeys.length);
    expect(moveEmojiHexStringsAsSet.size).toStrictEqual(jsonEntries.length);
    expect(moveEmojiHexStringsAsSet.size).toStrictEqual(emojisInJSONAsSet.size);
    expect(moveEmojiHexStringsAsSet.size).toStrictEqual(emojisInJSON.length);

    for (const emojiHex of moveEmojiHexStringsAsSet) {
      expect(emojisInJSONAsSet.has(emojiHex)).toBe(true);
      expect(SYMBOL_DATA.hasHex(emojiHex)).toBe(true);
      expect(SYMBOL_DATA.byHex(emojiHex)).toBeDefined();
      expect(SYMBOL_DATA.byEmoji(SYMBOL_DATA.byHex(emojiHex)!.emoji)).toBeDefined();
      expect(SYMBOL_DATA.byName(SYMBOL_DATA.byHex(emojiHex)!.name)).toBeDefined();
      // Finally, test equality.
      expect(SYMBOL_DATA.byHex(emojiHex)!.hex).toBe(emojiHex);
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
