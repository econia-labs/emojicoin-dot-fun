import { getEvents } from "../../../src";
import { registerRandomMarket } from "../../utils/helpers";
import { Chat } from "../../../src/emojicoin_dot_fun/emojicoin-dot-fun";
import { fetchChats } from "../../../src/indexer-v2/queries";
import { getAptosClient } from "../../utils";
import RowEqualityChecks from "./equality-checks";
import { getFundedAccount } from "../../utils/test-accounts";

describe("address normalization tests", () => {
  it("normalizes a user's address correctly", async () => {
    const registrant = getFundedAccount(
      "0x005c0f73b58fcdb08a644f72f454253af5f0965b347469c2af3e01b987139005"
    );
    const { aptos } = getAptosClient();

    const market = await registerRandomMarket({ registrant });
    const { registerResponse } = market;
    expect(registerResponse.success).toBe(true);

    const { marketAddress, emojicoin, emojicoinLP, emojis } = market;
    const res = await Chat.submit({
      aptosConfig: aptos.config,
      user: registrant,
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
