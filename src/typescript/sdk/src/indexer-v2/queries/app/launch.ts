import "server-only";

import { DatabaseRpc } from "../../types/json-types";
import { postgrest } from "../client";
import { queryHelper } from "../utils";
import { DatabaseTypeConverter } from "../../types";

const selectRandomNames = () => postgrest.rpc(DatabaseRpc.RandomNames, undefined, { get: true });

export const fetchRandomNames = queryHelper(
  selectRandomNames,
  DatabaseTypeConverter[DatabaseRpc.RandomNames]
);
