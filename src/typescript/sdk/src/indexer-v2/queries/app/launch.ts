import "server-only";

import { DatabaseRpc } from "../../types/json-types";
import { postgrest } from "../client";
import { queryHelper } from "../utils";
import { DatabaseTypeConverter } from "../../types";

const selectRandomSymbols = () => postgrest.rpc(DatabaseRpc.RandomSymbols, undefined, { get: true });

export const fetchRandomSymbols = queryHelper(
  selectRandomSymbols,
  DatabaseTypeConverter[DatabaseRpc.RandomSymbols]
);
