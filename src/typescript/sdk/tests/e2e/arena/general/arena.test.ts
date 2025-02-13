import type { UserTransactionResponse } from "@aptos-labs/ts-sdk";
import {
  ARENA_MODULE_ADDRESS,
  EmojicoinArena,
  getAptosClient,
  type SymbolEmoji,
} from "../../../../src";
import { EmojicoinClient } from "../../../../src/client/emojicoin-client";
import {
  type ArenaEnterModel,
  type ArenaExitModel,
  type ArenaLeaderboardHistoryModel,
  type ArenaPositionModel,
  type ArenaSwapModel,
  fetchArenaInfo,
  postgrest,
  TableName,
  toArenaEnterModel,
  toArenaExitModel,
  toArenaLeaderboardHistoryModel,
  toArenaPositionModel,
  toArenaSwapModel,
  waitForEmojicoinIndexer,
} from "../../../../src/indexer-v2";
import {
  fetchArenaMeleeView,
  fetchMeleeEmojiData,
  type MeleeEmojiData,
} from "../../../../src/markets/arena-utils";
import { getFundedAccount } from "../../../utils/test-accounts";
import {
  currentMeleeEnded,
  ONE_SECOND_MICROSECONDS,
  registerAndUnlockInitialMarketsForArenaTest,
  setNextMeleeDurationAndEnsureCrank,
} from "../../broker/utils";
import { getPublisher } from "../../../utils";

const PROCESSING_WAIT_TIME = 2 * 1000;

const waitForProcessor = async (data: { response: UserTransactionResponse }) => {
  await waitForEmojicoinIndexer(data.response.version, PROCESSING_WAIT_TIME);
};

/**
 * Because this test checks the details of the very first arena it must run separately from other
 * arena tests.
 */
describe("ensures an arena correctly unfolds and the processor data is accurate", () => {
  const emojicoin = new EmojicoinClient();

  // The next arena markets.
  let melee: MeleeEmojiData;

  const MELEE_DURATION = ONE_SECOND_MICROSECONDS * 10n;

  beforeAll(
    async () => {
      await registerAndUnlockInitialMarketsForArenaTest();
      const emojis: SymbolEmoji[][] = [
        ["♑"],
        ["♒"],
        ["♈"],
        ["♎"],
        ["♍"],
        ["♊"],
        ["♌"],
        ["⛎"],
        ["♓"],
        ["♐"],
        ["♏"],
        ["♉"],
      ];
      for (const emoji of emojis) {
        await emojicoin.register(getFundedAccount("667"), emoji);
        await emojicoin.buy(getFundedAccount("667"), emoji, 100000000n);
      }
      await setNextMeleeDurationAndEnsureCrank(MELEE_DURATION).then((res) => {
        melee = res.melee;
        return waitForEmojicoinIndexer(res.version, PROCESSING_WAIT_TIME);
      });

      return true;
    },
    5 * 60 * 1000
  );

  const aptos = getAptosClient();

  const waitForProcessor = async (data: { response: UserTransactionResponse }) => {
    await waitForEmojicoinIndexer(data.response.version, PROCESSING_WAIT_TIME);
  };

  it("verifies that the arena module is already published on-chain", async () => {
    const res = await aptos.getAccountModule({
      accountAddress: ARENA_MODULE_ADDRESS,
      moduleName: EmojicoinArena.Enter.prototype.moduleName ?? "emojicoin_arena",
    });
    expect(res.bytecode).toBeTruthy();
  });

  it("verifies an arena has already started with a duration of 15 seconds", async () => {
    expect(melee.view.duration).toEqual(MELEE_DURATION);
  });

  it("verifies an arena has started in the last 5 seconds", async () => {
    const fiveSeconds = 5 * 1000;
    const now = new Date().getTime();
    const fiveSecondsAgo = now - fiveSeconds;
    expect(melee.view.startTime.getTime()).toBeGreaterThan(fiveSecondsAgo);
  });

  it("verifies arena data is correctly inserted into the processor", async () => {
    const arenaInfo = await fetchArenaInfo({});
    expect(arenaInfo).toBeTruthy();
    expect(arenaInfo?.meleeID).toEqual(melee.view.meleeID);
    expect(arenaInfo?.duration).toEqual(melee.view.duration);
    expect(arenaInfo?.startTime).toEqual(melee.view.startTime);
    expect(arenaInfo?.volume).toEqual(0n);
    expect(arenaInfo?.aptLocked).toEqual(0n);
    expect(arenaInfo?.maxMatchAmount).toEqual(melee.view.maxMatchAmount);
    expect(arenaInfo?.maxMatchPercentage).toEqual(melee.view.maxMatchPercentage);
    expect(arenaInfo?.rewardsRemaining).toEqual(melee.view.availableRewards);
    expect(arenaInfo?.emojicoin0Symbols).toEqual(melee.market1.symbolEmojis);
    expect(arenaInfo?.emojicoin1Symbols).toEqual(melee.market2.symbolEmojis);
    expect(arenaInfo?.emojicoin0MarketID).toEqual(melee.market1.marketID);
    expect(arenaInfo?.emojicoin1MarketID).toEqual(melee.market2.marketID);
    expect(arenaInfo?.emojicoin0MarketAddress).toEqual(melee.market1.marketAddress);
    expect(arenaInfo?.emojicoin1MarketAddress).toEqual(melee.market2.marketAddress);
  });

  it("verifies enter+swap+exit procedure", async () => {
    const account = getFundedAccount("007");
    const enterResponse = await emojicoin.arena.enter(
      account,
      1n * 10n ** 8n,
      false,
      melee.market1.symbolEmojis,
      melee.market2.symbolEmojis,
      "symbol1"
    );

    expect(enterResponse.events.arenaEnterEvents).toHaveLength(1);

    const viewEnterEvent = enterResponse.events.arenaEnterEvents[0];

    await waitForProcessor(enterResponse);

    const arenaEnters: ArenaEnterModel[] | null = await postgrest
      .from(TableName.ArenaEnterEvents)
      .select("*")
      .eq("melee_id", melee.view.meleeID)
      .then((r) => r.data)
      .then((r) => (r === null ? null : r.map(toArenaEnterModel)));
    let arenaPositions: ArenaPositionModel[] | null = await postgrest
      .from(TableName.ArenaPosition)
      .select("*")
      .eq("melee_id", melee.view.meleeID)
      .then((r) => r.data)
      .then((r) => (r === null ? null : r.map(toArenaPositionModel)));
    let arenaInfo = await fetchArenaInfo({});

    expect(arenaEnters).not.toBeNull();
    expect(arenaEnters).toHaveLength(1);

    expect(arenaPositions).not.toBeNull();
    expect(arenaPositions).toHaveLength(1);

    expect(arenaInfo).not.toBeNull();

    const dbEnterEvent = arenaEnters![0];
    let position = arenaPositions![0];

    expect(dbEnterEvent.enter.meleeID).toEqual(viewEnterEvent.meleeID);
    expect(dbEnterEvent.enter.user).toEqual(viewEnterEvent.user);
    expect(dbEnterEvent.enter.inputAmount).toEqual(viewEnterEvent.inputAmount);
    expect(dbEnterEvent.enter.matchAmount).toEqual(viewEnterEvent.matchAmount);
    expect(dbEnterEvent.enter.quoteVolume).toEqual(viewEnterEvent.quoteVolume);
    expect(dbEnterEvent.enter.integratorFee).toEqual(viewEnterEvent.integratorFee);
    expect(dbEnterEvent.enter.emojicoin0Proceeds).toEqual(viewEnterEvent.emojicoin0Proceeds);
    expect(dbEnterEvent.enter.emojicoin1Proceeds).toEqual(viewEnterEvent.emojicoin1Proceeds);
    expect(dbEnterEvent.enter.emojicoin0ExchangeRateBase).toEqual(
      viewEnterEvent.emojicoin0ExchangeRateBase
    );
    expect(dbEnterEvent.enter.emojicoin0ExchangeRateQuote).toEqual(
      viewEnterEvent.emojicoin0ExchangeRateQuote
    );
    expect(dbEnterEvent.enter.emojicoin1ExchangeRateBase).toEqual(
      viewEnterEvent.emojicoin1ExchangeRateBase
    );
    expect(dbEnterEvent.enter.emojicoin1ExchangeRateQuote).toEqual(
      viewEnterEvent.emojicoin1ExchangeRateQuote
    );

    expect(position.user).toEqual(viewEnterEvent.user);
    expect(position.meleeID).toEqual(viewEnterEvent.meleeID);
    expect(position.open).toEqual(true);
    expect(position.deposits).toEqual(viewEnterEvent.inputAmount);
    expect(position.withdrawals).toEqual(0n);
    expect(position.emojicoin0Balance).toEqual(viewEnterEvent.emojicoin0Proceeds);
    expect(position.emojicoin1Balance).toEqual(viewEnterEvent.emojicoin1Proceeds);

    expect(arenaInfo?.volume).toEqual(viewEnterEvent.quoteVolume);
    expect(arenaInfo?.aptLocked).toEqual(viewEnterEvent.quoteVolume);

    const swapResponse = await emojicoin.arena.swap(
      account,
      melee.market1.symbolEmojis,
      melee.market2.symbolEmojis
    );

    expect(swapResponse.events.arenaSwapEvents).toHaveLength(1);
    expect(swapResponse.events.swapEvents).toHaveLength(2);

    const viewArenaSwapEvent = swapResponse.events.arenaSwapEvents[0];

    await waitForProcessor(swapResponse);

    const arenaSwaps: ArenaSwapModel[] | null = await postgrest
      .from(TableName.ArenaSwapEvents)
      .select("*")
      .eq("melee_id", melee.view.meleeID)
      .then((r) => r.data)
      .then((r) => (r === null ? null : r.map(toArenaSwapModel)));
    arenaPositions = await postgrest
      .from(TableName.ArenaPosition)
      .select("*")
      .eq("melee_id", melee.view.meleeID)
      .then((r) => r.data)
      .then((r) => (r === null ? null : r.map(toArenaPositionModel)));
    arenaInfo = await fetchArenaInfo({});

    expect(arenaSwaps).not.toBeNull();
    expect(arenaSwaps).toHaveLength(1);

    expect(arenaPositions).not.toBeNull();
    expect(arenaPositions).toHaveLength(1);

    expect(arenaInfo).not.toBeNull();

    const dbSwapEvent = arenaSwaps![0];
    position = arenaPositions![0];

    expect(dbSwapEvent.swap.meleeID).toEqual(viewArenaSwapEvent.meleeID);
    expect(dbSwapEvent.swap.user).toEqual(viewArenaSwapEvent.user);
    expect(dbSwapEvent.swap.quoteVolume).toEqual(viewArenaSwapEvent.quoteVolume);
    expect(dbSwapEvent.swap.integratorFee).toEqual(viewArenaSwapEvent.integratorFee);
    expect(dbSwapEvent.swap.emojicoin0Proceeds).toEqual(viewArenaSwapEvent.emojicoin0Proceeds);
    expect(dbSwapEvent.swap.emojicoin1Proceeds).toEqual(viewArenaSwapEvent.emojicoin1Proceeds);
    expect(dbSwapEvent.swap.emojicoin0ExchangeRateBase).toEqual(
      viewArenaSwapEvent.emojicoin0ExchangeRateBase
    );
    expect(dbSwapEvent.swap.emojicoin0ExchangeRateQuote).toEqual(
      viewArenaSwapEvent.emojicoin0ExchangeRateQuote
    );
    expect(dbSwapEvent.swap.emojicoin1ExchangeRateBase).toEqual(
      viewArenaSwapEvent.emojicoin1ExchangeRateBase
    );
    expect(dbSwapEvent.swap.emojicoin1ExchangeRateQuote).toEqual(
      viewArenaSwapEvent.emojicoin1ExchangeRateQuote
    );

    expect(position.user).toEqual(viewArenaSwapEvent.user);
    expect(position.meleeID).toEqual(viewArenaSwapEvent.meleeID);
    expect(position.open).toEqual(true);
    expect(position.deposits).toEqual(viewEnterEvent.inputAmount);
    expect(position.withdrawals).toEqual(0n);
    expect(position.emojicoin0Balance).toEqual(viewArenaSwapEvent.emojicoin0Proceeds);
    expect(position.emojicoin1Balance).toEqual(viewArenaSwapEvent.emojicoin1Proceeds);

    const exitResponse = await emojicoin.arena.exit(
      account,
      melee.market1.symbolEmojis,
      melee.market2.symbolEmojis
    );

    expect(exitResponse.events.arenaExitEvents).toHaveLength(1);

    const viewExitEvent = exitResponse.events.arenaExitEvents[0];

    await waitForProcessor(exitResponse);

    const arenaExits: ArenaExitModel[] | null = await postgrest
      .from(TableName.ArenaExitEvents)
      .select("*")
      .eq("melee_id", melee.view.meleeID)
      .then((r) => r.data)
      .then((r) => (r === null ? null : r.map(toArenaExitModel)));
    arenaPositions = await postgrest
      .from(TableName.ArenaPosition)
      .select("*")
      .eq("melee_id", melee.view.meleeID)
      .then((r) => r.data)
      .then((r) => (r === null ? null : r.map(toArenaPositionModel)));
    arenaInfo = await fetchArenaInfo({});

    expect(arenaExits).not.toBeNull();
    expect(arenaExits).toHaveLength(1);

    expect(arenaPositions).not.toBeNull();
    expect(arenaPositions).toHaveLength(1);

    expect(arenaInfo).not.toBeNull();

    const dbExitEvent = arenaExits![0];
    position = arenaPositions![0];

    expect(dbExitEvent.exit.meleeID).toEqual(viewExitEvent.meleeID);
    expect(dbExitEvent.exit.user).toEqual(viewExitEvent.user);
    expect(dbExitEvent.exit.emojicoin0Proceeds).toEqual(viewExitEvent.emojicoin0Proceeds);
    expect(dbExitEvent.exit.emojicoin1Proceeds).toEqual(viewExitEvent.emojicoin1Proceeds);
    expect(dbExitEvent.exit.emojicoin0ExchangeRateBase).toEqual(
      viewExitEvent.emojicoin0ExchangeRateBase
    );
    expect(dbExitEvent.exit.emojicoin0ExchangeRateQuote).toEqual(
      viewExitEvent.emojicoin0ExchangeRateQuote
    );
    expect(dbExitEvent.exit.emojicoin1ExchangeRateBase).toEqual(
      viewExitEvent.emojicoin1ExchangeRateBase
    );
    expect(dbExitEvent.exit.emojicoin1ExchangeRateQuote).toEqual(
      viewExitEvent.emojicoin1ExchangeRateQuote
    );
    expect(dbExitEvent.exit.tapOutFee).toEqual(viewExitEvent.tapOutFee);

    expect(position.user).toEqual(viewExitEvent.user);
    expect(position.meleeID).toEqual(viewExitEvent.meleeID);
    expect(position.open).toEqual(false);
    expect(position.deposits).toEqual(viewEnterEvent.inputAmount);
    const withdrawalsApt =
      (viewExitEvent.emojicoin0Proceeds * viewExitEvent.emojicoin0ExchangeRateQuote) /
        viewExitEvent.emojicoin0ExchangeRateBase +
      (viewExitEvent.emojicoin1Proceeds * viewExitEvent.emojicoin1ExchangeRateQuote) /
        viewExitEvent.emojicoin1ExchangeRateBase;
    // Rounding differences can happen between the rust calculations and the TS calculations.
    // We check for 99.99% precision.
    expect(position.withdrawals).toBeGreaterThanOrEqual((withdrawalsApt * 9999n) / 10000n);
    expect(position.withdrawals).toBeLessThanOrEqual((withdrawalsApt * 10001n) / 10000n);
    expect(position.emojicoin0Balance).toEqual(0n);
    expect(position.emojicoin1Balance).toEqual(0n);
  });
});

describe("ensures leaderboard history is working", () => {
  const emojicoin = new EmojicoinClient();

  let melee: MeleeEmojiData;

  const MELEE_DURATION = ONE_SECOND_MICROSECONDS * 5n;

  const publisher = getPublisher();

  beforeAll(async () => {
    await setNextMeleeDurationAndEnsureCrank(MELEE_DURATION).then((res) => {
      melee = res.melee;
      return waitForEmojicoinIndexer(res.version, PROCESSING_WAIT_TIME);
    });
  }, 30000);

  beforeEach(async () => {
    await currentMeleeEnded();
    const res = await emojicoin.arena.enter(
      publisher,
      1n,
      false,
      melee.market1.symbolEmojis,
      melee.market2.symbolEmojis,
      "symbol1"
    );
    melee = await fetchArenaMeleeView(res.arena.event.meleeID).then(fetchMeleeEmojiData);
    await waitForProcessor(res);

    return true;
  }, 10000);

  it("verifies that the leaderboard data is correct", async () => {
    const account1 = getFundedAccount("420");
    const account2 = getFundedAccount("421");
    const account3 = getFundedAccount("422");
    await emojicoin.arena.enter(
      account1,
      1n * 10n ** 8n,
      false,
      melee.market1.symbolEmojis,
      melee.market2.symbolEmojis,
      "symbol1"
    );
    await emojicoin.arena.enter(
      account2,
      1n * 10n ** 8n,
      false,
      melee.market1.symbolEmojis,
      melee.market2.symbolEmojis,
      "symbol1"
    );
    await emojicoin.arena.enter(
      account3,
      1n * 10n ** 8n,
      false,
      melee.market1.symbolEmojis,
      melee.market2.symbolEmojis,
      "symbol1"
    );
    await emojicoin.arena.exit(account1, melee.market1.symbolEmojis, melee.market2.symbolEmojis);
    await emojicoin.arena.swap(account2, melee.market1.symbolEmojis, melee.market2.symbolEmojis);
    await emojicoin.arena.exit(account2, melee.market1.symbolEmojis, melee.market2.symbolEmojis);
    await currentMeleeEnded();
    const res = await emojicoin.arena.enter(
      account1,
      1n * 10n ** 8n,
      false,
      melee.market1.symbolEmojis,
      melee.market2.symbolEmojis,
      "symbol1"
    );
    await waitForProcessor(res);
    const leaderboard: ArenaLeaderboardHistoryModel[] | null = await postgrest
      .from(TableName.ArenaLeaderboardHistory)
      .select("*")
      .eq("melee_id", melee.view.meleeID.toString())
      .then((r) => r.data)
      .then((r) => (r === null ? null : r.map(toArenaLeaderboardHistoryModel)));

    expect(leaderboard).not.toBeNull();
    expect(leaderboard).toHaveLength(3);

    const leaderboard1 = leaderboard!.find((l) => l.user.startsWith("0x420"))!;
    const leaderboard2 = leaderboard!.find((l) => l.user.startsWith("0x421"))!;
    const leaderboard3 = leaderboard!.find((l) => l.user.startsWith("0x422"))!;

    expect(leaderboard1.exited).toEqual(true);
    expect(leaderboard1.lastExit0).toEqual(true);
    expect(Number(leaderboard![0].profits) / Number(leaderboard![0].losses)).toBeGreaterThan(1);

    expect(leaderboard2.exited).toEqual(true);
    expect(leaderboard2.lastExit0).toEqual(false);

    expect(leaderboard3.exited).toEqual(false);
    expect(leaderboard3.lastExit0).toBeNull();
    expect(Number(leaderboard![2].profits) / Number(leaderboard![2].losses)).toBeLessThan(1);
  }, 15000);

  it("verifies that the data during a melee with no activity", async () => {
    await currentMeleeEnded();
    const res = await emojicoin.arena.enter(
      getFundedAccount("667"),
      1n * 10n ** 8n,
      false,
      melee.market1.symbolEmojis,
      melee.market2.symbolEmojis,
      "symbol1"
    );
    await waitForProcessor(res);
    const leaderboard: ArenaLeaderboardHistoryModel[] | null = await postgrest
      .from(TableName.ArenaLeaderboardHistory)
      .select("*")
      .eq("melee_id", melee.view.meleeID.toString())
      .then((r) => r.data)
      .then((r) => (r === null ? null : r.map(toArenaLeaderboardHistoryModel)));

    expect(leaderboard).not.toBeNull();
    expect(leaderboard).toHaveLength(0);
  }, 15000);

  it("verifies that the data during a melee with no swaps", async () => {
    const account1 = getFundedAccount("420");
    const account2 = getFundedAccount("421");
    const account3 = getFundedAccount("422");
    await emojicoin.arena.enter(
      account1,
      1n * 10n ** 8n,
      false,
      melee.market1.symbolEmojis,
      melee.market2.symbolEmojis,
      "symbol1"
    );
    await emojicoin.arena.enter(
      account2,
      1n * 10n ** 8n,
      false,
      melee.market1.symbolEmojis,
      melee.market2.symbolEmojis,
      "symbol2"
    );
    await emojicoin.arena.enter(
      account3,
      1n * 10n ** 8n,
      false,
      melee.market1.symbolEmojis,
      melee.market2.symbolEmojis,
      "symbol1"
    );
    await emojicoin.arena.exit(account1, melee.market1.symbolEmojis, melee.market2.symbolEmojis);
    await emojicoin.arena.exit(account2, melee.market1.symbolEmojis, melee.market2.symbolEmojis);
    await currentMeleeEnded();
    const res = await emojicoin.arena.enter(
      account1,
      1n * 10n ** 8n,
      false,
      melee.market1.symbolEmojis,
      melee.market2.symbolEmojis,
      "symbol1"
    );
    await waitForProcessor(res);
    const leaderboard: ArenaLeaderboardHistoryModel[] | null = await postgrest
      .from(TableName.ArenaLeaderboardHistory)
      .select("*")
      .eq("melee_id", melee.view.meleeID.toString())
      .then((r) => r.data)
      .then((r) => (r === null ? null : r.map(toArenaLeaderboardHistoryModel)));

    expect(leaderboard).not.toBeNull();
    expect(leaderboard).toHaveLength(3);

    const leaderboard1 = leaderboard!.find((l) => l.user.startsWith("0x420"))!;
    const leaderboard2 = leaderboard!.find((l) => l.user.startsWith("0x421"))!;
    const leaderboard3 = leaderboard!.find((l) => l.user.startsWith("0x422"))!;

    expect(leaderboard1.exited).toEqual(true);
    expect(leaderboard1.lastExit0).toEqual(true);

    expect(leaderboard2.exited).toEqual(true);
    expect(leaderboard2.lastExit0).toEqual(false);

    expect(leaderboard3.exited).toEqual(false);
    expect(leaderboard3.lastExit0).toBeNull();
  }, 15000);

  it("verifies that the data during a melee with no exits", async () => {
    const account1 = getFundedAccount("420");
    const account2 = getFundedAccount("421");
    const account3 = getFundedAccount("422");
    await emojicoin.arena.enter(
      account1,
      1n * 10n ** 8n,
      false,
      melee.market1.symbolEmojis,
      melee.market2.symbolEmojis,
      "symbol1"
    );
    await emojicoin.arena.enter(
      account2,
      1n * 10n ** 8n,
      false,
      melee.market1.symbolEmojis,
      melee.market2.symbolEmojis,
      "symbol2"
    );
    await emojicoin.arena.enter(
      account3,
      1n * 10n ** 8n,
      false,
      melee.market1.symbolEmojis,
      melee.market2.symbolEmojis,
      "symbol1"
    );
    await emojicoin.arena.swap(account1, melee.market1.symbolEmojis, melee.market2.symbolEmojis);
    await emojicoin.arena.swap(account2, melee.market1.symbolEmojis, melee.market2.symbolEmojis);
    await currentMeleeEnded();
    const res = await emojicoin.arena.enter(
      account1,
      1n * 10n ** 8n,
      false,
      melee.market1.symbolEmojis,
      melee.market2.symbolEmojis,
      "symbol1"
    );
    await waitForProcessor(res);
    const leaderboard: ArenaLeaderboardHistoryModel[] | null = await postgrest
      .from(TableName.ArenaLeaderboardHistory)
      .select("*")
      .eq("melee_id", melee.view.meleeID.toString())
      .then((r) => r.data)
      .then((r) => (r === null ? null : r.map(toArenaLeaderboardHistoryModel)));

    expect(leaderboard).not.toBeNull();
    expect(leaderboard).toHaveLength(3);

    const leaderboard1 = leaderboard!.find((l) => l.user.startsWith("0x420"))!;
    const leaderboard2 = leaderboard!.find((l) => l.user.startsWith("0x421"))!;
    const leaderboard3 = leaderboard!.find((l) => l.user.startsWith("0x422"))!;

    expect(leaderboard1.exited).toEqual(false);
    expect(leaderboard1.lastExit0).toBeNull();

    expect(leaderboard2.exited).toEqual(false);
    expect(leaderboard2.lastExit0).toBeNull();

    expect(leaderboard3.exited).toEqual(false);
    expect(leaderboard3.lastExit0).toBeNull();
  }, 15000);
});
