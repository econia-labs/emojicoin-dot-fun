import { type Account } from "@aptos-labs/ts-sdk";
import { ORDER_BY } from "../../queries";
import { type AnyNumberString } from "../../types";
import { toAccountAddressString } from "../../utils";
import {
  toChatEventModel,
  toLiquidityEventModel,
  toMarket1MPeriodsInLastDay,
  toMarketLatestStateEventModel,
  toSwapEventModel,
} from "../types";
import { TableName } from "../types/snake-case-types";
import { postgrest } from "./client";
import { queryHelper } from "./utils";

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

const selectMarket1MPeriodsInLastDay = ({ marketID }: { marketID: AnyNumberString }) =>
  postgrest.from(TableName.Market1MPeriodsInLastDay).select("*").eq("market_id", marketID);

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

export const fetchAllSwapsBySwapper = queryHelper(
  ({ swapper }: { swapper: Account }) =>
    postgrest
      .from(TableName.SwapEvents)
      .select("*")
      .eq("swapper", toAccountAddressString(swapper))
      .order("market_nonce", ORDER_BY.DESC),
  toSwapEventModel
);

/* eslint-disable-next-line import/no-unused-modules */
export const fetchAllChatsByUser = queryHelper(
  ({ user }: { user: Account }) =>
    postgrest
      .from(TableName.ChatEvents)
      .select("*")
      .eq("user", toAccountAddressString(user))
      .order("market_nonce", ORDER_BY.DESC),
  toChatEventModel
);

/* eslint-disable-next-line import/no-unused-modules */
export const fetchAllChatsByUserAndMarket = queryHelper(
  ({ user, marketID }: { user: Account; marketID: AnyNumberString }) =>
    postgrest
      .from(TableName.ChatEvents)
      .select("*")
      .eq("user", toAccountAddressString(user))
      .eq("market_id", marketID)
      .order("market_nonce", ORDER_BY.DESC),
  toChatEventModel
);
