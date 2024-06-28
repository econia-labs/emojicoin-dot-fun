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
import { STRUCT_STRINGS } from "@sdk/utils";

const getMarketIdFromResponse = (
  response: PendingTransactionResponse | UserTransactionResponse | null | undefined
) => {
  if (response && Object.keys(response).includes("events")) {
    const marketIdStr = (response as UserTransactionResponse).events.filter(
      (e) => e.type === STRUCT_STRINGS.MarketRegistrationEvent
    )[0].data["market_metadata"]["market_id"];
    return Number(marketIdStr);
  } else {
    return undefined;
  }
};

export const LaunchEmojicoinButton = ({
  emojis,
  marketID,
  onCreate,
  disabled,
}: {
  emojis: Array<HexInput>;
  marketID: number | undefined;
  onCreate?: (marketID: number) => void;
  disabled: boolean;
}) => {
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
      await submit(builderLambda)
        .then((r) => {
          _res = r?.response ?? null;
          _txFlowError = r?.error;
          return getMarketIdFromResponse(r?.response);
        })
        .then((r) => {
          if (r && onCreate) {
            onCreate(r);
          }
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
        await signThenSubmit(builderLambda)
          .then((r) => {
            _res = r?.response ?? null;
            _txFlowError = r?.error;
            return getMarketIdFromResponse(r?.response);
          })
          .then((r) => {
            if (r && onCreate) {
              onCreate(r);
            }
          });
      }
    }
  };

  return marketID !== undefined ? (
    <a href={`/market/${marketID}`}>
      <Button>Go to registered emojicoin</Button>
    </a>
  ) : (
    <ButtonWithConnectWalletFallback>
      <Button onClick={handleClick} disabled={disabled} scale="lg">
        {t("Launch Emojicoin")}
      </Button>
    </ButtonWithConnectWalletFallback>
  );
};
