import { type Account } from "@aptos-labs/ts-sdk";
import { ORDER_BY } from "../../queries/const";
import { type AnyNumberString } from "../../types";
import { toChatEventModel, toSwapEventModel } from "../types";
import { TableName } from "../types/snake-case-types";
import { normalizeAddressForQuery, withQueryConfig } from "./utils";
import { postgrest } from "./client";

// Queries without indexes on them. These are primarily used for tests, although in some cases
// they may be useful for debugging or other purposes.

export const fetchAllSwapsBySwapper = withQueryConfig(
  ({ swapper }: { swapper: Account }) =>
    postgrest
      .from(TableName.SwapEvents)
      .select("*")
      .eq("swapper", normalizeAddressForQuery(swapper))
      .order("market_nonce", ORDER_BY.DESC),
  toSwapEventModel
);

/* eslint-disable-next-line import/no-unused-modules */
export const fetchAllChatsByUser = withQueryConfig(
  ({ user }: { user: Account }) =>
    postgrest
      .from(TableName.ChatEvents)
      .select("*")
      .eq("user", normalizeAddressForQuery(user))
      .order("market_nonce", ORDER_BY.DESC),
  toChatEventModel
);

/* eslint-disable-next-line import/no-unused-modules */
export const fetchAllChatsByUserAndMarket = withQueryConfig(
  ({ user, marketID }: { user: Account; marketID: AnyNumberString }) =>
    postgrest
      .from(TableName.ChatEvents)
      .select("*")
      .eq("user", normalizeAddressForQuery(user))
      .eq("market_id", marketID)
      .order("market_nonce", ORDER_BY.DESC),
  toChatEventModel
);
