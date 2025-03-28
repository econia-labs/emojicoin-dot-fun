import { useEmojiPicker } from "context/emoji-picker-context";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { useMemo } from "react";

import { Chat } from "@/move-modules/emojicoin-dot-fun";
import { MAX_NUM_CHAT_EMOJIS } from "@/sdk/const";
import { toChatMessageEntryFunctionArgs } from "@/sdk/emoji_data/chat-message";
import { toEmojicoinTypesForEntry } from "@/sdk/markets";

import { useTransactionBuilder } from "./use-transaction-builder";

/**
 * The individual args here must be passed to avoid re-renders due to a new object of args being
 * passed on re-renders.
 */
export const useChatTransactionBuilder = (marketAddress?: `0x${string}`) => {
  const { account } = useAptos();
  const emojis = useEmojiPicker((s) => s.emojis);

  const memoizedArgs = useMemo(() => {
    if (!account || emojis.length === 0 || emojis.length > MAX_NUM_CHAT_EMOJIS || !marketAddress) {
      return null;
    }
    const emojiText = emojis.join("");
    const { emojiBytes, emojiIndicesSequence } = toChatMessageEntryFunctionArgs(emojiText);
    const typeTags = toEmojicoinTypesForEntry(marketAddress);
    return {
      user: account.address,
      marketAddress,
      emojiBytes,
      emojiIndicesSequence,
      typeTags,
    };
  }, [account, emojis, marketAddress]);

  return useTransactionBuilder(memoizedArgs, Chat);
};
