import type { Account } from "@aptos-labs/ts-sdk";

import {
  ArenaPeriod,
  calculateCurvePrice,
  ONE_APT_BIGINT,
  sleep,
  type SymbolEmoji,
} from "../../../src";
import { EmojicoinClient } from "../../../src/client/emojicoin-client";
import {
  type ArenaCandlestickModel,
  type MarketLatestStateEventModel,
  postgrest,
  TableName,
  toArenaCandlestickModel,
  toMarketLatestStateEventModel,
} from "../../../src/indexer-v2";
import {
  fetchArenaMeleeView,
  fetchMeleeEmojiData,
  type MeleeEmojiData,
} from "../../../src/utils/arena/helpers";
import { getPublisher } from "../../utils/helpers";
import { type FundedAccountIndex, getFundedAccount } from "../../utils/test-accounts";
import { waitForProcessor } from "../helpers";
import {
  ONE_SECOND_MICROSECONDS,
  setNextMeleeDurationAndEnsureCrank,
  waitUntilCurrentMeleeEnds,
} from "./utils";

const TWO_SECONDS = 2000;

describe("ensures arena candlesticks work", () => {
  const emojicoin = new EmojicoinClient();

  let melee: MeleeEmojiData;

  const MELEE_DURATION = ONE_SECOND_MICROSECONDS * 60n;

  const publisher = getPublisher();

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

  beforeAll(async () => {
    for (const emoji of emojis) {
      await emojicoin.register(getFundedAccount("667"), emoji);
    }
    await waitUntilCurrentMeleeEnds();
    await setNextMeleeDurationAndEnsureCrank(MELEE_DURATION).then((res) => {
      melee = res.melee;
      return waitForProcessor(res);
    });
  }, 70000);

  beforeEach(async () => {
    await waitUntilCurrentMeleeEnds();
    // Crank the melee to end it and start a new one.
    const res = await emojicoin.arena.enter(
      publisher,
      1n,
      false,
      melee.market0.symbolEmojis,
      melee.market1.symbolEmojis,
      "symbol0"
    );
    melee = await fetchArenaMeleeView(res.arena.event.meleeID).then(fetchMeleeEmojiData);
    await waitForProcessor(res);

    return true;
  }, 70000);

  it("verifies that arena candlesticks are correct on markets without prior data", async () => {
    // We have to swap with the accounts that registered the markets as the
    // markets were never traded on and can be in the grace period.
    //
    // The market registrant can either be 0xf00d if the market is one of
    // the two initial markets, or one of the funded accounts (0x000 to 0xfff).

    const registrant0: string = await postgrest
      .from(TableName.MarketRegistrationEvents)
      .select("registrant")
      .eq("market_id", melee.market0.marketID)
      .then((r) => r.data![0].registrant.substring(2, 5));
    const registrant1: string = await postgrest
      .from(TableName.MarketRegistrationEvents)
      .select("registrant")
      .eq("market_id", melee.market1.marketID)
      .then((r) => r.data![0].registrant.substring(2, 5));

    let account1: Account;
    let account2: Account;

    try {
      account1 = getFundedAccount(registrant0 as unknown as FundedAccountIndex);
    } catch (e) {
      account1 = getPublisher();
    }

    try {
      account2 = getFundedAccount(registrant1 as unknown as FundedAccountIndex);
    } catch (e) {
      account2 = getPublisher();
    }

    let candlesticks: ArenaCandlestickModel[] | null = null;
    let fifteenSecondCandles: ArenaCandlestickModel[] = [];
    let expectedPrice = 1;
    let expectedVolume = 0n;
    let state0: MarketLatestStateEventModel = {} as MarketLatestStateEventModel;
    let state1: MarketLatestStateEventModel = {} as MarketLatestStateEventModel;

    const refreshCandlesticksData = async () => {
      candlesticks = await postgrest
        .from(TableName.ArenaCandlesticks)
        .select("*")
        .eq("melee_id", melee.view.meleeID)
        .then((r) => r.data)
        .then((r) => (r === null ? null : r.map(toArenaCandlestickModel)));
    };
    const refreshStateData = async () => {
      state0 = await postgrest
        .from(TableName.MarketLatestStateEvent)
        .select("*")
        .eq("market_id", melee.market0.marketID)
        .single()
        .then((r) => r.data)
        .then((r) => toMarketLatestStateEventModel(r));
      state1 = await postgrest
        .from(TableName.MarketLatestStateEvent)
        .select("*")
        .eq("market_id", melee.market1.marketID)
        .single()
        .then((r) => r.data)
        .then((r) => toMarketLatestStateEventModel(r));
    };
    const waitForNew15sPeriodBoundary = async () => {
      const now = new Date().getTime();
      const fifteenSecondStart = now - (now % 15000);
      const fifteenSecondEnd = fifteenSecondStart + 15000;
      const bufferForTimeDrift = TWO_SECONDS;
      const timeToWait = Math.max(fifteenSecondEnd - now, 0) + bufferForTimeDrift;
      await sleep(timeToWait);
    };
    const calculatePrice = (
      state0: MarketLatestStateEventModel,
      state1: MarketLatestStateEventModel
    ) => {
      const price0 = calculateCurvePrice(state0.state);
      const price1 = calculateCurvePrice(state1.state);
      return price0.div(price1).toNumber();
    };

    await refreshCandlesticksData();
    await refreshStateData();

    expect(candlesticks).not.toBeNull();
    expect(candlesticks).toHaveLength(0);

    expect(state0.lastSwap.avgExecutionPriceQ64).toEqual(0n);
    expect(state1.lastSwap.avgExecutionPriceQ64).toEqual(0n);

    await waitForNew15sPeriodBoundary();

    // ATM, no swaps are present on either market.

    await waitForProcessor(
      await emojicoin.arena.enter(
        account1,
        ONE_APT_BIGINT,
        false,
        melee.market0.symbolEmojis,
        melee.market1.symbolEmojis,
        "symbol0"
      )
    );

    await refreshCandlesticksData();
    await refreshStateData();

    expect(candlesticks).not.toBeNull();
    expect(candlesticks!.length).toBeGreaterThan(0);

    fifteenSecondCandles = candlesticks!.filter((c) => c.period === ArenaPeriod.Period15S);

    expectedPrice = calculatePrice(state0, state1);
    const expectedOpenPrice = expectedPrice;

    expect(fifteenSecondCandles).toHaveLength(1);
    expect(fifteenSecondCandles[0].nSwaps).toEqual(1n);
    expect(fifteenSecondCandles[0].lowPrice).toEqual(expectedPrice);
    expect(fifteenSecondCandles[0].highPrice).toEqual(expectedPrice);
    expect(fifteenSecondCandles[0].openPrice).toEqual(expectedOpenPrice);
    expect(fifteenSecondCandles[0].closePrice).toEqual(expectedPrice);
    expect(fifteenSecondCandles[0].volume).toEqual(state0!.lastSwap.quoteVolume);

    // No swap is generated from the exit.

    await emojicoin.arena.exit(account1, melee.market0.symbolEmojis, melee.market1.symbolEmojis);

    // Here, we make a swap on the other market.

    await waitForProcessor(
      await emojicoin.arena.enter(
        account2,
        ONE_APT_BIGINT,
        false,
        melee.market0.symbolEmojis,
        melee.market1.symbolEmojis,
        "symbol1"
      )
    );

    await refreshCandlesticksData();
    await refreshStateData();

    let oldExpectedPrice = expectedPrice;
    expectedPrice = calculatePrice(state0, state1);

    expectedVolume = state0!.lastSwap.quoteVolume + state1!.lastSwap.quoteVolume;

    expect(candlesticks).not.toBeNull();

    fifteenSecondCandles = candlesticks!.filter((c) => c.period === ArenaPeriod.Period15S);

    expect(fifteenSecondCandles).toHaveLength(1);
    expect(fifteenSecondCandles[0].nSwaps).toEqual(2n);
    expect(fifteenSecondCandles[0].lowPrice).toBeCloseTo(expectedPrice, 5);
    expect(fifteenSecondCandles[0].highPrice).toBeCloseTo(oldExpectedPrice, 5);
    expect(fifteenSecondCandles[0].openPrice).toBeCloseTo(expectedOpenPrice, 5);
    expect(fifteenSecondCandles[0].closePrice).toBeCloseTo(expectedPrice, 5);
    expect(fifteenSecondCandles[0].volume).toEqual(expectedVolume);

    // We swap for emojicoin 1 to emojicoin 0.

    await waitForProcessor(
      await emojicoin.arena.swap(account2, melee.market0.symbolEmojis, melee.market1.symbolEmojis)
    );

    await refreshCandlesticksData();
    await refreshStateData();

    expect(candlesticks).not.toBeNull();

    oldExpectedPrice = expectedPrice;

    expectedPrice = calculatePrice(state0!, state1!);
    expectedVolume += state0!.lastSwap.quoteVolume + state1!.lastSwap.quoteVolume;
    fifteenSecondCandles = candlesticks!.filter((c) => c.period === ArenaPeriod.Period15S);

    expect(fifteenSecondCandles).toHaveLength(1);
    expect(fifteenSecondCandles[0].nSwaps).toEqual(4n);
    expect(fifteenSecondCandles[0].lowPrice).toBeCloseTo(oldExpectedPrice, 5);
    expect(fifteenSecondCandles[0].highPrice).toBeCloseTo(expectedPrice, 5);
    expect(fifteenSecondCandles[0].openPrice).toBeCloseTo(expectedOpenPrice, 5);
    expect(fifteenSecondCandles[0].closePrice).toBeCloseTo(expectedPrice, 5);
    expect(fifteenSecondCandles[0].volume).toEqual(expectedVolume);

    await waitForNew15sPeriodBoundary();

    // This swap should happen in the next candlestick boundary, so it should generate a new one.

    await waitForProcessor(
      await emojicoin.arena.swap(account2, melee.market0.symbolEmojis, melee.market1.symbolEmojis)
    );

    const oldSwap1 = state1!;

    await refreshCandlesticksData();
    await refreshStateData();

    expect(candlesticks).not.toBeNull();

    fifteenSecondCandles = candlesticks!.filter((c) => c.period === ArenaPeriod.Period15S);

    expect(fifteenSecondCandles).toHaveLength(2);
    // We check that the previous candle hasn't changed
    expect(fifteenSecondCandles[0].nSwaps).toEqual(4n);
    expect(fifteenSecondCandles[0].lowPrice).toBeCloseTo(oldExpectedPrice, 5);
    expect(fifteenSecondCandles[0].highPrice).toBeCloseTo(expectedPrice, 5);
    expect(fifteenSecondCandles[0].openPrice).toBeCloseTo(expectedOpenPrice, 5);
    expect(fifteenSecondCandles[0].closePrice).toBeCloseTo(expectedPrice, 5);
    expect(fifteenSecondCandles[0].volume).toEqual(expectedVolume);

    expectedVolume = state0!.lastSwap.quoteVolume + state1!.lastSwap.quoteVolume;

    // When an arena swap happens, they are actually slightly staggered, meaning
    // that two swaps happen (one on each market), one after the other. This
    // means that with one arena swap, there are two price updates.
    //
    // Example:
    //
    // Emojicoin A and emojicoin B both have the same price: 1.
    //
    // This makes the price of A/B also 1.
    //
    // Someone makes an arena swap from A to B.
    //
    // First, there is a swap (sell) on market A, where emojicoin A is sold for APT.
    //
    // This makes the price of emojicoin A go down to 0.99.
    //
    // The A/B price is now 0.99 (0.99 / 1).
    //
    // Then, there is a swap (buy) on market B, where APT is sold for emojicoin B.
    //
    // This marks the price of emojicoin B go up to 1.01.
    //
    // The A/B price is now ~0.98 (0.99 / 1.01).
    //
    // The same mechanism happens in reverse when there is a swap from B to A.
    //
    // If the initial price of A/B is 1, the end price would be ~1.02, with an
    // intermediary price of 1.01.
    //
    // Because of this, despite there only being one "arena swap" in this
    // candlestick time boundary, there are two different prices for low/high
    // and for open/close.

    const intermediaryExpectedPrice = calculatePrice(state0!, oldSwap1);
    expectedPrice = calculatePrice(state0!, state1!);

    expect(fifteenSecondCandles[1].lowPrice).toBeCloseTo(expectedPrice, 5);
    expect(fifteenSecondCandles[1].highPrice).toBeCloseTo(intermediaryExpectedPrice, 5);
    expect(fifteenSecondCandles[1].openPrice).toBeCloseTo(intermediaryExpectedPrice, 5);
    expect(fifteenSecondCandles[1].closePrice).toBeCloseTo(expectedPrice, 5);
    expect(fifteenSecondCandles[1].nSwaps).toEqual(2n);
    expect(fifteenSecondCandles[1].volume).toEqual(expectedVolume);
  }, 70000);
});
