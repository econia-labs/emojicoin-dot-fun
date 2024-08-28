import { getEvents } from "../../../src";
import { Chat } from "../../../src/emojicoin_dot_fun/emojicoin-dot-fun";
import { fetchChats } from "../../../src/indexer-v2/queries";
import { getAptosClient } from "../../utils";
import RowEqualityChecks from "./equality-checks";
import { getFundedAccount } from "../../utils/test-accounts";
import TestHelpers from "../../utils/helpers";

describe("address normalization tests", () => {
  it("normalizes a user's address correctly", async () => {
    const user = getFundedAccount(
      "0x005c0f73b58fcdb08a644f72f454253af5f0965b347469c2af3e01b987139005"
    );
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

    const queryRes = await fetchChats({ marketID, minimumVersion: res.version, limit: 1 });
    const row = queryRes[0];

    RowEqualityChecks.chatRow(row, res);
  });
});
