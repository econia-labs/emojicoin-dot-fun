import { RegisterMarket, RegistryView } from "@sdk/emojicoin_dot_fun/emojicoin-dot-fun";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { type PendingTransactionResponse, type UserTransactionResponse } from "@aptos-labs/ts-sdk";
import { INTEGRATOR_ADDRESS } from "lib/env";
import { DEFAULT_REGISTER_MARKET_GAS_OPTIONS } from "@sdk/const";
import { toRegistryView } from "@sdk/types";
import useInputStore from "@store/input-store";
import { SYMBOL_DATA } from "@sdk/emoji_data";

export const useRegisterMarket = () => {
  const emojis = useInputStore((state) => state.emojis);
  const { aptos, account, submit, signThenSubmit } = useAptos();
  const clear = useInputStore((state) => state.clear);

  const registerMarket = async () => {
    if (!account) {
      return;
    }
    let res: PendingTransactionResponse | UserTransactionResponse | null = null;
    let error: unknown;
    const builderArgs = {
      aptosConfig: aptos.config,
      registrant: account.address,
      emojis: emojis.map((e) => SYMBOL_DATA.byEmoji(e)!.bytes),
      integrator: INTEGRATOR_ADDRESS,
    };
    try {
      const builderLambda = () => RegisterMarket.builder(builderArgs);
      await submit(builderLambda).then((r) => {
        res = r?.response ?? null;
        error = r?.error;
      });
    } catch (e) {
      // TODO: Check if this works.
      // If the market registration fails, it's possibly because it's the first market and the gas limit
      // needs to be set very high. We'll check if the registry has 0 markets, and then try to manually
      // set the gas limits and submit again.
      const registryView = await RegistryView.view({
        aptos,
      }).then((r) => toRegistryView(r));

      const builderLambda = () =>
        RegisterMarket.builder({
          ...builderArgs,
          options: DEFAULT_REGISTER_MARKET_GAS_OPTIONS,
        });

      if (registryView.numMarkets === 0n) {
        await signThenSubmit(builderLambda).then((r) => {
          res = r?.response ?? null;
          error = r?.error;
        });
      }
    }

    if (res) {
      clear();
    } else {
      console.error("Error registering market:", error);
    }
  };

  return registerMarket;
};
