import { getEvents } from "../../../src";
import { Chat } from "../../../src/emojicoin_dot_fun/emojicoin-dot-fun";
import { fetchChatEvents } from "../../../src/indexer-v2/queries";
import { getAptosClient } from "../../../src/utils/test";
import RowEqualityChecks from "./equality-checks";
import { getFundedAccount } from "../../../src/utils/test/test-accounts";
import TestHelpers from "../../../src/utils/test/helpers";

jest.setTimeout(20000);

describe("address standardization tests", () => {
  it("standardizes a user's address", async () => {
    const user = getFundedAccount("005");
    const { aptos } = getAptosClient();

    const { marketAddress, emojicoin, emojicoinLP, emojis } =
      await TestHelpers.registerRandomMarket({ registrant: user });

    const res = await Chat.submit({
      aptosConfig: aptos.config,
      user,
      marketAddress,
      emojiBytes: emojis.map((e) => e.hex),
      emojiIndicesSequence: new Uint8Array(Array.from({ length: emojis.length }, (_, i) => i)),
      typeTags: [emojicoin, emojicoinLP],
    });

    const events = getEvents(res);
    const { marketID } = events.chatEvents[0];

    const queryRes = await fetchChatEvents({ marketID, minimumVersion: res.version, pageSize: 1 });
    const row = queryRes[0];

    RowEqualityChecks.Chat(row, res);
  });
});
