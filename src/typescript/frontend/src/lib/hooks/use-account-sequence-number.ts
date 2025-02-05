import { type Aptos, type AccountAddressInput } from "@aptos-labs/ts-sdk";
import { type AccountInfo } from "@aptos-labs/wallet-adapter-core";
import { getAptosClient } from "@sdk/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { withResponseError } from "./queries/client";
import { useMemo } from "react";

const fetchAccountSequenceNumber = async (accountAddress: AccountAddressInput) =>
  withResponseError(getAptosClient().account.getAccountInfo({ accountAddress })).then((res) =>
    BigInt(res.sequence_number)
  );

const CONST_KEY = "account_sequence_number";
const TEN_SECONDS = 10 * 1000;

// Ensure that the API key isn't hammered fetching an account's sequence number with this hook.
// This decouples the account sequence number from other params that might normally cause a
// re-render and re-fetch.
export const useAccountSequenceNumber = (aptos: Aptos, account: AccountInfo | null) => {
  const { accountAddress, network } = useMemo(
    () => ({
      accountAddress: account?.address,
      network: aptos.config.network,
    }),
    [account?.address, aptos.config.network]
  );

  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [CONST_KEY, accountAddress, network],
    queryFn: () => (accountAddress ? fetchAccountSequenceNumber(accountAddress) : null),
    staleTime: TEN_SECONDS,
    refetchInterval: TEN_SECONDS,
    refetchOnMount: true,
  });

  return {
    sequenceNumber: query.data ?? null,
    refetchSequenceNumber: () => query.refetch(),
    // Mark the query data as stale so it will revalidate on next component mount.
    markSequenceNumberStale: () =>
      queryClient.invalidateQueries({ queryKey: [CONST_KEY, accountAddress, network] }),
  };
};
