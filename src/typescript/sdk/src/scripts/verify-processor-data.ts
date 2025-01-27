/* eslint-disable import/no-unused-modules */
import { EmojicoinClient } from "../client/emojicoin-client";
import { callAggregateMarketState } from "../indexer-v2/queries/fetch-aggregate-market-state";

const main = async () => {
  const aggregateMarketState = await callAggregateMarketState();
  const emojicoin = new EmojicoinClient();
  const registryState = await emojicoin.view.registry({
    ledgerVersion: aggregateMarketState.lastEmojicoinTransactionVersion,
  });

  const sameKeyLength =
    Object.keys(aggregateMarketState).length === Object.keys(registryState).length;
  const equalValues = Object.entries(aggregateMarketState)
    .map(([key, aggValue]) => registryState[key as keyof typeof registryState] === aggValue)
    .every((v) => v);
  if (!(sameKeyLength && equalValues)) {
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
