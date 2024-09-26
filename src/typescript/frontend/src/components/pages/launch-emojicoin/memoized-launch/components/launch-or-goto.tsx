import { useEmojiPicker } from "context/emoji-picker-context";
import Button from "components/button";
import ButtonWithConnectWalletFallback from "components/header/wallet-button/ConnectWalletButton";
import { translationFunction } from "context/language-context";
import Link from "next/link";
import path from "path";
import { ROUTES } from "router/routes";

export const LaunchButtonOrGoToMarketLink = ({
  onWalletButtonClick,
  registered,
  invalid,
  insufficientBalance,
  geoblocked,
}: {
  onWalletButtonClick: () => void;
  registered?: boolean;
  invalid: boolean;
  insufficientBalance: boolean;
  geoblocked: boolean;
}) => {
  const emojis = useEmojiPicker((state) => state.emojis);
  const { t } = translationFunction();

  const scrambleProps = {
    overdrive: true,
    overflow: true,
  };

  return (
    <>
      <ButtonWithConnectWalletFallback geoblocked={geoblocked}>
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
            disabled={insufficientBalance || invalid || typeof registered === "undefined"}
            onClick={onWalletButtonClick}
            scale="lg"
            style={{ cursor: invalid ? "not-allowed" : "pointer" }}
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
