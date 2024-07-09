import useInputStore from "@store/input-store";
import Button from "components/button";
import ButtonWithConnectWalletFallback from "components/header/wallet-button/ConnectWalletButton";
import { translationFunction } from "context/language-context";
import Link from "next/link";
import path from "path";
import { ROUTES } from "router/routes";

export const LaunchButtonOrGoToMarketLink = ({
  onWalletButtonClick,
  registered = false,
  invalid,
}: {
  onWalletButtonClick: () => void;
  registered?: boolean;
  invalid: boolean;
}) => {
  const emojis = useInputStore((state) => state.emojis);
  const { t } = translationFunction();

  return (
    <>
      <ButtonWithConnectWalletFallback>
        {registered ? (
          <Link
            className="font-pixelar text-lg uppercase text-ec-blue"
            href={path.join(ROUTES.market, emojis.join(""))}
          >
            <Button scale="lg">{t("Go to emojicoin market")}</Button>
          </Link>
        ) : (
          <Button
            disabled={invalid}
            onClick={onWalletButtonClick}
            scale="lg"
            style={{ cursor: invalid ? "not-allowed" : "pointer" }}
          >
            {t("Launch Emojicoin")}
          </Button>
        )}
      </ButtonWithConnectWalletFallback>
    </>
  );
};

export default LaunchButtonOrGoToMarketLink;
