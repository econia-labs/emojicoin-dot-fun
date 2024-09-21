import { type Account } from "@aptos-labs/ts-sdk";
import { ORDER_BY } from "../../../queries";
import { toAccountAddressString } from "../../../utils";
import { toUserLiquidityPoolsModel } from "../../types";
import { TableName } from "../../types/snake-case-types";
import { postgrest } from "../client";
import { queryHelper } from "../utils";

const selectUserLiquidityPools = ({ provider }: { provider: Account }) =>
  postgrest
    .from(TableName.UserLiquidityPools)
    .select("*")
    .eq("provider", toAccountAddressString(provider))
    .order("market_nonce", ORDER_BY.DESC);

export const fetchUserLiquidityPools = queryHelper(
  selectUserLiquidityPools,
  toUserLiquidityPoolsModel
);
