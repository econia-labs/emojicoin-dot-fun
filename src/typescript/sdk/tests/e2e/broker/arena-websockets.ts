import { maxBigInt, ONE_APT_BIGINT, sleep, zip } from "../../../src";
import { EmojicoinClient } from "../../../src/client/emojicoin-client";
import { type SymbolEmoji } from "../../../src/emoji_data/types";
import { waitForEmojicoinIndexer } from "../../../src/indexer-v2";
import {
  fetchArenaMeleeView,
  fetchArenaRegistryView,
  fetchMeleeEmojiData,
  type MeleeEmojiData,
} from "../../../src/markets/arena-utils";
import { isArenaEnterModel } from "../../../src/types/arena-types";
import { getFundedAccount, getFundedAccounts } from "../../utils/test-accounts";
import { compareParsedData, connectNewClient, subscribe } from "./utils";
import { customWaitFor } from "./websockets.test";

describe("tests to ensure that arena websocket events work as expected", () => {
  const users = getFundedAccounts("085", "086", "087", "088");
  const initialCranker = getFundedAccount("089");
  const symbols: SymbolEmoji[][] = [["🦈"], ["🐟"], ["🦭"], ["🐙"]];
  const emojicoin = new EmojicoinClient();
  const markets: { marketID: bigint; symbol: SymbolEmoji[] }[] = [];
  let melee: MeleeEmojiData;

  beforeAll(async () => {
    const versions = await Promise.all(
      zip(users, symbols).map(async ([registrant, symbol]) =>
        emojicoin.register(registrant, symbol).then(({ registration }) => {
          const { market } = registration.model;
          markets.push({ marketID: market.marketID, symbol: market.symbolEmojis });
          return registration.model.transaction.version;
        })
      )
    );
    const highestVersion = maxBigInt(...versions);
    await waitForEmojicoinIndexer(highestVersion, 10000);
    // Ensure the broker has emitted all events to ensure they don't interfere with the following tests.
    await sleep(2000);

    // The markets are chosen at random, so pull the crank to start the melee and retrieve the
    // markets being used in the arena. Use bunk data in `enter` here- we're just pulling the crank.
    await emojicoin.arena.enter(initialCranker, 0n, false, [], [], "symbol1");
    const { numMelees: latestMeleeID } = await fetchArenaRegistryView();

    melee = await fetchArenaMeleeView(latestMeleeID).then(fetchMeleeEmojiData);
    return true;
  });

  it("establishes a fresh client connection to the broker", async () => {
    const { client, events, messageEvents, brokerMessages } = await connectNewClient();
    expect(client.readyState).toEqual(client.OPEN);
    expect(events.length).toEqual(0);
    expect(messageEvents.length).toEqual(0);
    expect(brokerMessages.length).toEqual(0);
  });

  it("receives an arena event within two seconds of the event being submitted", async () => {
    const { client, events, messageEvents, brokerMessages } = await connectNewClient();
    const user = users[0];
    subscribe(client, [melee.market1.marketID, melee.market2.marketID], [], true);

    const res = await emojicoin.arena.enter(
      user,
      ONE_APT_BIGINT,
      false,
      melee.market1.emojis.map(({ emoji }) => emoji),
      melee.market2.emojis.map(({ emoji }) => emoji),
      "symbol1"
    );

    const findEnterModel = () => events.find(isArenaEnterModel);
    const idx = events.findIndex(isArenaEnterModel);
    await customWaitFor(() => !!findEnterModel());
    const model = findEnterModel()!;
    expect(model).toBeDefined();
    expect(model.enter.meleeID).toEqual(melee.view.meleeID);
    expect(model.enter.user).toEqual(user.accountAddress.toString());
    compareParsedData({
      messageEvent: messageEvents[idx],
      brokerMessage: brokerMessages[idx],
      event: events[idx],
      eventName: "ArenaEnter",
      response: res.response,
    });
  });
});
