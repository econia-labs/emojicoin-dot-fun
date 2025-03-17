import Big from "big.js";
import {
  ArenaPeriod,
  calculateCurvePrice,
  ONE_APT_BIGINT,
  sleep,
  type SymbolEmoji,
} from "../../src";
import { EmojicoinClient } from "../../src/client/emojicoin-client";
import {
  type CandlestickModel,
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

describe("ensures arena candlesticks work", () => {
  const emojicoin = new EmojicoinClient();

  const emojis: SymbolEmoji[][] = [["♑"], ["♒"]];

  beforeEach(async () => {
    await waitForNew15sPeriodBoundary();
    return true;
  }, 70000);

  it("verifies that candlesticks are correct on markets without prior data", async () => {
    // We have to swap with the accounts that registered the markets as the
    // markets were never traded on and can be in the grace period.
    //
    // The market registrant can either be 0xf00d if the market is one of
    // the two initial markets, or one of the funded accounts (0x000 to 0xfff).
    const account = getFundedAccount("667");

    let resReg = await emojicoin.register(getFundedAccount("667"), emojis[0]);
    let market = resReg.registration.event;

    await waitForProcessor(resReg);

    let candlesticks: CandlestickModel[] | null = null;
    let fifteenSecondCandlesticks: CandlestickModel[] = [];
    let expectedVolume = 0n;
    let state: MarketLatestStateEventModel = {} as MarketLatestStateEventModel;

    const refreshCandlesticksData = async () => {
      candlesticks = await postgrest
        .from(TableName.Candlesticks)
        .select("*")
        .eq("market_id", market.marketID)
        .then((r) => r.data)
        .then((r) => (r === null ? null : r.map(toCandlestickModel)));
    };
    const refreshStateData = async () => {
      state = await postgrest
        .from(TableName.MarketLatestStateEvent)
        .select("*")
        .eq("market_id", market.marketID)
        .single()
        .then((r) => r.data)
        .then((r) => toMarketLatestStateEventModel(r));
    };

    await refreshCandlesticksData();
    await refreshStateData();

    expect(candlesticks).not.toBeNull();
    expect(candlesticks!.length).toBeGreaterThan(0);

    expect(state.lastSwap.avgExecutionPriceQ64).toEqual(0n);

    const firstPrice = calculateCurvePrice(state.state);

    let expectedPrices = {
        open: firstPrice,
        close: firstPrice,
        low: firstPrice,
        high: firstPrice,
    };

    const updateOhlc = () => {
      const price = calculateCurvePrice(state.state);
      expectedPrices = {
        open: expectedPrices.open,
        close: price,
        low: expectedPrices.low.lt(price) ? expectedPrices.low : price,
        high: expectedPrices.high.gt(price) ? expectedPrices.high : price,
      }
    }

    // Check initial state of candlesticks.

    fifteenSecondCandlesticks = candlesticks!.filter((c) => c.period === ArenaPeriod.Period15S);

    expect(fifteenSecondCandlesticks).toHaveLength(1);
    expect(fifteenSecondCandlesticks[0].lowPrice.toString()).toEqual(expectedPrices.low.round(21).toString());
    expect(fifteenSecondCandlesticks[0].highPrice.toString()).toEqual(expectedPrices.high.round(21).toString());
    expect(fifteenSecondCandlesticks[0].openPrice.toString()).toEqual(expectedPrices.open.round(21).toString());
    expect(fifteenSecondCandlesticks[0].closePrice.toString()).toEqual(expectedPrices.close.round(21).toString());
    expect(fifteenSecondCandlesticks[0].volume).toEqual(expectedVolume);

    // Check candlesticks after a buy.

    const buyRes = await emojicoin.buy(account, emojis[0], ONE_APT_BIGINT);
    await waitForProcessor(buyRes);

    await refreshCandlesticksData();
    await refreshStateData();

    expect(candlesticks).not.toBeNull();

    fifteenSecondCandlesticks = candlesticks!.filter((c) => c.period === ArenaPeriod.Period15S);

    updateOhlc();

    expectedVolume = buyRes.swap.event.quoteVolume;

    expect(fifteenSecondCandlesticks).toHaveLength(1);
    expect(fifteenSecondCandlesticks[0].lowPrice.toString()).toEqual(expectedPrices.low.round(21).toString());
    expect(fifteenSecondCandlesticks[0].highPrice.toString()).toEqual(expectedPrices.high.round(21).toString());
    expect(fifteenSecondCandlesticks[0].openPrice.toString()).toEqual(expectedPrices.open.round(21).toString());
    expect(fifteenSecondCandlesticks[0].closePrice.toString()).toEqual(expectedPrices.close.round(21).toString());
    expect(fifteenSecondCandlesticks[0].volume).toEqual(expectedVolume);

    // Check candlesticks after a sell.

    const sellRes = await emojicoin.sell(account, emojis[0], buyRes.swap.event.netProceeds / 2n);

    await waitForProcessor(sellRes);

    await refreshCandlesticksData();
    await refreshStateData();

    updateOhlc();

    expectedVolume += sellRes.swap.event.quoteVolume;

    expect(candlesticks).not.toBeNull();

    fifteenSecondCandlesticks = candlesticks!.filter((c) => c.period === ArenaPeriod.Period15S);

    expect(fifteenSecondCandlesticks).toHaveLength(1);
    expect(fifteenSecondCandlesticks[0].lowPrice.toString()).toEqual(expectedPrices.low.round(21).toString());
    expect(fifteenSecondCandlesticks[0].highPrice.toString()).toEqual(expectedPrices.high.round(21).toString());
    expect(fifteenSecondCandlesticks[0].openPrice.toString()).toEqual(expectedPrices.open.round(21).toString());
    expect(fifteenSecondCandlesticks[0].closePrice.toString()).toEqual(expectedPrices.close.round(21).toString());
    expect(fifteenSecondCandlesticks[0].volume).toEqual(expectedVolume);

    // Check old candlesticks aren't affected when trading on new candlesticks.

    await waitForNew15sPeriodBoundary();

    await waitForProcessor(await emojicoin.buy(account, emojis[0], ONE_APT_BIGINT));

    await refreshCandlesticksData();
    await refreshStateData();

    const newPrice = calculateCurvePrice(state.state);
    let newExpectedPrices = {
      open: newPrice,
      close: newPrice,
      high: newPrice,
      low: newPrice,
    }

    fifteenSecondCandlesticks = candlesticks!
      .filter((c) => c.period === ArenaPeriod.Period15S)
      .toSorted((a, b) => a.startTime.getTime() - b.startTime.getTime());

    expect(fifteenSecondCandlesticks).toHaveLength(2);
    expect(fifteenSecondCandlesticks[0].lowPrice.toString()).toEqual(expectedPrices.low.round(21).toString());
    expect(fifteenSecondCandlesticks[0].highPrice.toString()).toEqual(expectedPrices.high.round(21).toString());
    expect(fifteenSecondCandlesticks[0].openPrice.toString()).toEqual(expectedPrices.open.round(21).toString());
    expect(fifteenSecondCandlesticks[0].closePrice.toString()).toEqual(expectedPrices.close.round(21).toString());
    expect(fifteenSecondCandlesticks[0].volume).toEqual(expectedVolume);

    expect(fifteenSecondCandlesticks[1].lowPrice.toString()).toEqual(newExpectedPrices.low.round(21).toString());
    expect(fifteenSecondCandlesticks[1].highPrice.toString()).toEqual(newExpectedPrices.high.round(21).toString());
    expect(fifteenSecondCandlesticks[1].openPrice.toString()).toEqual(newExpectedPrices.open.round(21).toString());
    expect(fifteenSecondCandlesticks[1].closePrice.toString()).toEqual(newExpectedPrices.close.round(21).toString());
    expect(fifteenSecondCandlesticks[1].volume).toEqual(state.lastSwap.quoteVolume);

    // Check data isn't affected by trading on another market.

    await emojicoin.register(account, emojis[1]);
    await waitForProcessor(await emojicoin.buy(account, emojis[1], ONE_APT_BIGINT));

    await refreshCandlesticksData();
    await refreshStateData();

    fifteenSecondCandlesticks = candlesticks!
      .filter((c) => c.period === ArenaPeriod.Period15S)
      .toSorted((a, b) => a.startTime.getTime() - b.startTime.getTime());

    expect(fifteenSecondCandlesticks[1].lowPrice.toString()).toEqual(newExpectedPrices.low.round(21).toString());
    expect(fifteenSecondCandlesticks[1].highPrice.toString()).toEqual(newExpectedPrices.high.round(21).toString());
    expect(fifteenSecondCandlesticks[1].openPrice.toString()).toEqual(newExpectedPrices.open.round(21).toString());
    expect(fifteenSecondCandlesticks[1].closePrice.toString()).toEqual(newExpectedPrices.close.round(21).toString());
    expect(fifteenSecondCandlesticks[1].volume).toEqual(state.lastSwap.quoteVolume);
  }, 30000);
});
