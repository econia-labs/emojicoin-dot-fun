import type { Ed25519Account, Account } from "@aptos-labs/ts-sdk";
import {
  ARENA_MODULE_ADDRESS,
  EmojicoinArena,
  getAptosClient,
  ONE_APT_BIGINT,
  type SymbolEmoji,
} from "../../../src";
import { EmojicoinClient } from "../../../src/client/emojicoin-client";
import {
  type ArenaEnterModel,
  type ArenaExitModel,
  type ArenaLeaderboardHistoryModel,
  type ArenaPositionModel,
  type ArenaSwapModel,
  fetchArenaInfo,
  fetchSwapEvents,
  postgrest,
  stringifyJSONWithBigInts,
  TableName,
  toArenaEnterModel,
  toArenaExitModel,
  toArenaLeaderboardHistoryModel,
  toArenaPositionModel,
  toArenaSwapModel,
  waitForEmojicoinIndexer,
} from ".././../../src/indexer-v2";
import {
  fetchArenaMeleeView,
  fetchMeleeEmojiData,
  type MeleeEmojiData,
} from ".././../../src/markets/arena-utils";
import { getFundedAccount } from "../../utils/test-accounts";
import {
  ONE_SECOND_MICROSECONDS,
  setNextMeleeDurationAndEnsureCrank,
  waitUntilCurrentMeleeEnds,
  PROCESSING_WAIT_TIME,
  waitForProcessor,
} from "./utils";
import { getPublisher } from ".././../utils/helpers";

const getEmojicoinLockedDiffFromSwapRes = (
  swapRes: Awaited<ReturnType<typeof EmojicoinClient.prototype.arena.swap>>,
  melee: MeleeEmojiData
) => {
  let emojicoin0Locked = 0n;
  let emojicoin1Locked = 0n;
  const swaps = swapRes.events.swapEvents;
  const swap0 = swaps.find((s) => s.marketID === melee.market1.marketID)!;
  const swap1 = swaps.find((s) => s.marketID === melee.market2.marketID)!;
  const swap = swapRes.events.arenaSwapEvents[0];
  if (swap1.isSell) {
    emojicoin0Locked += swap0.netProceeds;
    emojicoin1Locked -= swap1.inputAmount;
    expect(swap0.netProceeds).toEqual(swap.emojicoin0Proceeds);
  } else {
    emojicoin0Locked -= swap0.inputAmount;
    emojicoin1Locked += swap1.netProceeds;
    expect(swap1.netProceeds).toEqual(swap.emojicoin1Proceeds);
  }

  return { emojicoin0Locked, emojicoin1Locked };
};

const objectKeysWithoutEventIndexAndVersion = (v: object) => {
  const set = new Set(Object.keys(v));
  // Ignore `eventIndex`, `version`, and `eventName`. The db models don't have it but the views do.
  set.delete("eventIndex");
  set.delete("version");
  set.delete("eventName");
  const entries = Array.from(set)
    .sort()
    .map((k) => [k, v[k as keyof typeof v]]);
  return Object.fromEntries(entries);
};

const expectObjectEqualityExceptEventIndexAndVersion = (a: object, b: object) => {
  const newA = objectKeysWithoutEventIndexAndVersion(a);
  const newB = objectKeysWithoutEventIndexAndVersion(b);
  expect(stringifyJSONWithBigInts(newA)).toEqual(stringifyJSONWithBigInts(newB));
};

/**
 * Because this test checks the details of the very first arena it must run separately from other
 * arena tests.
 */
describe("ensures an arena correctly unfolds and the processor data is accurate", () => {
  const aptos = getAptosClient();
  const emojicoin = new EmojicoinClient();

  // The next arena markets.
  let melee: MeleeEmojiData;

  const MELEE_DURATION = ONE_SECOND_MICROSECONDS * 10n;

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

  beforeAll(
    async () => {
      for (const emoji of emojis) {
        await emojicoin.register(getFundedAccount("667"), emoji);
        await emojicoin.buy(getFundedAccount("667"), emoji, 100000000n);
      }
      melee = await fetchArenaMeleeView(1n).then(fetchMeleeEmojiData);
    },
    5 * 60 * 1000
  );

  it("verifies that the arena module is already published on-chain", async () => {
    const res = await aptos.getAccountModule({
      accountAddress: ARENA_MODULE_ADDRESS,
      moduleName: EmojicoinArena.Enter.prototype.moduleName ?? "emojicoin_arena",
    });
    expect(res.bytecode).toBeTruthy();
  });

  it("verifies arena data is correctly inserted into the processor", async () => {
    const arenaInfo = await fetchArenaInfo({});
    expect(arenaInfo).toBeTruthy();
    expect(arenaInfo?.meleeID).toEqual(melee.view.meleeID);
    expect(arenaInfo?.duration).toEqual(melee.view.duration);
    expect(arenaInfo?.startTime).toEqual(melee.view.startTime);
    expect(arenaInfo?.volume).toEqual(0n);
    expect(arenaInfo?.emojicoin0Locked).toEqual(0n);
    expect(arenaInfo?.emojicoin1Locked).toEqual(0n);
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

  it("verifies an arena ends with no activity and nothing bad happens", async () => {
    const publisher = getPublisher();

    await emojicoin.arena.setNextMeleeDuration(publisher, MELEE_DURATION);

    await waitUntilCurrentMeleeEnds();

    const swaps0 = await fetchSwapEvents({ marketID: melee.market1.marketID });
    const swaps1 = await fetchSwapEvents({ marketID: melee.market2.marketID });

    expect(swaps0).toHaveLength(0);
    expect(swaps1).toHaveLength(0);

    const enterResponse = await emojicoin.arena.enter(
      getFundedAccount("007"),
      1n * 10n ** 8n,
      false,
      melee.market1.symbolEmojis,
      melee.market2.symbolEmojis,
      "symbol1"
    );
    await waitForProcessor(enterResponse);

    await emojicoin.buy(publisher, melee.market1.symbolEmojis, 1n);
    await emojicoin.buy(publisher, melee.market2.symbolEmojis, 1n);

    const leaderboard: ArenaLeaderboardHistoryModel[] | null = await postgrest
      .from(TableName.ArenaLeaderboardHistory)
      .select("*")
      .eq("melee_id", melee.view.meleeID.toString())
      .then((r) => r.data)
      .then((r) => (r === null ? null : r.map(toArenaLeaderboardHistoryModel)));

    expect(leaderboard).not.toBeNull();
    expect(leaderboard).toHaveLength(0);
  }, 20000);

  it("verifies an arena has already started with a duration of 15 seconds", async () => {
    melee = await fetchArenaMeleeView(2n).then(fetchMeleeEmojiData);
    expect(melee.view.duration).toEqual(MELEE_DURATION);
  });

  it("verifies an arena has started in the last 5 seconds", async () => {
    const fiveSeconds = 5 * 1000;
    const now = new Date().getTime();
    const fiveSecondsAgo = now - fiveSeconds;
    expect(melee.view.startTime.getTime()).toBeGreaterThan(fiveSecondsAgo);
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

    expectObjectEqualityExceptEventIndexAndVersion(dbEnterEvent.enter, viewEnterEvent);

    expect(position.user).toEqual(viewEnterEvent.user);
    expect(position.meleeID).toEqual(viewEnterEvent.meleeID);
    expect(position.open).toEqual(true);
    expect(position.deposits).toEqual(viewEnterEvent.inputAmount);
    expect(position.withdrawals).toEqual(0n);
    expect(position.emojicoin0Balance).toEqual(viewEnterEvent.emojicoin0Proceeds);
    expect(position.emojicoin1Balance).toEqual(viewEnterEvent.emojicoin1Proceeds);

    expect(arenaInfo?.volume).toEqual(viewEnterEvent.quoteVolume);
    expect(arenaInfo?.emojicoin0Locked).toEqual(viewEnterEvent.emojicoin0Proceeds);
    expect(arenaInfo?.emojicoin1Locked).toEqual(viewEnterEvent.emojicoin1Proceeds);

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

    expectObjectEqualityExceptEventIndexAndVersion(dbSwapEvent.swap, viewArenaSwapEvent);

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

    expectObjectEqualityExceptEventIndexAndVersion(dbExitEvent.exit, viewExitEvent);

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
  }, 30000);
});

describe("ensures leaderboard history is working", () => {
  const emojicoin = new EmojicoinClient();

  let melee: MeleeEmojiData;

  const MELEE_DURATION = ONE_SECOND_MICROSECONDS * 5n;

  const publisher = getPublisher();

  let accountIndex = 100;

  const getNextAccount = () => getFundedAccount((accountIndex++).toString() as unknown as Parameters<typeof getFundedAccount>[0]);

  // Utility function to avoid repetitive code. Only the `account` and `escrowCoin` differs.
  const enterHelper = (account: Account, escrowCoin: "symbol1" | "symbol2") =>
    emojicoin.arena.enter(
      account,
      ONE_APT_BIGINT,
      false,
      melee.market1.symbolEmojis,
      melee.market2.symbolEmojis,
      escrowCoin
    );

  beforeAll(async () => {
    await waitUntilCurrentMeleeEnds();
    await setNextMeleeDurationAndEnsureCrank(MELEE_DURATION).then((res) => {
      melee = res.melee;
      return waitForEmojicoinIndexer(res.version, PROCESSING_WAIT_TIME);
    });
  }, 30000);

  beforeEach(async () => {
    await waitUntilCurrentMeleeEnds();
    // Crank the melee to end it and start a new one.
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
    const account1 = getNextAccount();
    const account2 = getNextAccount();
    const account3 = getNextAccount();
    await enterHelper(account1, "symbol1");
    await enterHelper(account2, "symbol1");
    await enterHelper(account3, "symbol1");

    await emojicoin.arena.exit(account1, melee.market1.symbolEmojis, melee.market2.symbolEmojis);
    await emojicoin.arena.swap(account2, melee.market1.symbolEmojis, melee.market2.symbolEmojis);
    await emojicoin.arena.exit(account2, melee.market1.symbolEmojis, melee.market2.symbolEmojis);
    await waitUntilCurrentMeleeEnds();
    const res = await enterHelper(account1, "symbol1");

    await waitForProcessor(res);
    const leaderboard: ArenaLeaderboardHistoryModel[] | null = await postgrest
      .from(TableName.ArenaLeaderboardHistory)
      .select("*")
      .eq("melee_id", melee.view.meleeID.toString())
      .then((r) => r.data)
      .then((r) => (r === null ? null : r.map(toArenaLeaderboardHistoryModel)));

    expect(leaderboard).not.toBeNull();
    expect(leaderboard).toHaveLength(3);

    const leaderboard1 = leaderboard!.find((l) => l.user === account1.accountAddress.toStringLong())!;
    const leaderboard2 = leaderboard!.find((l) => l.user === account2.accountAddress.toStringLong())!;
    const leaderboard3 = leaderboard!.find((l) => l.user === account3.accountAddress.toStringLong())!;

    expect(leaderboard1.exited).toEqual(true);
    expect(leaderboard1.lastExit0).toEqual(true);
    expect(Number(leaderboard1.profits) / Number(leaderboard1.losses)).toBeGreaterThan(1);

    expect(leaderboard2.exited).toEqual(true);
    expect(leaderboard2.lastExit0).toEqual(false);

    expect(leaderboard3.exited).toEqual(false);
    expect(leaderboard3.lastExit0).toBeNull();
    expect(Number(leaderboard3.profits) / Number(leaderboard3.losses)).toBeLessThan(1);
  }, 15000);

  it("verifies the data during a melee with no activity", async () => {
    await waitUntilCurrentMeleeEnds();
    const res = await emojicoin.arena.enter(
      getNextAccount(),
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

  it("verifies the data during a melee with no swaps", async () => {
    const account1 = getNextAccount();
    const account2 = getNextAccount();
    const account3 = getNextAccount();
    await enterHelper(account1, "symbol1");
    await enterHelper(account2, "symbol2");
    await enterHelper(account3, "symbol1");

    await emojicoin.arena.exit(account1, melee.market1.symbolEmojis, melee.market2.symbolEmojis);
    await emojicoin.arena.exit(account2, melee.market1.symbolEmojis, melee.market2.symbolEmojis);
    await waitUntilCurrentMeleeEnds();
    const res = await enterHelper(account1, "symbol1");

    await waitForProcessor(res);
    const leaderboard: ArenaLeaderboardHistoryModel[] | null = await postgrest
      .from(TableName.ArenaLeaderboardHistory)
      .select("*")
      .eq("melee_id", melee.view.meleeID.toString())
      .then((r) => r.data)
      .then((r) => (r === null ? null : r.map(toArenaLeaderboardHistoryModel)));

    expect(leaderboard).not.toBeNull();
    expect(leaderboard).toHaveLength(3);

    const leaderboard1 = leaderboard!.find((l) => l.user === account1.accountAddress.toStringLong())!;
    const leaderboard2 = leaderboard!.find((l) => l.user === account2.accountAddress.toStringLong())!;
    const leaderboard3 = leaderboard!.find((l) => l.user === account3.accountAddress.toStringLong())!;

    expect(leaderboard1.exited).toEqual(true);
    expect(leaderboard1.lastExit0).toEqual(true);

    expect(leaderboard2.exited).toEqual(true);
    expect(leaderboard2.lastExit0).toEqual(false);

    expect(leaderboard3.exited).toEqual(false);
    expect(leaderboard3.lastExit0).toBeNull();
  }, 15000);

  it("verifies the data during a melee with no exits", async () => {
    const account1 = getNextAccount();
    const account2 = getNextAccount();
    const account3 = getNextAccount();
    await enterHelper(account1, "symbol1");
    await enterHelper(account2, "symbol2");
    await enterHelper(account3, "symbol1");

    await emojicoin.arena.swap(account1, melee.market1.symbolEmojis, melee.market2.symbolEmojis);
    await emojicoin.arena.swap(account2, melee.market1.symbolEmojis, melee.market2.symbolEmojis);
    await waitUntilCurrentMeleeEnds();
    const res = await enterHelper(account1, "symbol1");

    await waitForProcessor(res);
    const leaderboard: ArenaLeaderboardHistoryModel[] | null = await postgrest
      .from(TableName.ArenaLeaderboardHistory)
      .select("*")
      .eq("melee_id", melee.view.meleeID.toString())
      .then((r) => r.data)
      .then((r) => (r === null ? null : r.map(toArenaLeaderboardHistoryModel)));

    expect(leaderboard).not.toBeNull();
    expect(leaderboard).toHaveLength(3);

    const leaderboard1 = leaderboard!.find((l) => l.user === account1.accountAddress.toStringLong())!;
    const leaderboard2 = leaderboard!.find((l) => l.user === account2.accountAddress.toStringLong())!;
    const leaderboard3 = leaderboard!.find((l) => l.user === account3.accountAddress.toStringLong())!;

    expect(leaderboard1.exited).toEqual(false);
    expect(leaderboard1.lastExit0).toBeNull();

    expect(leaderboard2.exited).toEqual(false);
    expect(leaderboard2.lastExit0).toBeNull();

    expect(leaderboard3.exited).toEqual(false);
    expect(leaderboard3.lastExit0).toBeNull();
  }, 15000);
});

describe("ensures arena info is working", () => {
  const emojicoin = new EmojicoinClient();

  let melee: MeleeEmojiData;

  const MELEE_DURATION = ONE_SECOND_MICROSECONDS * 15n;

  const publisher = getPublisher();

  let accountIndex = 200;

  const getNextAccount = () => getFundedAccount((accountIndex++).toString() as unknown as Parameters<typeof getFundedAccount>[0]);

  // Utility function to avoid repetitive code. Only the `account` and `escrowCoin` differs.
  const enterHelper = (account: Account, escrowCoin: "symbol1" | "symbol2") =>
    emojicoin.arena.enter(
      account,
      ONE_APT_BIGINT,
      false,
      melee.market1.symbolEmojis,
      melee.market2.symbolEmojis,
      escrowCoin
    );

  beforeAll(async () => {
    await waitUntilCurrentMeleeEnds();
    await setNextMeleeDurationAndEnsureCrank(MELEE_DURATION).then((res) => {
      melee = res.melee;
      return waitForEmojicoinIndexer(res.version, PROCESSING_WAIT_TIME);
    });
  }, 30000);

  beforeEach(async () => {
    await waitUntilCurrentMeleeEnds();
    // Crank the melee to end it and start a new one.
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
  }, 30000);

  it("verifies that all fields in the arena_info table are correctly calculated in a simple trading scenario", async () => {
    const account1 = getFundedAccount("420");
    const account2 = getFundedAccount("421");
    const account3 = getFundedAccount("422");

    let volume = 0n;

    const account1EnterRes = await enterHelper(account1, "symbol1");
    const account2EnterRes = await enterHelper(account2, "symbol1");
    const account3EnterRes = await enterHelper(account3, "symbol1");

    volume += account1EnterRes.events.arenaEnterEvents[0].quoteVolume;
    volume += account2EnterRes.events.arenaEnterEvents[0].quoteVolume;
    volume += account3EnterRes.events.arenaEnterEvents[0].quoteVolume;

    await emojicoin.arena.exit(account1, melee.market1.symbolEmojis, melee.market2.symbolEmojis);
    const swapRes = await emojicoin.arena.swap(
      account2,
      melee.market1.symbolEmojis,
      melee.market2.symbolEmojis
    );
    volume += swapRes.events.arenaSwapEvents[0].quoteVolume;
    const res = await emojicoin.arena.exit(
      account2,
      melee.market1.symbolEmojis,
      melee.market2.symbolEmojis
    );
    await waitForProcessor(res);

    const arenaInfo = await fetchArenaInfo({});

    expect(arenaInfo).toBeTruthy();
    expect(arenaInfo!.meleeID).toEqual(melee.view.meleeID);
    expect(arenaInfo!.duration).toEqual(melee.view.duration);
    expect(arenaInfo!.startTime).toEqual(melee.view.startTime);
    expect(arenaInfo!.maxMatchAmount).toEqual(melee.view.maxMatchAmount);
    expect(arenaInfo!.maxMatchPercentage).toEqual(melee.view.maxMatchPercentage);
    expect(arenaInfo!.volume).toEqual(volume);
    expect(arenaInfo!.emojicoin0Locked).toEqual(
      account3EnterRes.events.arenaEnterEvents[0].emojicoin0Proceeds
    );
    expect(arenaInfo!.emojicoin1Locked).toEqual(0n);
  }, 30000);

  it("verifies that all fields in the arena_info table are correctly calculated in a complex trading scenario", async () => {
    let volume = 0n;
    let emojicoin0Locked = 0n;
    let emojicoin1Locked = 0n;

    const accounts = [
      getNextAccount(),
      getNextAccount(),
      getNextAccount(),
      getNextAccount(),
      getNextAccount(),
      getNextAccount(),
      getNextAccount(),
      getNextAccount(),
    ];

    // Enter with all accounts alternating between symbol 1 and 2.
    for (const [account, index] of accounts.map((a, i) => [a, i] as [Ed25519Account, number])) {
      const enterRes = await enterHelper(
        account,
        `symbol${(index % 2) + 1}` as "symbol1" | "symbol2"
      );
      volume += enterRes.events.arenaEnterEvents[0].quoteVolume;
      emojicoin0Locked += enterRes.events.arenaEnterEvents[0].emojicoin0Proceeds;
      emojicoin1Locked += enterRes.events.arenaEnterEvents[0].emojicoin1Proceeds;
    }

    // Swap with all accounts.
    for (const account of accounts) {
      const swapRes = await emojicoin.arena.swap(
        account,
        melee.market1.symbolEmojis,
        melee.market2.symbolEmojis
      );
      volume += swapRes.events.arenaSwapEvents[0].quoteVolume;
      const diff = getEmojicoinLockedDiffFromSwapRes(swapRes, melee);
      emojicoin0Locked += diff.emojicoin0Locked;
      emojicoin1Locked += diff.emojicoin1Locked;
    }

    // Swap with half of the accounts.
    for (const account of accounts.slice(0, Math.floor(accounts.length / 2))) {
      const swapRes = await emojicoin.arena.swap(
        account,
        melee.market1.symbolEmojis,
        melee.market2.symbolEmojis
      );
      volume += swapRes.events.arenaSwapEvents[0].quoteVolume;
      const diff = getEmojicoinLockedDiffFromSwapRes(swapRes, melee);
      emojicoin0Locked += diff.emojicoin0Locked;
      emojicoin1Locked += diff.emojicoin1Locked;
    }

    let lastExitRes;
    for (const account of accounts.slice(Math.floor(accounts.length / 2))) {
      lastExitRes = await emojicoin.arena.exit(
        account,
        melee.market1.symbolEmojis,
        melee.market2.symbolEmojis
      );
      emojicoin0Locked -= lastExitRes.events.arenaExitEvents[0].emojicoin0Proceeds;
      emojicoin1Locked -= lastExitRes.events.arenaExitEvents[0].emojicoin1Proceeds;
    }

    waitForProcessor(lastExitRes!);

    const arenaPositions: ArenaPositionModel[] | null = await postgrest
      .from(TableName.ArenaPosition)
      .select("*")
      .eq("melee_id", melee.view.meleeID)
      .then((r) => r.data)
      .then((r) => (r === null ? null : r.map(toArenaPositionModel)));

    expect(arenaPositions).not.toBeNull();
    expect(arenaPositions!.reduce((p, c) => p + c.emojicoin0Balance, 0n)).toEqual(emojicoin0Locked);
    expect(arenaPositions!.reduce((p, c) => p + c.emojicoin1Balance, 0n)).toEqual(emojicoin1Locked);

    const arenaInfo = await fetchArenaInfo({});

    expect(arenaInfo).toBeTruthy();
    expect(arenaInfo!.meleeID).toEqual(melee.view.meleeID);
    expect(arenaInfo!.duration).toEqual(melee.view.duration);
    expect(arenaInfo!.startTime).toEqual(melee.view.startTime);
    expect(arenaInfo!.maxMatchAmount).toEqual(melee.view.maxMatchAmount);
    expect(arenaInfo!.maxMatchPercentage).toEqual(melee.view.maxMatchPercentage);
    expect(arenaInfo!.volume).toEqual(volume);
    expect(arenaInfo!.emojicoin0Locked).toEqual(emojicoin0Locked);
    expect(arenaInfo!.emojicoin1Locked).toEqual(emojicoin1Locked);
  }, 30000);
});
