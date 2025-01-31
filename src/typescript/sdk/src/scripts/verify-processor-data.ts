/* eslint-disable import/no-unused-modules */
import { EmojicoinClient } from "../client/emojicoin-client";
import { callAggregateMarketState } from "../indexer-v2/queries/fetch-aggregate-market-state";

const main = async () => {
  const aggregateMarketState = await callAggregateMarketState();
  const emojicoin = new EmojicoinClient();
  const registryState = await emojicoin.view.registry({
    ledgerVersion: aggregateMarketState.lastEmojicoinTransactionVersion,
  });

  const totalNumDatabaseEvents = BigInt(
    aggregateMarketState.numGlobalStateEvents +
      aggregateMarketState.numSwapEvents +
      aggregateMarketState.numLiquidityEvents +
      aggregateMarketState.numChatEvents +
      aggregateMarketState.numMarketRegistrationEvents
  );

  if (!(registryState.nonce !== totalNumDatabaseEvents)) {
    console.error(`Registry state nonce doesn't match total number of database events.`);
    console.error(
      `Registry nonce: ${registryState.nonce}, numDatabaseEvents: ${totalNumDatabaseEvents})`
    );
  }

  const equalValues = Object.entries(aggregateMarketState)
    .map(([key, aggValue]) => {
      // Skip these keys as they are checked above or not checked at all and only for viewing.
      if (
        [
          "lastEmojicoinTransactionVersion",
          // The lastBumpTime in the registry view is NOT the same as the last event bump time.
          // It's the last bump time of the global registry (once per day).
          // The lastBumpTime in the aggregated market state *is* the last event bump time.
          // So they'll never be equal- thus, ignore.
          "lastBumpTime",
          "numMarketsInBondingCurve", // Only for debugging- not checked.
          "numMarketsPostBondingCurve", // Only for debugging- not checked.
          "numGlobalStateEvents",
          "numMarketRegistrationEvents",
          "numSwapEvents",
          "numChatEvents",
          "numLiquidityEvents",
        ].includes(key)
      ) {
        return true;
      }
      const viewValue = registryState[key as keyof typeof registryState];
      const equal = aggValue === viewValue;
      if (!equal) {
        console.error(`Key ${key} not equal. Database: ${aggValue} View: ${viewValue}`);
      }
      return equal;
    })
    .every((v) => v);
  if (!equalValues) {
    console.error(aggregateMarketState);
    console.error(registryState);
    throw new Error("Aggregate market state does not match the registry view on-chain.");
  }
  /* eslint-disable no-console */
  console.info("Aggregate market state matches the registry view on-chain!");
  console.dir(aggregateMarketState);
  /* eslint-enable no-console */
};

main();
