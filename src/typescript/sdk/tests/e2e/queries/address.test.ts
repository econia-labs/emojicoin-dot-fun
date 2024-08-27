import { Account } from "@aptos-labs/ts-sdk";
import { getEvents, ONE_APT } from "../../../src";
import { registerMarketTestHelper } from "../../utils/helpers";
import { Chat } from "../../../src/emojicoin_dot_fun/emojicoin-dot-fun";
import { fetchChats } from "../../../src/indexer-v2/queries";
import { fundAccountFast, getAptosClient } from "../../utils";
import RowEqualityChecks from "./equality-checks";

describe("address normalization tests", () => {
  it("normalizes a user's address correctly", async () => {
    let registrant = Account.generate();
    while (registrant.accountAddress.toString().at(0) !== "0") {
      registrant = Account.generate();
    }
    const { aptos } = getAptosClient();

    // Fund the account with 100 APT.
    await fundAccountFast(aptos, registrant, ONE_APT * 100);

    const market = await registerMarketTestHelper({ registrant });
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
