import { RegisterMarket } from "@sdk/emojicoin_dot_fun/emojicoin-dot-fun";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import {
  Ed25519PublicKey,
  isUserTransactionResponse,
  type PendingTransactionResponse,
  type UserTransactionResponse,
} from "@aptos-labs/ts-sdk";
import { INTEGRATOR_ADDRESS } from "lib/env";
import { MARKET_REGISTRATION_FEE, ONE_APT } from "@sdk/const";
import { useEmojiPicker } from "context/emoji-picker-context";
import { SYMBOL_DATA } from "@sdk/emoji_data";
import { useNumMarkets } from "lib/hooks/queries/use-num-markets";
import { useQuery } from "@tanstack/react-query";

export const useRegisterMarket = () => {
  const emojis = useEmojiPicker((state) => state.emojis);
  const setIsLoadingRegisteredMarket = useEmojiPicker(
    (state) => state.setIsLoadingRegisteredMarket
  );
  const clear = useEmojiPicker((state) => state.clear);
  const setPickerInvisible = useEmojiPicker((state) => state.setPickerInvisible);
  const { aptos, account, signThenSubmit } = useAptos();

  const { data: numMarkets } = useNumMarkets();

  const { data: gas } = useQuery({
    queryKey: ["register-market-cost", numMarkets, account?.address],
    queryFn: async () => {
      const publicKey = new Ed25519PublicKey(
        typeof account!.publicKey === "string" ? account!.publicKey : account!.publicKey[0]
      );
      const r = await RegisterMarket.getGasCost({
        aptosConfig: aptos.config,
        registrant: account!.address,
        registrantPubKey: publicKey,
        emojis:
          numMarkets === 0
            ? [SYMBOL_DATA.byName("Virgo")!.bytes]
            : emojis.map((e) => SYMBOL_DATA.byEmoji(e)!.bytes),
      });
      return r;
    },
    staleTime: 1000,
    enabled: numMarkets !== undefined && account !== null,
  });

  const registerMarket = async () => {
    if (!account) {
      return;
    }
    // Set the picker invisible for the duration of the registration transaction.
    setPickerInvisible(true);
    let res: PendingTransactionResponse | UserTransactionResponse | undefined | null;
    let error: unknown;
    const builderArgs = {
      aptosConfig: aptos.config,
      registrant: account.address,
      emojis: emojis.map((e) => SYMBOL_DATA.byEmoji(e)!.bytes),
      integrator: INTEGRATOR_ADDRESS,
    };
    let amount: number, unitPrice: number;
    if (gas) {
      amount = gas.amount;
      unitPrice = gas.unitPrice;
    } else {
      amount = ONE_APT / 100;
      unitPrice = 100;
    }
    const builderLambda = () =>
      RegisterMarket.builder({
        ...builderArgs,
        options: {
          maxGasAmount: Math.round(amount * 1.2),
          gasUnitPrice: unitPrice,
        },
      });
    await signThenSubmit(builderLambda).then((r) => {
      res = r?.response ?? null;
      error = r?.error;
    });

    if (res && isUserTransactionResponse(res)) {
      clear();
      // The event is parsed and added as a registered market in `event-store.ts`,
      // we don't need to do anything here other than set the loading state.
      setIsLoadingRegisteredMarket(true);
    } else {
      // If the transaction fails or the user cancels the transaction, we unset the loading state
      // and set the picker visible.
      // Note that we don't clear the input here, because the user may want to alter it to make it
      // correct and try again.
      setPickerInvisible(false);
      console.error("Error registering market:", error);
      setIsLoadingRegisteredMarket(false);
    }
  };

  // By default, just consider that this is the price, since in 99.99% of cases, this will be the most accurate estimate.
  let cost: number = Number(MARKET_REGISTRATION_FEE);

  if (gas !== undefined) {
    if (numMarkets === 0) {
      cost = gas.unitPrice * gas.amount;
    } else {
      cost += gas.unitPrice * gas.amount;
    }
  }

  return {
    registerMarket,
    cost,
  };
};
