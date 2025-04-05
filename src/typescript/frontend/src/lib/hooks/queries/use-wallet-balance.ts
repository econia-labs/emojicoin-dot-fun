import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

import type { StructTagString } from "@/sdk/index";
import { getAptosClient } from "@/sdk/utils/aptos-client";
import type { CoinTypeString } from "@/sdk/utils/type-tags";
/* eslint-disable-next-line */ // So we can link the import in the doc comment.
import { type useLatestBalance } from "@/store/latest-balance";

import { withResponseError } from "./client";

const STALE_TIME = 10000;

const fetchFungibleAssetBalanceAndVersion = async (
  accountAddress: `0x${string}`,
  coinType: StructTagString,
  minimumLedgerVersion?: number
) => {
  const res = await getAptosClient().fungibleAsset.getCurrentFungibleAssetBalances({
    minimumLedgerVersion,
    options: {
      limit: 1,
      where: {
        asset_type: {
          _eq: coinType,
        },
        owner_address: {
          _eq: accountAddress,
        },
      },
    },
  });
  const { amount, last_transaction_version } = res.at(0) ?? {};
  return {
    balance: amount ? BigInt(amount) : null,
    version: last_transaction_version ? BigInt(last_transaction_version) : null,
  };
};

/**
 * Used in conjunction with {@link useLatestBalance}; not intended to be used alone unless you don't
 * plan on tracking coin balances anywhere else.
 */
export const useFetchWalletBalanceQuery = (
  accountAddress: `0x${string}` | undefined,
  coinType: CoinTypeString | undefined,
  minimumLedgerVersion?: number
) => {
  const { data, isFetching, refetch, isStale } = useQuery({
    queryKey: ["fetch-wallet-balance-query", accountAddress, coinType],
    queryFn: () => {
      if (!accountAddress || !coinType) return null;
      return withResponseError(
        fetchFungibleAssetBalanceAndVersion(accountAddress, coinType, minimumLedgerVersion)
      );
    },
    staleTime: STALE_TIME,
    enabled: !!accountAddress && !!coinType,
  });

  const refetchIfStale = useCallback(() => {
    if (isStale) refetch();
  }, [refetch, isStale]);

  return {
    balance: BigInt(data?.balance ?? 0),
    version: BigInt(data?.version ?? -1n),
    isFetching,
    refetchIfStale,
  };
};
