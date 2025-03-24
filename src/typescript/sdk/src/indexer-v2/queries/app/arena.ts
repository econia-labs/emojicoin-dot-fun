import "server-only";

import { type AccountAddressInput } from "@aptos-labs/ts-sdk";

import { type ArenaPeriod } from "../../..";
import { type AnyNumberString } from "../../../types";
import { toAccountAddressString } from "../../../utils/account-address";
import { ORDER_BY } from "../../const";
import {
  toArenaCandlestickModel,
  toArenaInfoModel,
  toArenaLeaderboardHistoryWithArenaInfo,
  toArenaMeleeModel,
  toArenaPositionModel,
  toMarketStateModel,
} from "../../types";
import { TableName } from "../../types/json-types";
import { postgrest } from "../client";
import { queryHelper, queryHelperSingle } from "../utils";

const selectMelee = () =>
  postgrest
    .from(TableName.ArenaMeleeEvents)
    .select("*")
    .order("melee_id", ORDER_BY.DESC)
    .limit(1)
    .single();

// prettier-ignore
const selectArenaInfoByMeleeID = ({ meleeID }: {meleeID: AnyNumberString}) =>
  postgrest
    .from(TableName.ArenaInfo)
    .select("*")
    .eq("melee_id", meleeID)
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

const selectArenaCandlesticksSince = ({
  meleeID,
  start,
  end,
  period,
}: {
  meleeID: AnyNumberString;
  start: Date;
  end: Date;
  period: ArenaPeriod;
}) => {
  const query = postgrest
    .from(TableName.ArenaCandlesticks)
    .select("*")
    .eq("melee_id", meleeID)
    .eq("period", period)
    .gte("start_time", start.toISOString())
    .lt("start_time", end.toISOString())
    .order("start_time", ORDER_BY.ASC);
  return query;
};

export const fetchMelee = queryHelperSingle(selectMelee, toArenaMeleeModel);
export const fetchArenaInfo = queryHelperSingle(selectArenaInfo, toArenaInfoModel);
export const fetchArenaInfoByMeleeID = queryHelperSingle(
  selectArenaInfoByMeleeID,
  toArenaInfoModel
);
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
export const fetchArenaCandlesticksSince = queryHelper(
  selectArenaCandlesticksSince,
  toArenaCandlestickModel
);
