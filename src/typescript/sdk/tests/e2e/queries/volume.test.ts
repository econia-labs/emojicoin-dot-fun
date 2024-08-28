import {
  type AccountAddress,
  type UserTransactionResponse,
  type Account,
} from "@aptos-labs/ts-sdk";
import {
  bigintMax,
  getEvents,
  getMarketResourceFromWriteSet,
  ONE_APT,
  Period,
  sleep,
  sum,
  sumByKey,
  toPeriodFromContract,
} from "../../../src";
import { Swap } from "../../../src/emojicoin_dot_fun/emojicoin-dot-fun";
import {
  fetchMarket1MPeriodsInLastDay,
  fetchMarketDailyVolume,
} from "../../../src/indexer-v2/queries";
import { getAptosClient } from "../../utils";
import { getFundedAccount } from "../../utils/test-accounts";
import { type Events } from "../../../src/emojicoin_dot_fun/events";
import { fetchAllSwapsBySwapper } from "../../../src/indexer-v2/queries/non-indexed";
import { getTxnBatchHighestVersion } from "../../utils/get-txn-batch-highest-version";
import TestHelpers from "../../utils/helpers";

jest.setTimeout(30000);

describe("queries swap_events and returns accurate swap row data", () => {
  const { aptos } = getAptosClient();
  const fundedAccounts = new Array<Account>();

  beforeAll(async () => {
    fundedAccounts.push(
      getFundedAccount("0x011f468f86c6d38c708f8c1ad1ad76d986b3489824e5b78ae1f86e7dc5d84011"),
      getFundedAccount("0x012431335d02cc4e9a7e49457a8aaeca6550300b397394254691d242a8f06012"),
      getFundedAccount("0x01356410ca2c0c0ca29ec8a9ebe750e2ed0fa5eaba32beff63d310fc9e8cf013"),
      getFundedAccount("0x014bb822fff7038a013050d28186f9d2095c41bbdd84c830f5e87463fd4f5014"),
      getFundedAccount("0x0157784d9a02040b6782faa814b2b59181142be4e5b35e5079746f282c966015"),
      getFundedAccount("0x0165113c1998280473c75f895cb5ba907f883110e5ae82fdb304e5abd6ba6016")
    );
  });

  it("sums a market's daily volume over multiple 1-minute periods with 3 swaps", async () => {
    const swapper = fundedAccounts.pop()!;
    const { marketAddress, emojicoin, emojicoinLP, integrator } =
      await TestHelpers.registerMarketFromNames({
        registrant: swapper,
        emojiNames: ["screwdriver"],
      });

    const swapCall = (inputAmount: bigint) =>
      Swap.submit({
        aptosConfig: aptos.config,
        swapper,
        marketAddress,
        inputAmount,
        isSell: false,
        typeTags: [emojicoin, emojicoinLP],
        integrator: integrator.accountAddress,
        integratorFeeRateBPs: 0,
        minOutputAmount: 1n,
      });

    const rand = Math.random;
    const inputAmounts = [rand(), rand(), rand()]
      .map((v) => v * ONE_APT)
      .map(Math.floor)
      .map(BigInt) as [bigint, bigint, bigint];

    const first = await swapCall(inputAmounts[0]);
    const firstQuoteVolume = getEvents(first).swapEvents[0].quoteVolume;
    const { marketID } = getEvents(first).marketRegistrationEvents[0];

    const marketResource = getMarketResourceFromWriteSet(first, marketAddress)!;
    expect(marketResource).toBeDefined();
    const oneMinuteStateTracker = marketResource.periodicStateTrackers.find(
      (tracker) => toPeriodFromContract(tracker.period) === Period.Period1M
    )!;
    expect(oneMinuteStateTracker).toBeDefined();
    expect(oneMinuteStateTracker.volumeQuote).toEqual(firstQuoteVolume);

    let periods = await fetchMarket1MPeriodsInLastDay({ marketID });
    expect(periods.length).toEqual(1);
    expect(periods[0].volume).toEqual(firstQuoteVolume);

    // Get the periodic state tracker's period expiry time by converting the start time to
    // milliseconds and adding 1 minute.
    // Convert from microseconds to milliseconds, then round up to the nearest millisecond.
    const millisecondsCeiling = Math.ceil(Number(oneMinuteStateTracker.startTime / 1000n));
    const periodExpiry = new Date(millisecondsCeiling + 60 * 1000);

    // Our test relies upon this tracker having at least 30 seconds left.
    expect(periodExpiry.getTime() - Date.now()).toBeGreaterThan(30 * 1000);

    // Now call a second swap to ensure that it's slotted in with the first swap in the same
    // 1-minute period.
    const second = await swapCall(inputAmounts[1]);
    const secondQuoteVolume = getEvents(second).swapEvents[0].quoteVolume;
    const secondMarketResource = getMarketResourceFromWriteSet(second, marketAddress)!;
    expect(secondMarketResource).toBeDefined();
    const second1MTracker = secondMarketResource.periodicStateTrackers.find(
      (tracker) => toPeriodFromContract(tracker.period) === Period.Period1M
    )!;
    expect(second1MTracker).toBeDefined();
    expect(second1MTracker.startTime).toEqual(oneMinuteStateTracker.startTime);
    expect(second1MTracker.volumeQuote).toEqual(firstQuoteVolume + secondQuoteVolume);

    periods = await fetchMarket1MPeriodsInLastDay({ marketID });
    expect(periods.length).toEqual(1);
    expect(periods[0].volume).toEqual(firstQuoteVolume + secondQuoteVolume);

    // Sleep until the period expiry time.
    await sleep(periodExpiry.getTime() - Date.now());

    // Now perform another swap and ensure that the daily volume has been accurately updated.
    const third = await swapCall(inputAmounts[2]);
    const thirdSwapTimestamp = BigInt(third.timestamp);
    const thirdMarketResource = getMarketResourceFromWriteSet(third, marketAddress)!;
    expect(thirdMarketResource).toBeDefined();
    const third1MTracker = thirdMarketResource.periodicStateTrackers.find(
      (tracker) => toPeriodFromContract(tracker.period) === Period.Period1M
    )!;
    expect(third1MTracker).toBeDefined();
    // Expect that the start time of the current state tracker is the transaction timestamp
    // of the third swap; i.e., the tracker started because of the third swap.
    expect(third1MTracker.startTime).toEqual(thirdSwapTimestamp);
    const thirdQuoteVolume = getEvents(third).swapEvents[0].quoteVolume;
    expect(third1MTracker.volumeQuote).toEqual(thirdQuoteVolume);

    const dailyVolumeQueryResult = (await fetchMarketDailyVolume({ marketID })).at(0)!;
    expect(dailyVolumeQueryResult).toBeDefined();

    const totalVolume = firstQuoteVolume + thirdQuoteVolume;
    expect(dailyVolumeQueryResult.dailyVolume).toEqual(totalVolume);

    periods = await fetchMarket1MPeriodsInLastDay({ marketID });
    expect(periods.length).toEqual(2);
    const volume = sumByKey(periods, "volume");
    expect(volume).toEqual(firstQuoteVolume + secondQuoteVolume + thirdQuoteVolume);
  });

  it("correctly sums the volume by user and market daily volume", async () => {
    const swappersAndVolumes = [
      [fundedAccounts.pop()!, 100n] as const,
      [fundedAccounts.pop()!, 200n] as const,
      [fundedAccounts.pop()!, 300n] as const,
      [fundedAccounts.pop()!, 400n] as const,
      [fundedAccounts.pop()!, 500n] as const,
    ];
    const { marketAddress, emojicoin, emojicoinLP, integrator, events } =
      await TestHelpers.registerMarketFromNames({
        registrant: swappersAndVolumes[0][0],
        emojiNames: ["see-no-evil monkey", "scissors"],
      });

    const swapCall = (swapper: Account, inputAmount: bigint) =>
      Swap.submit({
        aptosConfig: aptos.config,
        swapper,
        marketAddress,
        inputAmount,
        isSell: false,
        typeTags: [emojicoin, emojicoinLP],
        integrator: integrator.accountAddress,
        integratorFeeRateBPs: 0,
        minOutputAmount: 1n,
      });
    const volume = new Map<AccountAddress, bigint>();
    const results: Array<Events> = [];

    const swapsPerAccount = 10;

    // Open the market up for trading by having the registrant make the first swap.
    // Set the volume for the first swapper to the first swap amount.
    const [firstSwapper, firstSwap] = swappersAndVolumes[0];
    await swapCall(firstSwapper, firstSwap);
    volume.set(firstSwapper.accountAddress, firstSwap);

    // Now have each swapper make a swap, excluding the first swap for the first swapper.
    let highestVersion = 0n;
    for (let i = 0; i < swapsPerAccount; i += 1) {
      const txns = new Array<Promise<UserTransactionResponse>>();
      swappersAndVolumes.forEach(([swapper, amount], ii) => {
        if (
          i === 0 &&
          ii === 0 &&
          swapper.accountAddress.equals(swappersAndVolumes[0][0].accountAddress)
        ) {
          return;
        }
        const addr = swapper.accountAddress;
        volume.set(addr, (volume.get(addr) ?? 0n) + amount);
        txns.push(swapCall(swapper, amount));
      });
      /* eslint-disable-next-line no-await-in-loop */
      const responses = await Promise.all(txns);
      highestVersion = bigintMax(getTxnBatchHighestVersion(responses), highestVersion);
      results.push(...responses.map(getEvents));
    }
    const { marketID } = events.marketRegistrationEvents[0];

    // Check volume by user.
    const swapsQueries = swappersAndVolumes.map(async ([swapper]) => {
      const userSwaps = await fetchAllSwapsBySwapper({ swapper, minimumVersion: highestVersion });
      const swapperVolume = sum(userSwaps.map(({ swap }) => swap.quoteVolume));
      return [swapper, userSwaps.length, swapperVolume] as const;
    });

    await Promise.all(swapsQueries).then((queryResults) =>
      queryResults.forEach(([swapper, numSwaps, swapperVolume]) => {
        expect(numSwaps).toEqual(swapsPerAccount);
        expect(swapperVolume).toEqual(volume.get(swapper.accountAddress));
      })
    );

    // Check volume by market.
    const dailyVolumeQueryResult = (await fetchMarketDailyVolume({ marketID })).at(0)!;
    expect(dailyVolumeQueryResult).toBeDefined();

    const totalVolume = sum(Array.from(volume.values()));
    expect(dailyVolumeQueryResult.dailyVolume).toEqual(totalVolume);
  });
});
