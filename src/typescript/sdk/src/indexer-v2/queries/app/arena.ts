if (process.env.NODE_ENV !== "test") {
  require("server-only");
}

import { TableName } from "../../types/json-types";
import { postgrest } from "../client";
import { queryHelper, queryHelperSingle } from "../utils";
import {
  DatabaseRpc,
  toArenaInfoModel,
  toArenaLeaderboardHistoryWithArenaInfo,
  toArenaMeleeModel,
  toArenaPositionsModel,
  toMarketStateModel,
} from "../../types";
import { ORDER_BY } from "../../const";
import { toAccountAddressString } from "../../../utils";

const selectMelee = () =>
  postgrest
    .from(TableName.ArenaMeleeEvents)
    .select("*")
    .order("melee_id", ORDER_BY.DESC)
    .limit(1)
    .single();

const selectArenaInfo = () =>
  postgrest
    .from(TableName.ArenaInfo)
    .select("*")
    .order("melee_id", ORDER_BY.DESC)
    .limit(1)
    .single();

const selectPosition = ({ user, meleeID }: { user: string; meleeID: bigint }) =>
  postgrest
    .from(TableName.ArenaPositions)
    .select("*")
    .eq("user", user)
    .eq("melee_id", meleeID)
    .maybeSingle();

const selectLatestPosition = ({ user }: { user: string }) =>
  postgrest
    .from(TableName.ArenaPositions)
    .select("*")
    .eq("user", user)
    .order("melee_id", ORDER_BY.DESC)
    .limit(1)
    .maybeSingle();

const callArenaLeaderboardHistoryWithArenaInfo = ({ user, skip }: { user: string; skip: bigint }) =>
  postgrest
    .rpc(
      DatabaseRpc.ArenaLeaderboardHistoryWithArenaInfo,
      { user: toAccountAddressString(user), skip },
      { get: true }
    )
    .select("*");

const selectMarketStateByAddress = ({ address }: { address: string }) =>
  postgrest
    .from(TableName.MarketState)
    .select("*")
    .eq("market_address", address)
    .limit(1)
    .maybeSingle();

export const fetchMelee = queryHelperSingle(selectMelee, toArenaMeleeModel);
export const fetchArenaInfo = queryHelperSingle(selectArenaInfo, toArenaInfoModel);
export const fetchPosition = queryHelperSingle(selectPosition, toArenaPositionsModel);
export const fetchLatestPosition = queryHelperSingle(selectLatestPosition, toArenaPositionsModel);
export const fetchArenaLeaderboardHistoryWithArenaInfo = queryHelper(
  callArenaLeaderboardHistoryWithArenaInfo,
  toArenaLeaderboardHistoryWithArenaInfo
);
export const fetchMarketStateByAddress = queryHelperSingle(
  selectMarketStateByAddress,
  toMarketStateModel
);
