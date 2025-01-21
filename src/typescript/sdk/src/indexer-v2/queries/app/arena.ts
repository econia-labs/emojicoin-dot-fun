if (process.env.NODE_ENV !== "test") {
  require("server-only");
}

import { ORDER_BY } from "../../../queries";
import { TableName } from "../../types/json-types";
import { postgrest } from "../client";
import { queryHelperSingle } from "../utils";
import {
  toArenaInfoModel,
  toArenaMeleeModel,
  toArenaPositionsModel,
  toMarketStateModel,
} from "../../types";

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
    .from(TableName.ChatEvents)
    .select("*")
    .eq("user", user)
    .eq("melee_id", meleeID)
    .maybeSingle();

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
export const fetchMarketStateByAddress = queryHelperSingle(
  selectMarketStateByAddress,
  toMarketStateModel
);
