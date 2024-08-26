import { MarketMetadataByEmojiBytes } from "@sdk/emojicoin_dot_fun/emojicoin-dot-fun";
import { normalizeHex } from "@sdk/utils";
import { sumBytes } from "@sdk/utils/sum-emoji-bytes";
import { useEmojiPicker } from "context/emoji-picker-context";
import { useQuery } from "@tanstack/react-query";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { useEventStore } from "context/state-store-context";

const encoder = new TextEncoder();

export const useIsMarketRegistered = () => {
  const emojis = useEmojiPicker((state) => state.emojis);
  const symbols = useEventStore((state) => state.symbols);
  const { aptos } = useAptos();
  const emojiBytes = normalizeHex(encoder.encode(emojis.join("")));

  const { data } = useQuery({
    queryKey: [MarketMetadataByEmojiBytes.prototype.functionName, aptos.config.network, emojiBytes],
    queryFn: async () => {
      const length = sumBytes(emojis);
      const invalidLength = length === 0 || length > 10;
      const inSymbolMap = symbols.has(emojis.join(""));

      // Early return for invalid length or if the symbol is already in the map.
      // This avoids an unnecessary fetch request.
      if (invalidLength || inSymbolMap) {
        return {
          invalid: true,
          // Registered resolves to undefined because it *may* be registered, but we don't know
          // for sure. It doesn't matter because it's already invalid due to the length.
          registered: inSymbolMap ? true : undefined,
        };
      }
      const registered = await MarketMetadataByEmojiBytes.view({
        aptos: aptos.config,
        emojiBytes,
      }).then((res) => typeof res.vec.at(0) !== "undefined");

      return {
        invalid: invalidLength || registered,
        registered,
      };
    },
    staleTime: 1,
  });

  return (
    data ?? {
      invalid: true,
      registered: undefined,
    }
  );
};
