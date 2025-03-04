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
import { toAccountAddressString } from "../../../utils/account-address";
import { type AccountAddressInput } from "@aptos-labs/ts-sdk";

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

const selectPosition = ({ user, meleeID }: { user: AccountAddressInput; meleeID: bigint }) =>
  postgrest
    .from(TableName.ArenaPosition)
    .select("*")
    .eq("user", toAccountAddressString(user))
    .eq("melee_id", meleeID)
    .maybeSingle();

const selectLatestPosition = ({ user }: { user: AccountAddressInput }) =>
  postgrest
    .from(TableName.ArenaPosition)
    .select("*")
    .eq("user", toAccountAddressString(user))
    .order("melee_id", ORDER_BY.DESC)
    .limit(1)
    .maybeSingle();

const selectArenaLeaderboardHistoryWithInfo = ({
  user,
  page = 1,
  pageSize,
}: {
  user: AccountAddressInput;
  page: number;
  pageSize: number;
}) =>
  postgrest
    .from(TableName.ArenaLeaderboardHistoryWithArenaInfo)
    .select("*")
    .eq("user", toAccountAddressString(user))
    .order("melee_id", ORDER_BY.DESC)
    .limit(pageSize)
    .range((page - 1) * pageSize, page * pageSize - 1);

const selectMarketStateByAddress = ({ address }: { address: string }) =>
  postgrest
    .from(TableName.MarketState)
    .select("*")
    .eq("market_address", toAccountAddressString(address))
    .limit(1)
    .maybeSingle();

export const fetchMelee = queryHelperSingle(selectMelee, toArenaMeleeModel);
export const fetchArenaInfo = queryHelperSingle(selectArenaInfo, toArenaInfoModel);
export const fetchPosition = queryHelperSingle(selectPosition, toArenaPositionModel);
export const fetchLatestPosition = queryHelperSingle(selectLatestPosition, toArenaPositionModel);
export const fetchArenaLeaderboardHistoryWithArenaInfo = queryHelper(
  selectArenaLeaderboardHistoryWithInfo,
  toArenaLeaderboardHistoryWithArenaInfo
);
export const fetchMarketStateByAddress = queryHelperSingle(
  selectMarketStateByAddress,
  toMarketStateModel
);
