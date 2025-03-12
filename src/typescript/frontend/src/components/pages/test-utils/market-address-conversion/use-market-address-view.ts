import { MarketMetadataByMarketAddress } from "@/contract-apis";
import { type Aptos } from "@aptos-labs/ts-sdk";
import { symbolBytesToEmojis } from "@sdk/emoji_data";
import { REGISTRY_ADDRESS } from "@sdk/emojicoin_dot_fun";
import { useQuery } from "@tanstack/react-query";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { withResponseError } from "lib/hooks/queries/client";
import { useMemo } from "react";

export const fetchSymbol = async (args: { aptos: Aptos; marketAddress: string }) =>
  await withResponseError(
    MarketMetadataByMarketAddress.view(args)
      .then(async ({ vec }) => vec.pop())
      .then((res) => (res ? symbolBytesToEmojis(res.emoji_bytes).emojis.map((v) => v.emoji) : null))
  );

export const useFetchSymbol = ({ addressIn }: { addressIn: string }) => {
  const { aptos } = useAptos();
  const addressInputSanitized = useMemo(() => {
    const input = addressIn.startsWith("0x") ? addressIn.substring(2) : addressIn;
    const anyInvalid = Array.from(input).some((c) => !/[a-f]|[A-F]|[0-9]/.test(c));
    return anyInvalid || !input ? "" : `0x${input}`;
  }, [addressIn]);

  const { data: emojis } = useQuery({
    queryKey: [addressInputSanitized, REGISTRY_ADDRESS.toString()],
    queryFn: () =>
      addressInputSanitized ? fetchSymbol({ aptos, marketAddress: addressInputSanitized }) : null,
    staleTime: Infinity,
  });

  return emojis;
};
