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
}: {
  onWalletButtonClick: () => void;
  registered?: boolean;
  invalid: boolean;
}) => {
  const emojis = useEmojiPicker((state) => state.emojis);
  const { t } = translationFunction();

  const scrambleProps = {
    overdrive: true,
    overflow: true,
  };

  return (
    <>
      <ButtonWithConnectWalletFallback>
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
            disabled={invalid || typeof registered === "undefined"}
            onClick={onWalletButtonClick}
            scale="lg"
            style={{ cursor: invalid ? "not-allowed" : "pointer" }}
            scrambleProps={scrambleProps}
          >
            {t("Launch Emojicoin")}
          </Button>
        )}
      </ButtonWithConnectWalletFallback>
    </>
  );
};

export default LaunchButtonOrGoToMarketLink;
