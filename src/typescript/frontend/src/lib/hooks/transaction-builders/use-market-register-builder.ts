import { useEmojiPicker } from "context/emoji-picker-context";
import { INTEGRATOR_ADDRESS } from "lib/env";
import { useMemo } from "react";

import { useAccountAddress } from "@/hooks/use-account-address";
import { RegisterMarket } from "@/move-modules/emojicoin-dot-fun";
import { SYMBOL_EMOJI_DATA } from "@/sdk/emoji_data/emoji-data";

import { useTransactionBuilderWithOptions } from "./use-transaction-builder";

/**
 * The individual args here must be passed to avoid re-renders due to a new object of args being
 * passed on re-renders.
 */
export const useMarketRegisterTransactionBuilder = (
  accountSequenceNumber: bigint | null,
  gasAmount: number,
  gasUnitPrice: number
) => {
  const accountAddress = useAccountAddress();
  const emojis = useEmojiPicker((s) => s.emojis);

  const { memoizedArgs, options } = useMemo(() => {
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
  }, [accountAddress, emojis, accountSequenceNumber, gasAmount, gasUnitPrice]);

  return useTransactionBuilderWithOptions(memoizedArgs, RegisterMarket, options);
};
