import {
  type AccountAddress,
  type UserTransactionResponse,
  type Account,
} from "@aptos-labs/ts-sdk";
import { maxBigInt, getEvents, sum, sumByKey } from "../../../src";
import { Swap } from "../../../src/emojicoin_dot_fun/emojicoin-dot-fun";
import { getAptosClient } from "../../utils";
import { getFundedAccounts } from "../../utils/test-accounts";
import { type Events } from "../../../src/emojicoin_dot_fun/events";
import { getTxnBatchHighestVersion } from "../../utils/get-txn-batch-highest-version";
import TestHelpers from "../../utils/helpers";
import { fetchDailyVolumeForMarket, fetchSwapEventsBySwapper } from ".";

// We need a long timeout because the test must wait for the 1-minute period to expire.
jest.setTimeout(75000);

describe("queries swap_events and returns accurate swap row data", () => {
  const aptos = getAptosClient();
  const fundedAccounts = getFundedAccounts("011", "012", "013", "014", "015", "016");

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
      highestVersion = maxBigInt(getTxnBatchHighestVersion(responses), highestVersion);
      results.push(...responses.map(getEvents));
    }
    const { marketID } = events.marketRegistrationEvents[0];

    // Check volume by user.
    const swapsQueries = swappersAndVolumes.map(async ([swapper]) => {
      const swaps = await fetchSwapEventsBySwapper({
        swapper,
        minimumVersion: highestVersion,
      });
      const swapperVolume = sumByKey(
        swaps.map(({ swap }) => swap),
        "quoteVolume"
      );
      return [swapper, swaps.length, swapperVolume] as const;
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
