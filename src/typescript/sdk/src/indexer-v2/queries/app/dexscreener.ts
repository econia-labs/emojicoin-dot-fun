import { queryHelper } from "../utils";
import { toLiquidityEventModel, toMarketRegistrationEventModel, toSwapEventModel } from "../../types";
import { LIMIT } from "../../../queries";
import type { MarketStateQueryArgs } from "../../types/common";
import { postgrest } from "../client";
import { TableName } from "../../types/json-types";


const selectMarketRegistrationEventBySymbolBytes = ({
  symbolBytes,
  page = 1,
  pageSize = LIMIT,
}: { symbolBytes: Uint8Array } & MarketStateQueryArgs) =>
  postgrest
    .from(TableName.MarketRegistrationEvents)
    .select("*")
    .eq("symbol_bytes", symbolBytes)
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

export const fetchMarketRegistrationEventBySymbolBytes = queryHelper(
  selectMarketRegistrationEventBySymbolBytes,
  toMarketRegistrationEventModel
);

export const fetchSwapEventsByVersion = queryHelper(selectSwapEventsByVersion, toSwapEventModel);
export const fetchLiquidityEventsByVersion = queryHelper(selectLiquidityEventsByVersion, toLiquidityEventModel);
