import { type AccountAddressInput, type Account } from "@aptos-labs/ts-sdk";
import { type PostgrestTransformBuilder } from "@supabase/postgrest-js";
import { LIMIT, ORDER_BY } from "../../../queries";
import { toAccountAddressString } from "../../../utils";
import { toUserPoolsRPCResponse } from "../../types";
import { postgrest } from "../client";
import { queryHelper } from "../utils";
import { sortByWithFallback } from "../query-params";
import { type MarketStateQueryArgs, SortMarketsBy } from "../../types/common";
import { type DatabaseRpc, type DatabaseJsonType } from "../../types/json-types";

const callUserPools = ({
  provider,
  page = 1,
  limit = LIMIT,
  orderBy = ORDER_BY.DESC,
  sortBy = SortMarketsBy.MarketCap,
}: { provider: Account | AccountAddressInput } & MarketStateQueryArgs) => {
  let query = postgrest
    .rpc("user_pools", { provider: toAccountAddressString(provider) })
    .select("*")
    .order(sortByWithFallback(sortBy), orderBy)
    .limit(limit);

  if (page !== 1) {
    query = query.range((page - 1) * limit, page * limit - 1);
  }

  return query as PostgrestTransformBuilder<
    any,
    any,
    Array<DatabaseJsonType["user_pools"]>,
    DatabaseRpc.UserPools,
    DatabaseRpc.UserPools
  >;
};

export const fetchUserLiquidityPools = queryHelper(callUserPools, toUserPoolsRPCResponse);
