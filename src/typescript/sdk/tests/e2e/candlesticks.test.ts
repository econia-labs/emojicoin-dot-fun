// cspell:word OHLCV

import {
  calculateCurvePrice,
  ONE_APT_BIGINT,
  Period,
  PERIODS,
  sleep,
  type SymbolEmoji,
  toLatestMarketCandlesticksModel,
} from "../../src";
import { EmojicoinClient } from "../../src/client/emojicoin-client";
import {
  type CandlestickModel,
  fetchArenaLatestCandlesticks,
  fetchMarketLatestCandlesticks,
  type MarketLatestStateEventModel,
  postgrest,
  TableName,
  toCandlestickModel,
  toMarketLatestStateEventModel,
} from "../../src/indexer-v2";
import { getFundedAccount } from "../utils/test-accounts";
import { waitForProcessor } from "./helpers";

const TWO_SECONDS = 2000;

const waitForNew15sPeriodBoundary = async () => {
  const now = new Date().getTime();
  const fifteenSecondStart = now - (now % 15000);
  const fifteenSecondEnd = fifteenSecondStart + 15000;
  const bufferForTimeDrift = TWO_SECONDS;
  const timeToWait = Math.max(fifteenSecondEnd - now, 0) + bufferForTimeDrift;
  await sleep(timeToWait);
};

const expectEqualOHLCV = (
  fromDb: CandlestickModel,
  calculated: { open: number; high: number; low: number; close: number; volume: bigint }
) => {
  expect(fromDb.lowPrice).toEqual(calculated.low);
  expect(fromDb.highPrice).toEqual(calculated.high);
  expect(fromDb.openPrice).toEqual(calculated.open);
  expect(fromDb.closePrice).toEqual(calculated.close);
  expect(fromDb.volume).toEqual(calculated.volume);
};

describe("ensures non-periodic state event based candlesticks work", () => {
  const emojicoin = new EmojicoinClient();

  const emojis: SymbolEmoji[][] = [["♑"], ["♒"], ["🧻"], ["🧻", "🧻"]];

  beforeEach(async () => {
    await waitForNew15sPeriodBoundary();
    return true;
  }, 70000);

  function checkNumberOfUniqueLatestCandlesticks(
    latestCandlesticks: Awaited<
      ReturnType<typeof fetchArenaLatestCandlesticks | typeof fetchMarketLatestCandlesticks>
    >
  ) {
    const numPeriodTypes = PERIODS.size;
    expect(latestCandlesticks).not.toBe(null);
    expect(latestCandlesticks).toBeTruthy();
    expect(latestCandlesticks).toHaveLength(numPeriodTypes);

    const uniquePeriods = new Set(Object.keys(latestCandlesticks!));
    expect(uniquePeriods.size).toEqual(numPeriodTypes);
  }

  it("receives all latest candlesticks for a market as soon as it is registered", async () => {
    const account = getFundedAccount("668");
    const { marketID } = await emojicoin.register(account, emojis[2]).then(async (res) => {
      await waitForProcessor(res.response);
      return res.registration.event;
    });

    const latestCandlesticks = (await fetchMarketLatestCandlesticks(marketID))!;
    checkNumberOfUniqueLatestCandlesticks(latestCandlesticks);
  });

  it("receives updated latest 15s candlestick after a market is traded on", async () => {
    const account = getFundedAccount("669");
    const { marketID } = await emojicoin.register(account, emojis[3]).then(async (res) => {
      await waitForProcessor(res.response);
      return res.registration.event;
    });

    const firstLatestCandlesticksRes = (await fetchMarketLatestCandlesticks(marketID))!;
    checkNumberOfUniqueLatestCandlesticks(firstLatestCandlesticksRes);

    const firstLatestCandlesticks = toLatestMarketCandlesticksModel(firstLatestCandlesticksRes);
    const first15s = firstLatestCandlesticks[Period.Period15S]!;
    expect(first15s).toBeTruthy();

    await sleep(15001);
    const inputAmount = ONE_APT_BIGINT;
    const buyRes = await emojicoin.buy(account, emojis[3], inputAmount);
    await waitForProcessor(buyRes);
    const secondLatestCandlesticksRes = (await fetchMarketLatestCandlesticks(marketID))!;
    checkNumberOfUniqueLatestCandlesticks(secondLatestCandlesticksRes);
    const secondLatestCandlesticks = toLatestMarketCandlesticksModel(secondLatestCandlesticksRes);
    const second15s = secondLatestCandlesticks[Period.Period15S]!;
    expect(second15s).toBeTruthy();
    expect(second15s.version).toBe(BigInt(buyRes.response.version));
    expect(second15s.volume).toBe(inputAmount);
    const firstStartTime = first15s.startTime.getTime();
    const secondStartTime = second15s.startTime.getTime();
    expect(secondStartTime).not.toEqual(firstStartTime);
    const nextTwoStartTimes = [firstStartTime + 15000, firstStartTime + 30000];
    expect(nextTwoStartTimes).toContain(second15s.startTime.getTime());
    expect(second15s.guid).not.toEqual(first15s.guid);
  }, 30000);

  it("receives no candlesticks for a melee if it has no trading activity yet", async () => {
    // Since the first melee is created in test prior to the test harness even firing up and isn't
    // ever traded on, this test can just check that melee specifically.
    const FIRST_MELEE_ID = 1;

    const latestArenaCandlesticks = (await fetchArenaLatestCandlesticks(FIRST_MELEE_ID))!;
    // Note that the postgres function actually returns 0 rows (not null) if there's no data yet,
    // but it's coerced to `null` by the TypeScript SDK function call to make things less confusing.
    expect(latestArenaCandlesticks).toBeNull();
  });

  it("verifies that candlesticks are correct on markets without prior data", async () => {
    // We have to swap with the accounts that registered the markets as the
    // markets were never traded on and can be in the grace period.
    //
    // The market registrant can either be 0xf00d if the market is one of
    // the two initial markets, or one of the funded accounts (0x000 to 0xfff).
    const account = getFundedAccount("667");

    const registerResponse = await emojicoin.register(account, emojis[0]);
    const { marketID } = registerResponse.registration.event;

    await waitForProcessor(registerResponse);

    let candlesticks: CandlestickModel[] | null = null;
    let fifteenSecondCandlesticks: CandlestickModel[] = [];
    let state: MarketLatestStateEventModel = {} as MarketLatestStateEventModel;

    const refreshCandlesticksAndStateData = async () => {
      candlesticks = await postgrest
        .from(TableName.Candlesticks)
        .select("*")
        .eq("market_id", marketID)
        .then((r) => r.data)
        .then((r) => (r === null ? null : r.map(toCandlestickModel)));
      state = await postgrest
        .from(TableName.MarketLatestStateEvent)
        .select("*")
        .eq("market_id", marketID)
        .single()
        .then((r) => r.data)
        .then(toMarketLatestStateEventModel);
    };

    await refreshCandlesticksAndStateData();

    expect(candlesticks).not.toBeNull();
    expect(candlesticks!.length).toBeGreaterThan(0);

    expect(state.lastSwap.avgExecutionPriceQ64).toEqual(0n);
    expect(state.lastSwap.quoteVolume).toEqual(0n);

    const firstPrice = calculateCurvePrice(state.state).toNumber();

    let firstCandlestick = {
      open: firstPrice,
      close: firstPrice,
      low: firstPrice,
      high: firstPrice,
      volume: state.lastSwap.quoteVolume,
    };

    const updateFirstCandlestickOHLCV = () => {
      const price = calculateCurvePrice(state.state).toNumber();
      firstCandlestick = {
        open: firstCandlestick.open,
        close: price,
        low: Math.min(firstCandlestick.low, price),
        high: Math.max(firstCandlestick.high, price),
        volume: firstCandlestick.volume + state.lastSwap.quoteVolume,
      };
    };

    // ---------------------------------------------------------------------------------------------
    // Check initial state of candlesticks.
    // ---------------------------------------------------------------------------------------------
    fifteenSecondCandlesticks = candlesticks!.filter((c) => c.period === Period.Period15S);

    expect(fifteenSecondCandlesticks).toHaveLength(1);
    expectEqualOHLCV(fifteenSecondCandlesticks[0], firstCandlestick);

    // ---------------------------------------------------------------------------------------------
    // Check candlesticks after a buy.
    // ---------------------------------------------------------------------------------------------
    const buyRes = await emojicoin.buy(account, emojis[0], ONE_APT_BIGINT);
    await waitForProcessor(buyRes);
    await refreshCandlesticksAndStateData();

    updateFirstCandlestickOHLCV();

    expect(candlesticks).not.toBeNull();
    fifteenSecondCandlesticks = candlesticks!.filter((c) => c.period === Period.Period15S);
    expect(fifteenSecondCandlesticks).toHaveLength(1);
    expectEqualOHLCV(fifteenSecondCandlesticks[0], firstCandlestick);

    // ---------------------------------------------------------------------------------------------
    // Check candlesticks after a sell.
    // ---------------------------------------------------------------------------------------------
    const sellRes = await emojicoin.sell(account, emojis[0], buyRes.swap.event.netProceeds / 2n);
    await waitForProcessor(sellRes);
    await refreshCandlesticksAndStateData();

    updateFirstCandlestickOHLCV();

    expect(candlesticks).not.toBeNull();
    fifteenSecondCandlesticks = candlesticks!.filter((c) => c.period === Period.Period15S);
    expect(fifteenSecondCandlesticks).toHaveLength(1);
    expectEqualOHLCV(fifteenSecondCandlesticks[0], firstCandlestick);

    // ---------------------------------------------------------------------------------------------
    // Check old candlesticks aren't affected when trading on new candlesticks.
    // ---------------------------------------------------------------------------------------------
    await waitForNew15sPeriodBoundary();
    await waitForProcessor(await emojicoin.buy(account, emojis[0], ONE_APT_BIGINT));
    await refreshCandlesticksAndStateData();

    const newPrice = calculateCurvePrice(state.state).toNumber();
    // Use a fresh candlestick since a new period boundary has started.
    const secondCandlestick = {
      open: newPrice,
      close: newPrice,
      high: newPrice,
      low: newPrice,
      volume: state.lastSwap.quoteVolume,
    };

    expect(candlesticks).not.toBeNull();
    fifteenSecondCandlesticks = candlesticks!
      .filter((c) => c.period === Period.Period15S)
      .toSorted((a, b) => a.startTime.getTime() - b.startTime.getTime());

    expect(fifteenSecondCandlesticks).toHaveLength(2);
    expectEqualOHLCV(fifteenSecondCandlesticks[0], firstCandlestick);
    expectEqualOHLCV(fifteenSecondCandlesticks[1], secondCandlestick);

    // ---------------------------------------------------------------------------------------------
    // Check data isn't affected by trading on another market.
    // ---------------------------------------------------------------------------------------------
    await emojicoin.register(account, emojis[1]);
    await waitForProcessor(await emojicoin.buy(account, emojis[1], ONE_APT_BIGINT));
    await refreshCandlesticksAndStateData();

    fifteenSecondCandlesticks = candlesticks!
      .filter((c) => c.period === Period.Period15S)
      .toSorted((a, b) => a.startTime.getTime() - b.startTime.getTime());

    expect(fifteenSecondCandlesticks).toHaveLength(2);
    expectEqualOHLCV(fifteenSecondCandlesticks[1], secondCandlestick);
  }, 60000);
});
