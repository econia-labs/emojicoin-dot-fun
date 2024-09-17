import {
  type AccountAddress,
  type UserTransactionResponse,
  type Account,
} from "@aptos-labs/ts-sdk";
import {
  bigintMax,
  getEvents,
  getPeriodBoundary,
  getPeriodBoundaryAsDate,
  ONE_APT,
  Period,
  sleep,
  sum,
  sumByKey,
} from "../../../src";
import { Swap } from "../../../src/emojicoin_dot_fun/emojicoin-dot-fun";
import {
  fetchDailyVolumeForMarket,
  fetchMarket1MPeriodsInLastDay,
} from "../../../src/indexer-v2/queries";
import { getAptosClient } from "../../utils";
import { getFundedAccounts } from "../../utils/test-accounts";
import { type Events } from "../../../src/emojicoin_dot_fun/events";
import { fetchAllSwapsBySwapper } from "../../../src/indexer-v2/queries/non-indexed";
import { getTxnBatchHighestVersion } from "../../utils/get-txn-batch-highest-version";
import TestHelpers from "../../utils/helpers";
import {
  getOneMinutePeriodicStateEvents,
  getPeriodExpiryDate,
  getTrackerFromWriteSet,
} from "./helpers";

// We need a long timeout because the test must wait for the 1-minute period to expire.
jest.setTimeout(75000);

const TWENTY_FIVE_SECONDS = 20 * 1000;
const FIVE_SECONDS = 5 * 1000;

describe("queries swap_events and returns accurate swap row data", () => {
  const { aptos } = getAptosClient();
  const fundedAccounts = getFundedAccounts(
    "0x011f468f86c6d38c708f8c1ad1ad76d986b3489824e5b78ae1f86e7dc5d84011",
    "0x012431335d02cc4e9a7e49457a8aaeca6550300b397394254691d242a8f06012",
    "0x01356410ca2c0c0ca29ec8a9ebe750e2ed0fa5eaba32beff63d310fc9e8cf013",
    "0x014bb822fff7038a013050d28186f9d2095c41bbdd84c830f5e87463fd4f5014",
    "0x0157784d9a02040b6782faa814b2b59181142be4e5b35e5079746f282c966015",
    "0x0165113c1998280473c75f895cb5ba907f883110e5ae82fdb304e5abd6ba6016"
  );

  it("sums a market's daily volume over multiple 1-minute periods with 3 swaps", async () => {
    // This test needs very specific conditions in order to verify accuracy in a reasonable amount
    // of time. The easiest way to set it up correctly is by aligning the start time of the test
    // with around half a minute before the end of the current 1-minute period. This way, we can
    // ensure that the first swap is in the same period as the second swap, and the third swap
    // creates a new period. This is the only way to ensure that the daily volume is accurately
    // calculated across multiple periods.
    const currentPeriodBoundary = getPeriodBoundaryAsDate(Date.now() * 1000, Period.Period1M);
    const timeUntilNextPeriod = currentPeriodBoundary.getTime() - Date.now();
    if (timeUntilNextPeriod < TWENTY_FIVE_SECONDS) {
      await sleep(timeUntilNextPeriod);
      // There might be some drift between the current time in the js runtime and in the Aptos VM.
      // We'll sleep for a little bit longer to ensure that the period has expired.
      await sleep(2000);
    }

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
    const firstEvents = getEvents(first);
    const { marketID } = firstEvents.swapEvents[0];

    // There should be no periodic state events emitted for the first swap.
    expect(firstEvents.periodicStateEvents.length).toEqual(0);

    const firstTracker = getTrackerFromWriteSet(first, marketAddress, Period.Period1M)!;
    expect(firstTracker).toBeDefined();
    expect(firstTracker.volumeQuote).toEqual(firstQuoteVolume);
    expect(firstTracker.startTime).toEqual(getPeriodBoundary(first.timestamp, Period.Period1M));

    await fetchDailyVolumeForMarket({ marketID, minimumVersion: first.version }).then((r) => {
      expect(r[0].dailyVolume).toEqual(firstQuoteVolume);
    });
    let periods = await fetchMarket1MPeriodsInLastDay({ marketID });
    // The first period ever isn't tracked until the *end* of the period- so even with one swap,
    // we won't see a period until this periodic state tracker ends.
    expect(periods.length).toEqual(0);
    const periodExpiry = getPeriodExpiryDate(firstTracker, Period.Period1M);
    expect(periodExpiry.getTime() - Date.now()).toBeGreaterThan(FIVE_SECONDS);

    // Now call a second swap to ensure that it's slotted in with the first swap in the same
    // 1-minute period.

    expect(getOneMinutePeriodicStateEvents(first).length).toEqual(0);
    const second = await swapCall(inputAmounts[1]);
    const secondEvents = getEvents(second);
    const secondQuoteVolume = secondEvents.swapEvents[0].quoteVolume;
    const secondTracker = getTrackerFromWriteSet(second, marketAddress, Period.Period1M)!;
    expect(secondTracker).toBeDefined();
    expect(secondTracker.startTime).toEqual(firstTracker.startTime);
    expect(secondTracker.volumeQuote).toEqual(firstQuoteVolume + secondQuoteVolume);

    // There should be no periodic state events emitted for the second swap.
    expect(getOneMinutePeriodicStateEvents(second).length).toEqual(0);

    await fetchDailyVolumeForMarket({ marketID, minimumVersion: second.version }).then((r) => {
      expect(r[0].dailyVolume).toEqual(firstQuoteVolume + secondQuoteVolume);
    });
    periods = await fetchMarket1MPeriodsInLastDay({ marketID });
    expect(periods.length).toEqual(0);

    // Sleep until the period expiry time.
    await sleep(periodExpiry.getTime() - Date.now());
    // There might be some drift between the current time in the js runtime and in the Aptos VM.
    // We'll sleep for a little bit longer to ensure that the period has expired.
    await sleep(2000);

    // Now perform another swap and ensure that the daily volume has been accurately updated.
    const third = await swapCall(inputAmounts[2]);
    const thirdSwapTimestamp = BigInt(third.timestamp);
    const thirdTracker = getTrackerFromWriteSet(third, marketAddress, Period.Period1M)!;
    expect(thirdTracker).toBeDefined();
    expect(thirdTracker.startTime).toEqual(getPeriodBoundary(thirdSwapTimestamp, Period.Period1M));
    const thirdEvents = getEvents(third);
    const thirdQuoteVolume = thirdEvents.swapEvents[0].quoteVolume;
    expect(thirdTracker.volumeQuote).toEqual(thirdQuoteVolume);

    // *Now* we should see periodic state events being emitted.
    expect(getOneMinutePeriodicStateEvents(third).length).toEqual(1);

    // Make sure the indexer processor saw the new periodic state event.
    periods = await fetchMarket1MPeriodsInLastDay({ marketID, minimumVersion: third.version });
    expect(periods.length).toEqual(1);

    // Ensure that the total daily volume is accurate.
    const only1MPeriodsVolume = sumByKey(periods, "volume");
    expect(only1MPeriodsVolume).toEqual(firstQuoteVolume + secondQuoteVolume);

    await fetchDailyVolumeForMarket({ marketID }).then((r) => {
      expect(r[0].dailyVolume).toEqual(firstQuoteVolume + secondQuoteVolume + thirdQuoteVolume);
    });
  });

  it("sums the volume by user and market daily volume", async () => {
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
      const transactions = new Array<Promise<UserTransactionResponse>>();
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
        transactions.push(swapCall(swapper, amount));
      });
      /* eslint-disable-next-line no-await-in-loop */
      const responses = await Promise.all(transactions);
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
    const dailyVolumeQueryResult = (await fetchDailyVolumeForMarket({ marketID })).at(0)!;
    expect(dailyVolumeQueryResult).toBeDefined();

    const totalVolume = sum(Array.from(volume.values()));
    expect(dailyVolumeQueryResult.dailyVolume).toEqual(totalVolume);
  });
});
