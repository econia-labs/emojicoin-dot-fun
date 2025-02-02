"use server";
import { stringifyJSONWithBigInts } from "@sdk/indexer-v2/json-bigint";
import { type serverLog } from "./wrapper";

type Params = Parameters<typeof serverLog>[0];

/**
 * This function is *NOT* intended to be called directly.
 *
 * Please call the wrapper function @see {@link serverLog} instead.
 */
export const doNotCallThisFunctionDirectly_serverSideLog = async (obj: Params) => {
  const stringified = stringifyJSONWithBigInts(obj);
  /* eslint-disable-next-line no-console */
  console.log(stringified, null, 2);
};
