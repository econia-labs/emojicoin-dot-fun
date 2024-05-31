import ButtonWithConnectWalletFallback from "components/header/wallet-button/ConnectWalletButton";
import Button from "components/button";
import { translationFunction } from "context/language-context";
import { RegisterMarket, RegistryView } from "@sdk/emojicoin_dot_fun/emojicoin-dot-fun";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import {
  type PendingTransactionResponse,
  type UserTransactionResponse,
  type HexInput,
} from "@aptos-labs/ts-sdk";
import { INTEGRATOR_ADDRESS } from "lib/env";
import { DEFAULT_REGISTER_MARKET_GAS_OPTIONS } from "@sdk/const";
import { toRegistryView } from "@sdk/types";

export const LaunchEmojicoinButton = ({ emojis }: { emojis: Array<HexInput> }) => {
  const { t } = translationFunction();
  const { aptos, account, submit, signThenSubmit } = useAptos();

  const handleClick = async () => {
    if (!account) {
      return;
    }
    let _res: PendingTransactionResponse | UserTransactionResponse | null = null;
    let _txFlowError: unknown;
    const builderArgs = {
      aptosConfig: aptos.config,
      registrant: account.address,
      emojis,
      integrator: INTEGRATOR_ADDRESS,
    };
    try {
      const builderLambda = () => RegisterMarket.builder(builderArgs);
      await submit(builderLambda).then((r) => {
        _res = r?.response ?? null;
        _txFlowError = r?.error;
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
          _res = r?.response ?? null;
          _txFlowError = r?.error;
        });
      }
    }
  };

  return (
    <ButtonWithConnectWalletFallback>
      <Button onClick={handleClick} scale="lg">
        {t("Launch Emojicoin")}
      </Button>
    </ButtonWithConnectWalletFallback>
  );
};
