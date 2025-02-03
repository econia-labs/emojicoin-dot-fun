import { INTEGRATOR_ADDRESS } from "lib/env";
import { useEmojiPicker } from "context/emoji-picker-context";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { useMemo } from "react";
import { useTransactionBuilderWithOptions } from "./use-transaction-builder";
import { RegisterMarket } from "@/contract-apis/emojicoin-dot-fun";
import { SYMBOL_EMOJI_DATA } from "@sdk/emoji_data/emoji-data";

/**
 * The individual args here must be passed to avoid re-renders due to a new object of args being
 * passed on re-renders.
 */
export const useMarketRegisterTransactionBuilder = (
  accountSequenceNumber: bigint | null,
  gasAmount: number,
  gasUnitPrice: number
) => {
  const { account } = useAptos();
  const emojis = useEmojiPicker((s) => s.emojis);

  const { memoizedArgs, options } = useMemo(() => {
    const accountAddress = account?.address;
    const emojiBytes = emojis.map((e) => SYMBOL_EMOJI_DATA.byEmoji(e)!.bytes);
    const memoizedArgs = accountAddress
      ? {
          registrant: accountAddress,
          emojis: emojiBytes,
          integrator: INTEGRATOR_ADDRESS,
        }
      : null;
    const options =
      accountSequenceNumber !== null
        ? {
            maxGasAmount: Math.round(gasAmount * 1.2),
            gasUnitPrice,
            accountSequenceNumber,
          }
        : undefined;
    return {
      memoizedArgs,
      options,
    };
  }, [account?.address, emojis, accountSequenceNumber, gasAmount, gasUnitPrice]);

  return useTransactionBuilderWithOptions(memoizedArgs, RegisterMarket, options);
};
