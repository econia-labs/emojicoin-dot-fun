import { VERCEL_TARGET_ENV } from "@sdk/const";
import { doNotCallThisFunctionDirectly_serverSideLog } from "./log-to-server";
import { stringifyJSONWithBigInts } from "@sdk/indexer-v2/json-bigint";
import { isEncodedEntryFunctionArgument } from "@aptos-labs/ts-sdk";
import serializeArgsToJSON from "@sdk/emojicoin_dot_fun/serialize-args-to-json";

// To avoid needless server POSTs, wrap the function with a check for whether or not the log
// should even be called based on the build environment.
export const logToServer = async (obj: object, logInProduction: boolean = false) => {
  if (!logInProduction && VERCEL_TARGET_ENV === "production") {
    return;
  }

  const stringified = stringifyJSONWithBigInts(
    obj,
    (_k, v) => (isEncodedEntryFunctionArgument(v) ? serializeArgsToJSON(v) : v),
    2
  );
  return await doNotCallThisFunctionDirectly_serverSideLog(stringified);
};
