import { type UserTransactionResponse } from "@aptos-labs/ts-sdk";
import { getEvents } from "../emojicoin_dot_fun/utils";
import { calculateTvlGrowth, getMarketResourceFromWriteSet } from "../markets/utils";
import { Period, rawPeriodToEnum } from "../const";

export const getMiscLatestStateEventFieldsFromWriteSet = (response: UserTransactionResponse) => {
  const events = getEvents(response);
  const stateEvent = events.stateEvents[0];

  const { marketAddress } = stateEvent.marketMetadata;
  const marketResource = getMarketResourceFromWriteSet(response, marketAddress);
  if (!marketResource) {
    throw new Error("There should be a market resource in the response.");
  }

  const volumeIn1MStateTracker = marketResource.periodicStateTrackers.find(
    (p) => rawPeriodToEnum(p.period) === Period.Period1M
  )?.volumeQuote;

  const periodicStateTracker1D = marketResource.periodicStateTrackers.find(
    (p) => rawPeriodToEnum(p.period) === Period.Period1D
  );

  if (volumeIn1MStateTracker === undefined) {
    throw new Error("There should be a 1M periodic state tracker in the Market resource.");
  }

  if (!periodicStateTracker1D) {
    throw new Error("There should be a 1D periodic state tracker in the Market resource.");
  }

  const dailyTvlPerLPCoinGrowthQ64 = calculateTvlGrowth(periodicStateTracker1D);
  const inBondingCurve = stateEvent.lpCoinSupply === BigInt(0);

  return {
    dailyTvlPerLPCoinGrowthQ64,
    inBondingCurve,
    volumeIn1MStateTracker,
  };
};
