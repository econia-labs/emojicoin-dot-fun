import { getEvents, ONE_APT_BIGINT, type SymbolEmoji } from "../../../src";
import { EmojicoinClient } from "../../../src/client/emojicoin-client";
import {
  fetchArenaMeleeView,
  fetchArenaRegistryView,
  fetchMeleeEmojiData,
  type MeleeEmojiData,
} from "../../../src/markets/arena-utils";
import {
  isArenaEnterModel,
  isArenaExitModel,
  isArenaSwapModel,
  isArenaVaultBalanceUpdateModel,
} from "../../../src/types/arena-types";
import { getFundedAccount } from "../../utils/test-accounts";
import {
  compareParsedData,
  connectNewClient,
  customWaitFor,
  depositToVault,
  subscribe,
  unlockInitialMarkets,
} from "./utils";

describe("tests to ensure that arena websocket events work as expected", () => {
  const user = getFundedAccount("085");
  let melee: MeleeEmojiData;
  const emojicoin = new EmojicoinClient();
  let symbol1: SymbolEmoji[];
  let symbol2: SymbolEmoji[];

  beforeAll(async () => {
    await fetchArenaRegistryView()
      .then(({ currentMeleeID }) => currentMeleeID)
      .then(fetchArenaMeleeView)
      .then(fetchMeleeEmojiData)
      .then((res) => (melee = res));

    // The first two markets registered are registered in the docker deployer service.
    // See `src/docker/deployer`.
    expect(melee.market1.symbolData.symbol).toEqual("💧");
    expect(melee.market2.symbolData.symbol).toEqual("🔥");
    await unlockInitialMarkets();
    symbol1 = melee.market1.symbolEmojis;
    symbol2 = melee.market2.symbolEmojis;
    return true;
  });

  it("establishes a fresh client connection to the broker", async () => {
    const { client, events, messageEvents, brokerMessages } = await connectNewClient();
    expect(client.readyState).toEqual(client.OPEN);
    expect(events.length).toEqual(0);
    expect(messageEvents.length).toEqual(0);
    expect(brokerMessages.length).toEqual(0);
  });

  it("receives enter, swap, and exit arena events within 2 seconds", async () => {
    const { client, events, messageEvents, brokerMessages } = await connectNewClient();
    subscribe(client, [melee.market1.marketID, melee.market2.marketID], [], true);

    const enterResponse = await emojicoin.arena
      // Do not lock in, otherwise vault balance updates are emitted.
      .enter(user, ONE_APT_BIGINT, false, symbol1, symbol2, "symbol1")
      .then(({ arena, response }) => {
        expect(arena.model.enter.meleeID).toEqual(melee.view.meleeID);
        expect(arena.model.enter.user).toEqual(user.accountAddress.toString());
        return response;
      });

    const swapResponse = await emojicoin.arena
      .swap(user, symbol1, symbol2)
      .then(({ arena, response }) => {
        expect(arena.model.swap.meleeID).toEqual(melee.view.meleeID);
        expect(arena.model.swap.user).toEqual(user.accountAddress.toString());
        return response;
      });

    const exitResponse = await emojicoin.arena
      .exit(user, symbol1, symbol2)
      .then(({ arena, response }) => {
        expect(arena.model.exit.meleeID).toEqual(melee.view.meleeID);
        expect(arena.model.exit.user).toEqual(user.accountAddress.toString());
        return response;
      });

    const findAllThreeModels = () =>
      !!(
        events.find(isArenaEnterModel) &&
        events.find(isArenaSwapModel) &&
        events.find(isArenaExitModel)
      );

    await customWaitFor(() => findAllThreeModels());

    const enterIndex = events.findIndex(isArenaEnterModel);
    const swapIndex = events.findIndex(isArenaSwapModel);
    const exitIndex = events.findIndex(isArenaExitModel);

    const indices = [enterIndex, swapIndex, exitIndex];
    expect(indices.every((v) => v !== -1)).toBe(true);
    expect(new Set(indices).size).toEqual(3);

    compareParsedData({
      messageEvent: messageEvents[enterIndex],
      brokerMessage: brokerMessages[enterIndex],
      event: events[enterIndex],
      eventName: "ArenaEnter",
      response: enterResponse,
    });

    compareParsedData({
      messageEvent: messageEvents[swapIndex],
      brokerMessage: brokerMessages[swapIndex],
      event: events[swapIndex],
      eventName: "ArenaSwap",
      response: swapResponse,
    });

    compareParsedData({
      messageEvent: messageEvents[exitIndex],
      brokerMessage: brokerMessages[exitIndex],
      event: events[exitIndex],
      eventName: "ArenaExit",
      response: exitResponse,
    });
  });

  it("receives a vault update balance event within 2 seconds", async () => {
    const { client, events, messageEvents, brokerMessages } = await connectNewClient();
    subscribe(client, [melee.market1.marketID, melee.market2.marketID], [], true);

    const funder = user;
    const amount = 1n;
    const res = await depositToVault(funder, amount);
    expect(res.success).toBe(true);
    const parsedEvents = getEvents(res);
    const vaultBalanceUpdateEvent = parsedEvents.arenaVaultBalanceUpdateEvents.at(0)!;
    expect(vaultBalanceUpdateEvent).toBeDefined();
    expect(vaultBalanceUpdateEvent.newBalance).toBeGreaterThanOrEqual(amount);

    // Wait for the websocket client to receive it.
    await customWaitFor(() => !!events.find(isArenaVaultBalanceUpdateModel));

    const idx = events.find(isArenaVaultBalanceUpdateModel);
    expect(idx).toEqual(0);

    compareParsedData({
      messageEvent: messageEvents.at(0),
      brokerMessage: brokerMessages.at(0),
      event: events.at(0),
      eventName: "ArenaVaultBalanceUpdate",
      response: res,
    });
  });
});
