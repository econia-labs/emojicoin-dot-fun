import { useQuery } from "@tanstack/react-query";
import { useEmojiPicker } from "context/emoji-picker-context";
import { useEventStore } from "context/event-store-context";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { useNumMarkets } from "lib/hooks/queries/use-num-markets";

import { MarketMetadataByEmojiBytes } from "@/move-modules/emojicoin-dot-fun";
import { SYMBOL_EMOJI_DATA, type SymbolEmoji } from "@/sdk/emoji_data";
import { normalizeHex } from "@/sdk/utils";
import { sumBytes } from "@/sdk/utils/sum-emoji-bytes";

const encoder = new TextEncoder();

export const useIsMarketRegistered = () => {
  const emojis = useEmojiPicker((state) => state.emojis);
  const getMarket = useEventStore((state) => state.getMarket);
  const { aptos } = useAptos();
  const emojiBytes = normalizeHex(encoder.encode(emojis.join("")));
  const { data: numMarkets } = useNumMarkets();

  const { data } = useQuery({
    queryKey: [
      MarketMetadataByEmojiBytes.prototype.functionName,
      aptos.config.network,
      emojiBytes,
      // Invalidate the cache when the number of markets changes.
      numMarkets,
    ],
    queryFn: async () => {
      const length = sumBytes(emojis);
      const invalidLength = length === 0 || length > 10;
      // If not all of the emojis are in the symbol data map, then it can't have been registered.
      if (!emojis.every(SYMBOL_EMOJI_DATA.byEmoji)) {
        return {
          invalid: true,
          registered: false,
        };
      }
      const inSymbolMap = getMarket(emojis as SymbolEmoji[]);

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
    // Once fetched, this data will never change as long as `numMarkets` hasn't changed.
    staleTime: Infinity,
  });

  return (
    data ?? {
      invalid: true,
      registered: undefined,
    }
  );
};
