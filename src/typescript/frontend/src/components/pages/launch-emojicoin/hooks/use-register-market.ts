import { RegisterMarket, RegistryView } from "@sdk/emojicoin_dot_fun/emojicoin-dot-fun";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import {
  AccountAddress,
  isUserTransactionResponse,
  type PendingTransactionResponse,
  type UserTransactionResponse,
} from "@aptos-labs/ts-sdk";
import { INTEGRATOR_ADDRESS } from "lib/env";
import { DEFAULT_REGISTER_MARKET_GAS_OPTIONS } from "@sdk/const";
import { toRegistryView } from "@sdk/types";
import useInputStore from "@store/input-store";
import { type RegisteredMarket, SYMBOL_DATA, symbolToEmojis } from "@sdk/emoji_data";
import { getEvents } from "@sdk/emojicoin_dot_fun";
import { useEventStore } from "context/websockets-context";

export const useRegisterMarket = () => {
  const emojis = useInputStore((state) => state.emojis);
  const { aptos, account, submit, signThenSubmit } = useAptos();
  const addRegisteredMarket = useEventStore((state) => state.addRegisteredMarket);

  const registerMarket = async () => {
    if (!account) {
      return;
    }
    let res: PendingTransactionResponse | UserTransactionResponse | undefined | null;
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

    if (res && isUserTransactionResponse(res)) {
      // Parse the events from the transaction.
      const events = getEvents(res);
      if (events.marketRegistrationEvents.length === 1) {
        // The market registration was successful.
        // Add the market to the registered markets in state.
        const event = events.marketRegistrationEvents[0];
        const emojiData = symbolToEmojis(emojis);
        const marketID = event.marketID.toString();
        const market: RegisteredMarket = {
          marketID,
          symbolBytes: `0x${emojiData.emojis.map((e) => e.hex.slice(2)).join("")}`,
          marketAddress: AccountAddress.from(event.marketMetadata.marketAddress).toString(),
          ...emojiData,
        };
        addRegisteredMarket(market);
      }
    } else {
      console.error("Error registering market:", error);
    }
  };

  return registerMarket;
};
