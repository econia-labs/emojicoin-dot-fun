import { useEmojiPicker } from "context/emoji-picker-context";
import { useMemo } from "react";

import { useAccountAddress } from "@/hooks/use-account-address";
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
  const accountAddress = useAccountAddress();
  const emojis = useEmojiPicker((s) => s.emojis);

  const memoizedArgs = useMemo(() => {
    if (
      !accountAddress ||
      emojis.length === 0 ||
      emojis.length > MAX_NUM_CHAT_EMOJIS ||
      !marketAddress
    ) {
      return null;
    }
    const emojiText = emojis.join("");
    const { emojiBytes, emojiIndicesSequence } = toChatMessageEntryFunctionArgs(emojiText);
    const typeTags = toEmojicoinTypesForEntry(marketAddress);
    return {
      user: accountAddress,
      marketAddress,
      emojiBytes,
      emojiIndicesSequence,
      typeTags,
    };
  }, [accountAddress, emojis, marketAddress]);

  return useTransactionBuilder(memoizedArgs, Chat);
};
