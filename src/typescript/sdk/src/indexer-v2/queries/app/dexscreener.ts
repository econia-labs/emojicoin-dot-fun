import { type SymbolEmoji } from "../../../emoji_data";
import { LIMIT } from "../../const";
import {
  toLiquidityEventModel,
  toMarketRegistrationEventModel,
  toSwapEventModel,
} from "../../types";
import type { MarketStateQueryArgs } from "../../types/common";
import { TableName } from "../../types/json-types";
import { postgrest, toQueryArray } from "../client";
import { queryHelper } from "../utils";

const selectMarketRegistrationEventBySymbolEmojis = ({
  searchEmojis,
  page = 1,
  pageSize = LIMIT,
}: { searchEmojis: SymbolEmoji[] } & MarketStateQueryArgs) =>
  postgrest
    .from(TableName.MarketRegistrationEvents)
    .select("*")
    .eq("symbol_emojis", toQueryArray(searchEmojis))
    .range((page - 1) * pageSize, page * pageSize - 1);

const selectSwapEventsByBlock = ({
  fromBlock,
  toBlock,
  page = 1,
  pageSize = LIMIT,
}: { fromBlock: number; toBlock: number } & MarketStateQueryArgs) =>
  postgrest
    .from(TableName.SwapEvents)
    .select("*")
    .gte("block_number", fromBlock)
    .lte("block_number", toBlock)
    .range((page - 1) * pageSize, page * pageSize - 1);

const selectLiquidityEventsByBlock = ({
  fromBlock,
  toBlock,
  page = 1,
  pageSize = LIMIT,
}: { fromBlock: number; toBlock: number } & MarketStateQueryArgs) =>
  postgrest
    .from(TableName.LiquidityEvents)
    .select("*")
    .gte("block_number", fromBlock)
    .lte("block_number", toBlock)
    .range((page - 1) * pageSize, page * pageSize - 1);

export const fetchMarketRegistrationEventBySymbolEmojis = queryHelper(
  selectMarketRegistrationEventBySymbolEmojis,
  toMarketRegistrationEventModel
);

export const fetchSwapEventsByBlock = queryHelper(selectSwapEventsByBlock, toSwapEventModel);
export const fetchLiquidityEventsByBlock = queryHelper(
  selectLiquidityEventsByBlock,
  toLiquidityEventModel
);
