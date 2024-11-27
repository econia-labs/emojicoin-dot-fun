import { type Account, type AccountAddressInput } from "@aptos-labs/ts-sdk";
import { LIMIT, ORDER_BY, type OrderBy } from "../../../queries";
import { type AnyNumberString } from "../../../types";
import {
  toChatEventModel,
  toLiquidityEventModel,
  toMarket1MPeriodsInLastDay,
  toMarketLatestStateEventModel,
  toMarketRegistrationEventModel,
  toSwapEventModel,
} from "../../types";
import { type MarketStateQueryArgs } from "../../types/common";
import { TableName } from "../../types/json-types";
import { postgrest } from "../client";
import { queryHelper } from "../utils";
import { toAccountAddressString } from "../../../utils";

// These queries should not be used directly; they are used only for testing purposes.

const selectLiquidityEvents = ({
  marketID,
  marketNonce,
}: {
  marketID: AnyNumberString;
  marketNonce: AnyNumberString;
}) =>
  postgrest
    .from(TableName.LiquidityEvents)
    .select("*")
    .eq("market_id", marketID)
    .eq("market_nonce", marketNonce);

// prettier-ignore
const selectMarket1MPeriodsInLastDay = ({ marketID }: { marketID: AnyNumberString }) =>
 postgrest
  .from(TableName.Market1MPeriodsInLastDay)
  .select("*")
  .eq("market_id", marketID);

// prettier-ignore
const selectMarketDailyVolume = ({ marketID }: { marketID: AnyNumberString }) =>
 postgrest
    .from(TableName.MarketDailyVolume)
    .select("daily_volume")
    .eq("market_id", marketID);

const selectLatestStateEventForMarket = ({ marketID }: { marketID: AnyNumberString }) =>
  postgrest
    .from(TableName.MarketLatestStateEvent)
    .select("*")
    .eq("market_id", marketID)
    .order("bump_time", ORDER_BY.DESC);

const selectSwapsBySwapper = ({
  swapper,
  page = 1,
  pageSize = LIMIT,
}: { swapper: Account | AccountAddressInput } & MarketStateQueryArgs) =>
  postgrest
    .from(TableName.SwapEvents)
    .select("*")
    .eq("swapper", toAccountAddressString(swapper))
    .range((page - 1) * pageSize, page * pageSize - 1);

const selectChatsByUser = ({
  user,
  page = 1,
  pageSize = LIMIT,
}: { user: Account | AccountAddressInput } & MarketStateQueryArgs) =>
  postgrest
    .from(TableName.ChatEvents)
    .select("*")
    .eq("user", toAccountAddressString(user))
    .range((page - 1) * pageSize, page * pageSize - 1);

const selectMarketRegistrationEvents = ({
  page = 1,
  pageSize = LIMIT,
  orderBy = ORDER_BY.DESC,
}: { orderBy?: OrderBy } & MarketStateQueryArgs) =>
  postgrest
    .from(TableName.MarketRegistrationEvents)
    .select("*")
    .order("transaction_version", orderBy)
    .range((page - 1) * pageSize, page * pageSize - 1);

const selectSwapEventsByVersion = ({
  fromVersion,
  toVersion,
  page = 1,
  pageSize = LIMIT,
}: { fromVersion: number, toVersion: number } & MarketStateQueryArgs) =>
  postgrest
    .from(TableName.SwapEvents)
    .select("*")
    .gte("transaction_version", fromVersion)
    .lte("transaction_version", toVersion)
    .range((page - 1) * pageSize, page * pageSize - 1);

const selectLiquidityEventsByVersion = ({
  fromVersion,
  toVersion,
  page = 1,
  pageSize = LIMIT,
}: { fromVersion: number, toVersion: number } & MarketStateQueryArgs) =>
  postgrest
    .from(TableName.LiquidityEvents)
    .select("*")
    .gte("transaction_version", fromVersion)
    .lte("transaction_version", toVersion)
    .range((page - 1) * pageSize, page * pageSize - 1);


export const fetchLiquidityEvents = queryHelper(selectLiquidityEvents, toLiquidityEventModel);
export const fetchDailyVolumeForMarket = queryHelper(selectMarketDailyVolume, (r) => ({
  dailyVolume: BigInt(r.daily_volume),
}));

export const fetchMarket1MPeriodsInLastDay = queryHelper(
  selectMarket1MPeriodsInLastDay,
  toMarket1MPeriodsInLastDay
);

export const fetchLatestStateEventForMarket = queryHelper(
  selectLatestStateEventForMarket,
  toMarketLatestStateEventModel
);
export const fetchSwapEventsBySwapper = queryHelper(selectSwapsBySwapper, toSwapEventModel);
export const fetchChatEventsByUser = queryHelper(selectChatsByUser, toChatEventModel);
export const fetchMarketRegistrationEvents = queryHelper(
  selectMarketRegistrationEvents,
  toMarketRegistrationEventModel
);

export const fetchSwapEventsByVersion = queryHelper(selectSwapEventsByVersion, toSwapEventModel);
export const fetchLiquidityEventsByVersion = queryHelper(selectLiquidityEventsByVersion, toLiquidityEventModel);
