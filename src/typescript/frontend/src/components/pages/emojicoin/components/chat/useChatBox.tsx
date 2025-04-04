import { isUserTransactionResponse } from "@aptos-labs/ts-sdk";
import { useEmojiPicker } from "context/emoji-picker-context";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { useChatTransactionBuilder } from "lib/hooks/transaction-builders/use-chat-builder";
import { useEffect } from "react";

export const useChatBox = (marketAddress?: `0x${string}`) => {
  const { submit } = useAptos();
  const clear = useEmojiPicker((state) => state.clear);
  const setMode = useEmojiPicker((state) => state.setMode);
  const setPickerInvisible = useEmojiPicker((state) => state.setPickerInvisible);

  useEffect(() => {
    setMode("chat");
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  const transactionBuilder = useChatTransactionBuilder(marketAddress);

  const sendChatMessage = async () => {
    // Set the picker invisible while the transaction is being processed.
    setPickerInvisible(true);
    const res = await submit(transactionBuilder);
    if (res && res.response && isUserTransactionResponse(res.response)) {
      clear();
    } else {
      setPickerInvisible(false);
    }
  };

  return { sendChatMessage };
};
