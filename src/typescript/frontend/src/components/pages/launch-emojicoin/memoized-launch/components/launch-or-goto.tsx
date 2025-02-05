import { useEmojiPicker } from "context/emoji-picker-context";
import Button from "components/button";
import ButtonWithConnectWalletFallback from "components/header/wallet-button/ConnectWalletButton";
import { translationFunction } from "context/language-context";
import Link from "next/link";
import path from "path";
import { ROUTES } from "router/routes";
import { useMemo } from "react";

export const LaunchButtonOrGoToMarketLink = ({
  onWalletButtonClick,
  registered,
  invalid,
  insufficientBalance,
}: {
  onWalletButtonClick: () => void;
  registered?: boolean;
  invalid: boolean;
  insufficientBalance: boolean;
}) => {
  const emojis = useEmojiPicker((state) => state.emojis);
  const { t } = translationFunction();

  const scrambleProps = {
    overdrive: true,
    overflow: true,
  };

  const disableRegister = useMemo(
    () => invalid || insufficientBalance || typeof registered === "undefined",
    [invalid, insufficientBalance, registered]
  );

  return (
    <>
      {/* Force displaying the "Go to emojicoin market" link if the market is already registered,
          regardless of whether or not the user is connected. */}
      <ButtonWithConnectWalletFallback forceDisplayChildren={registered}>
        {registered ? (
          <Link
            className="font-pixelar text-lg uppercase text-ec-blue"
            href={path.join(ROUTES.market, emojis.join(""))}
          >
            <Button scale="lg" scrambleProps={scrambleProps}>
              {t("Go to emojicoin market")}
            </Button>
          </Link>
        ) : (
          <Button
            disabled={disableRegister}
            onClick={onWalletButtonClick}
            scale="lg"
            style={{ cursor: disableRegister ? "not-allowed" : "pointer" }}
            scrambleProps={scrambleProps}
          >
            {t(
              insufficientBalance
                ? "Insufficient balance"
                : invalid
                  ? "Invalid input"
                  : "Launch Emojicoin"
            )}
          </Button>
        )}
      </ButtonWithConnectWalletFallback>
    </>
  );
};

export default LaunchButtonOrGoToMarketLink;
