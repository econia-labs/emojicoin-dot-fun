import { MAX_NUM_CHAT_EMOJIS } from "@sdk/const";
import { toChatMessageEntryFunctionArgs } from "@sdk/emoji_data/chat-message";
import { toCoinTypesForEntry } from "@sdk/markets";
import { useEmojiPicker } from "context/emoji-picker-context";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { useMemo } from "react";
import { useTransactionBuilder } from "./use-transaction-builder";
import { Chat } from "@/contract-apis/emojicoin-dot-fun";

/**
 * The individual args here must be passed to avoid re-renders due to a new object of args being
 * passed on re-renders.
 */
export const useChatTransactionBuilder = (marketAddress: `0x${string}`) => {
  const { account } = useAptos();
  const emojis = useEmojiPicker((s) => s.emojis);

  const memoizedArgs = useMemo(() => {
    if (!account || emojis.length === 0 || emojis.length > MAX_NUM_CHAT_EMOJIS) {
      return null;
    }
    const emojiText = emojis.join("");
    const { emojiBytes, emojiIndicesSequence } = toChatMessageEntryFunctionArgs(emojiText);
    const typeTags = toCoinTypesForEntry(marketAddress);
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
