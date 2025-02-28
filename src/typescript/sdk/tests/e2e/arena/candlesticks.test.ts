import { ArenaPeriod, ONE_APT_BIGINT, sleep, SymbolEmoji } from "../../../src";
import { EmojicoinClient } from "../../../src/client/emojicoin-client";
import {
  ArenaCandlestickModel,
  ORDER_BY,
  postgrest,
  SwapEventModel,
  TableName,
  toArenaCandlestickModel,
  toSwapEventModel,
  waitForEmojicoinIndexer,
} from "../../../src/indexer-v2";
import {
  fetchArenaMeleeView,
  fetchMeleeEmojiData,
  type MeleeEmojiData,
} from "../../../src/markets/arena-utils";
import { FundedAccountIndex, getFundedAccount } from "../../utils/test-accounts";
import {
  ONE_SECOND_MICROSECONDS,
  setNextMeleeDurationAndEnsureCrank,
  waitUntilCurrentMeleeEnds,
  PROCESSING_WAIT_TIME,
  waitForProcessor,
} from "./utils";
import { getPublisher } from "../../utils/helpers";
import { Account } from "@aptos-labs/ts-sdk";
import Big from "big.js";

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
      return waitForEmojicoinIndexer(res.version, PROCESSING_WAIT_TIME);
    });
  }, 70000);

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
  }, 70000);

  it("verifies that arena candlesticks are correct on markets without prior data", async () => {
    // We have to swap with the accounts that registered the markets as the
    // markets were never traded on and can be in the grace period.
    //
    // The market registrant can either be 0xfood if the market is one of
    // the two initial markets, or one of the funded accounts (0x000 to 0xfff).

    const registrant0: string = await postgrest
      .from(TableName.MarketRegistrationEvents)
      .select("registrant")
      .eq("market_id", melee.market1.marketID)
      .then((r) => r.data![0].registrant.substring(2, 5));
    const registrant1: string = await postgrest
      .from(TableName.MarketRegistrationEvents)
      .select("registrant")
      .eq("market_id", melee.market2.marketID)
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
    let expectedFees = 0n;
    let expectedVolume = 0n;
    let swap0: SwapEventModel | null = null;
    let swap1: SwapEventModel | null = null;

    const queryCandlesticks = async () => {
      candlesticks = await postgrest
        .from(TableName.ArenaCandlestick)
        .select("*")
        .eq("melee_id", melee.view.meleeID)
        .then((r) => r.data)
        .then((r) => (r === null ? null : r.map(toArenaCandlestickModel)));
    };
    const querySwaps = async () => {
      swap0 = await postgrest
        .from(TableName.SwapEvents)
        .select("*")
        .eq("market_id", melee.market1.marketID)
        .order("market_nonce", ORDER_BY.DESC)
        .limit(1)
        .then((r) => r.data)
        .then((r) => (r === null ? null : r.map(toSwapEventModel)))
        .then((r) => (r?.length === 1 ? r[0] : null));
      swap1 = await postgrest
        .from(TableName.SwapEvents)
        .select("*")
        .eq("market_id", melee.market2.marketID)
        .order("market_nonce", ORDER_BY.DESC)
        .limit(1)
        .then((r) => r.data)
        .then((r) => (r === null ? null : r.map(toSwapEventModel)))
        .then((r) => (r?.length === 1 ? r[0] : null));
    };
    const waitTo15sBoundryStart = async () => {
      const now = new Date().getTime();
      const fifteenSecondStart = now - (now % 15000);
      const fifteenSecondEnd = fifteenSecondStart + 15000;
      const timeToWait = Math.max(fifteenSecondEnd - now, 0) + 200;
      await sleep(timeToWait);
    };
    const calculatePrice = (swap0: SwapEventModel, swap1: SwapEventModel) => {
      const price0 = Big(swap0!.swap.avgExecutionPriceQ64.toString()).div(2 ** 64);
      const price1 = Big(swap1!.swap.avgExecutionPriceQ64.toString()).div(2 ** 64);
      return price0.div(price1).toNumber();
    };

    await queryCandlesticks();

    expect(candlesticks).not.toBeNull();
    expect(candlesticks).toHaveLength(0);

    await waitTo15sBoundryStart();

    // ATM, no swaps are present on either market.

    await waitForProcessor(
      await emojicoin.arena.enter(
        account1,
        ONE_APT_BIGINT,
        false,
        melee.market1.symbolEmojis,
        melee.market2.symbolEmojis,
        "symbol1"
      )
    );

    await queryCandlesticks();
    await querySwaps();

    // Since we only have one swap on one side, there is no price, and all price
    // columns are null. However, volume, integratorFees, and nSwaps are set.

    expect(candlesticks).not.toBeNull();
    expect(candlesticks!.length).toBeGreaterThan(0);

    fifteenSecondCandles = candlesticks!.filter((c) => c.period === ArenaPeriod.Period15S);

    expect(fifteenSecondCandles).toHaveLength(1);
    expect(fifteenSecondCandles[0].nSwaps).toEqual(1n);
    expect(fifteenSecondCandles[0].lowPrice).toBeNull();
    expect(fifteenSecondCandles[0].highPrice).toBeNull();
    expect(fifteenSecondCandles[0].openPrice).toBeNull();
    expect(fifteenSecondCandles[0].closePrice).toBeNull();
    expect(fifteenSecondCandles[0].integratorFees).toEqual(swap0!.swap.integratorFee);
    expect(fifteenSecondCandles[0].volume).toEqual(swap0!.swap.quoteVolume);

    // No swap is generated from the exit.

    await emojicoin.arena.exit(account1, melee.market1.symbolEmojis, melee.market2.symbolEmojis);

    // Here, we make a swap on the other market.

    await waitForProcessor(
      await emojicoin.arena.enter(
        account2,
        ONE_APT_BIGINT,
        false,
        melee.market1.symbolEmojis,
        melee.market2.symbolEmojis,
        "symbol2"
      )
    );

    await queryCandlesticks();
    await querySwaps();

    expectedPrice = calculatePrice(swap0!, swap1!);

    expectedFees = swap0!.swap.integratorFee + swap1!.swap.integratorFee;
    expectedVolume = swap0!.swap.quoteVolume + swap1!.swap.quoteVolume;

    // Now that we have a price on each side, price columns are set as well.

    expect(candlesticks).not.toBeNull();

    fifteenSecondCandles = candlesticks!.filter((c) => c.period === ArenaPeriod.Period15S);

    expect(fifteenSecondCandles).toHaveLength(1);
    expect(fifteenSecondCandles[0].nSwaps).toEqual(2n);
    expect(fifteenSecondCandles[0].lowPrice).toBeCloseTo(expectedPrice, 5);
    expect(fifteenSecondCandles[0].highPrice).toBeCloseTo(expectedPrice, 5);
    expect(fifteenSecondCandles[0].openPrice).toBeCloseTo(expectedPrice, 5);
    expect(fifteenSecondCandles[0].closePrice).toBeCloseTo(expectedPrice, 5);
    expect(fifteenSecondCandles[0].integratorFees).toEqual(expectedFees);
    expect(fifteenSecondCandles[0].volume).toEqual(expectedVolume);

    // We swap for emojicoin 1 to emojicoin 0.

    await waitForProcessor(
      await emojicoin.arena.swap(account2, melee.market1.symbolEmojis, melee.market2.symbolEmojis)
    );

    await queryCandlesticks();
    await querySwaps();

    expect(candlesticks).not.toBeNull();

    let oldExpectedPrice = expectedPrice;

    expectedPrice = calculatePrice(swap0!, swap1!);
    expectedFees += swap0!.swap.integratorFee + swap1!.swap.integratorFee;
    expectedVolume += swap0!.swap.quoteVolume + swap1!.swap.quoteVolume;
    fifteenSecondCandles = candlesticks!.filter((c) => c.period === ArenaPeriod.Period15S);

    expect(fifteenSecondCandles).toHaveLength(1);
    expect(fifteenSecondCandles[0].nSwaps).toEqual(4n);
    expect(fifteenSecondCandles[0].lowPrice).toBeCloseTo(oldExpectedPrice, 5);
    expect(fifteenSecondCandles[0].highPrice).toBeCloseTo(expectedPrice, 5);
    expect(fifteenSecondCandles[0].openPrice).toBeCloseTo(oldExpectedPrice, 5);
    expect(fifteenSecondCandles[0].closePrice).toBeCloseTo(expectedPrice, 5);
    expect(fifteenSecondCandles[0].integratorFees).toEqual(expectedFees);
    expect(fifteenSecondCandles[0].volume).toEqual(expectedVolume);

    await waitTo15sBoundryStart();

    // This swap should happen in the next candlestick boundry, so it should generate a new one.

    await waitForProcessor(
      await emojicoin.arena.swap(account2, melee.market1.symbolEmojis, melee.market2.symbolEmojis)
    );

    const oldSwap1 = swap1!;

    await queryCandlesticks();
    await querySwaps();

    expect(candlesticks).not.toBeNull();

    fifteenSecondCandles = candlesticks!.filter((c) => c.period === ArenaPeriod.Period15S);

    expect(fifteenSecondCandles).toHaveLength(2);
    // We check that the previous candle hasn't changed
    expect(fifteenSecondCandles[0].nSwaps).toEqual(4n);
    expect(fifteenSecondCandles[0].lowPrice).toBeCloseTo(oldExpectedPrice, 5);
    expect(fifteenSecondCandles[0].highPrice).toBeCloseTo(expectedPrice, 5);
    expect(fifteenSecondCandles[0].openPrice).toBeCloseTo(oldExpectedPrice, 5);
    expect(fifteenSecondCandles[0].closePrice).toBeCloseTo(expectedPrice, 5);
    expect(fifteenSecondCandles[0].integratorFees).toEqual(expectedFees);
    expect(fifteenSecondCandles[0].volume).toEqual(expectedVolume);

    expectedVolume = swap0!.swap.quoteVolume + swap1!.swap.quoteVolume;
    expectedFees = swap0!.swap.integratorFee + swap1!.swap.integratorFee;

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
    // This markes the price of emojicoin B go up to 1.01.
    //
    // The A/B price is now ~0.98 (0.99 / 1.01).
    //
    // The same mechanism happens in reverse when there is a swap from B to A.
    //
    // If the initial price of A/B is 1, the end price would be ~1.02, with an
    // intermediary price of 1.01.
    //
    // Because of this, despite there only being one "arena swap" in this
    // candlestick time boundry, there are two different prices for low/high
    // and for open/close.

    const intermediaryExpectedPrice = calculatePrice(swap0!, oldSwap1);
    expectedPrice = calculatePrice(swap0!, swap1!);

    expect(fifteenSecondCandles[1].lowPrice).toBeCloseTo(expectedPrice, 5);
    expect(fifteenSecondCandles[1].highPrice).toBeCloseTo(intermediaryExpectedPrice, 5);
    expect(fifteenSecondCandles[1].openPrice).toBeCloseTo(intermediaryExpectedPrice, 5);
    expect(fifteenSecondCandles[1].closePrice).toBeCloseTo(expectedPrice, 5);
    expect(fifteenSecondCandles[1].nSwaps).toEqual(2n);
    expect(fifteenSecondCandles[1].integratorFees).toEqual(expectedFees);
    expect(fifteenSecondCandles[1].volume).toEqual(expectedVolume);
  }, 70000);
});
