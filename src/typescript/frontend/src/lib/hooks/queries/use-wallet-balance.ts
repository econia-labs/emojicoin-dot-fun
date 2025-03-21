import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

import { Balance } from "@/move-modules";
import { getAptosClient } from "@/sdk/utils/aptos-client";
import type { CoinTypeString } from "@/sdk/utils/type-tags";
/* eslint-disable-next-line */ // So we can link the import in the doc comment.
import { type useLatestBalance } from "@/store/latest-balance/store";

import { withResponseError } from "./client";

const STALE_TIME = 10000;

/**
 * Used in conjunction with {@link useLatestBalance}; not intended to be used alone unless you don't
 * plan on tracking coin balances anywhere else.
 */
export const useFetchWalletBalanceQuery = (
  accountAddress: `0x${string}` | undefined,
  coinType: CoinTypeString | undefined
) => {
  const { data, isFetching, refetch, isStale } = useQuery({
    queryKey: ["fetch-wallet-balance-query", accountAddress, coinType],
    queryFn: () => {
      if (!accountAddress || !coinType) return null;
      return withResponseError(
        Balance.viewWithVersion({
          aptos: getAptosClient(),
          owner: accountAddress,
          typeTags: [coinType],
        }).then(({ balance, headers }) => ({
          balance: BigInt(balance),
          version: BigInt(headers["x-aptos-ledger-version"]),
        }))
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
