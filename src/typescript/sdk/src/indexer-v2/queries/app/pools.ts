import type { Account, AccountAddressInput } from "@aptos-labs/ts-sdk";

import { toAccountAddressString } from "../../../utils";
import { LIMIT, ORDER_BY } from "../../const";
import { toUserPoolsRPCResponse } from "../../types";
import { type MarketStateQueryArgs, SortMarketsBy } from "../../types/common";
import { postgrest } from "../client";
import { sortByWithFallback } from "../query-params";
import { queryHelper } from "../utils";

const callUserPools = ({
  provider,
  page = 1,
  pageSize = LIMIT,
  orderBy = ORDER_BY.DESC,
  sortBy = SortMarketsBy.MarketCap,
}: { provider: Account | AccountAddressInput } & MarketStateQueryArgs) => {
  // Since this is a read-only function call, prefer to call this as a `GET` request. It makes API
  // gateway authorization simpler and cleaner.
  let query = postgrest
    .rpc("user_pools", { provider: toAccountAddressString(provider) }, { get: true })
    .select("*")
    .order(sortByWithFallback(sortBy), orderBy)
    .limit(pageSize);

  if (page !== 1) {
    query = query.range((page - 1) * pageSize, page * pageSize - 1);
  }

  return query;
};

export const fetchUserLiquidityPools = queryHelper(callUserPools, toUserPoolsRPCResponse);
