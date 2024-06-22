import fetchAggregateMarkets from "lib/queries/initial/aggregate-markets";
import StoreOnClient from "./StoreOnClient";

/**
 * @returns A server component that passes data to the global client store.
 *
 * Right now it only passes aggregated market metadata for registered markets. This is static data that will
 * never change once a market is registered.
 */
export const FetchFromServer = async () => {
  const data = await fetchAggregateMarkets();
  return <StoreOnClient markets={data.markets} />;
};

export default FetchFromServer;
