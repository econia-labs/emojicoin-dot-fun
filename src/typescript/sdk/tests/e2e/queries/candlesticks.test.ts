import { AccountAddress } from "@aptos-labs/ts-sdk";
import {
  getMarketResourceFromWriteSet,
  getPeriodBoundaryAsDate,
  Period,
  periodEnumToRawDuration,
  sleep,
  type SymbolEmoji,
} from "../../../src";
import { EmojicoinClient } from "../../../src/client/emojicoin-client";
import { fetchPeriodicEventsSince, waitForEmojicoinIndexer } from "../../../src/indexer-v2";
import { getFundedAccount } from "../../utils/test-accounts";

// This test must have a really long timeout because it essentially sleeps for 60 seconds after
// registering a market to ensure that at least one periodic state event is emitted.
jest.setTimeout(90000);

const ONE_MINUTE = 60 * 1000;
const TWO_SECONDS = 2 * 1000;

describe("verifies parsing of periodic state event data", () => {
  const registrant = getFundedAccount("084");
  const emojicoin = new EmojicoinClient();

  it("properly parses periodic state event data", async () => {
    const emojis: SymbolEmoji[] = ["🫐"];

    // Register the market, get the market ID and address.
    const { response, marketID, marketAddress } = await emojicoin
      .register(registrant, emojis)
      .then(({ response, registration }) => {
        expect(response.success).toBe(true);
        return {
          marketID: BigInt(registration.event.marketID),
          marketAddress: AccountAddress.from(registration.event.marketMetadata.marketAddress),
          response,
        };
      });

    // Get the period start time to know exactly how long to wait to ensure a periodic event emits.
    // This could just wait 60+ seconds, but to shorten the test time on average, just wait the
    // exact amount of time.
    const marketResource = getMarketResourceFromWriteSet(response, marketAddress)!;
    expect(marketResource).toBeDefined();
    const oneMinutePeriodicStateTracker = marketResource.periodicStateTrackers.find(
      (p) => Number(p.period) === periodEnumToRawDuration(Period.Period1M)
    )!;
    expect(oneMinutePeriodicStateTracker).toBeDefined();
    // Find the period boundary (where the period starts).
    const periodBoundaryStart = getPeriodBoundaryAsDate(
      oneMinutePeriodicStateTracker.startTime,
      Period.Period1M
    );

    // Add a minute to it to get the end of the period.
    const periodBoundaryEnd = periodBoundaryStart.getTime() + ONE_MINUTE;

    // Wait until the end of the period.
    const waitTime = periodBoundaryEnd - Date.now();
    await sleep(waitTime);

    // Wait another 2 seconds to account for any skew between Date() and on-chain time.
    await sleep(TWO_SECONDS);

    // Chat, to trigger a periodic state event.
    const { events, response: chatResponse } = await emojicoin.chat(registrant, emojis, ["⏱️"]);
    expect(events.periodicStateEvents.length).toBeGreaterThanOrEqual(1);

    await waitForEmojicoinIndexer(chatResponse.version);
    const resPeriodicEvents = await fetchPeriodicEventsSince({
      marketID,
      start: new Date(Date.now() - 10 * ONE_MINUTE), // Ensure the event shows up by making the
      end: new Date(Date.now() + 10 * ONE_MINUTE), // timespan range much larger than necessary.
      period: Period.Period1M,
    });

    const pEvent = resPeriodicEvents.at(0)!;
    expect(pEvent).toBeDefined();
    expect(pEvent.periodicMetadata.period).toEqual(Period.Period1M);
    expect(pEvent.periodicMetadata.startTime).toBe(oneMinutePeriodicStateTracker.startTime);
  });
});
