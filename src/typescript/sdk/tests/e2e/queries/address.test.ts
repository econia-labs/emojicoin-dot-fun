import { getEvents, toCoinTypesForEntry } from "../../../src";
import { Chat } from "@/contract-apis/emojicoin-dot-fun";
import { fetchChatEvents } from "../../../src/indexer-v2/queries";
import { getAptosClient } from "../../utils";
import checkRows from "../helpers/equality-checks";
import { getFundedAccount } from "../../utils/test-accounts";
import { EmojicoinClient } from "../../../src/client/emojicoin-client";

jest.setTimeout(20000);

describe("address standardization tests", () => {
  it("standardizes a user's address", async () => {
    const user = getFundedAccount("005");
    const aptos = getAptosClient();
    const emojicoin = new EmojicoinClient();

    const { marketAddress, emojis } = await emojicoin
      .register(user, ["🍿"])
      .then((res) => res.registration.model.market);
    const typeTags = toCoinTypesForEntry(marketAddress);

    const res = await Chat.submit({
      aptosConfig: aptos.config,
      user,
      marketAddress,
      emojiBytes: emojis.map((e) => e.hex),
      emojiIndicesSequence: new Uint8Array(Array.from({ length: emojis.length }, (_, i) => i)),
      typeTags,
    });

    const events = getEvents(res);
    const { marketID } = events.chatEvents[0];

    const queryRes = await fetchChatEvents({ marketID, minimumVersion: res.version, pageSize: 1 });
    const row = queryRes[0];

    checkRows.Chat(row, res);
  });
});
