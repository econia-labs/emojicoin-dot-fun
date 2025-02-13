if (process.env.NODE_ENV !== "test") {
  require("server-only");
}

import { TableName } from "../../types/json-types";
import { postgrest } from "../client";
import { queryHelper, queryHelperSingle } from "../utils";
import {
  toArenaInfoModel,
  toArenaLeaderboardHistoryWithArenaInfo,
  toArenaMeleeModel,
  toArenaPositionModel,
  toMarketStateModel,
} from "../../types";
import { ORDER_BY } from "../../const";

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
    .from(TableName.ArenaPosition)
    .select("*")
    .eq("user", user)
    .eq("melee_id", meleeID)
    .maybeSingle();

const selectLatestPosition = ({ user }: { user: string }) =>
  postgrest
    .from(TableName.ArenaPosition)
    .select("*")
    .eq("user", user)
    .order("melee_id", ORDER_BY.DESC)
    .limit(1)
    .maybeSingle();

const callArenaLeaderboardHistoryWithArenaInfo = ({
  user,
  skip,
  amount,
}: {
  user: string;
  skip: number;
  amount: number;
}) =>
  postgrest
    .from(TableName.ArenaLeaderboardHistoryWithArenaInfo)
    .select("*")
    .eq("user", user)
    .range(skip, skip + amount)
    .order("melee_id", ORDER_BY.DESC);

const selectMarketStateByAddress = ({ address }: { address: string }) =>
  postgrest
    .from(TableName.MarketState)
    .select("*")
    .eq("market_address", address)
    .limit(1)
    .maybeSingle();

export const fetchMelee = queryHelperSingle(selectMelee, toArenaMeleeModel);
export const fetchArenaInfo = queryHelperSingle(selectArenaInfo, toArenaInfoModel);
export const fetchPosition = queryHelperSingle(selectPosition, toArenaPositionModel);
export const fetchLatestPosition = queryHelperSingle(selectLatestPosition, toArenaPositionModel);
export const fetchArenaLeaderboardHistoryWithArenaInfo = queryHelper(
  callArenaLeaderboardHistoryWithArenaInfo,
  toArenaLeaderboardHistoryWithArenaInfo
);
export const fetchMarketStateByAddress = queryHelperSingle(
  selectMarketStateByAddress,
  toMarketStateModel
);
