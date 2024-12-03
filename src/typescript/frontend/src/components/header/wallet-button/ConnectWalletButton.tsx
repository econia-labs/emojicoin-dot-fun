import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Button } from "@headlessui/react";
import { formatDisplayName } from "@sdk/utils/misc";
import { translationFunction } from "context/language-context";
import { useWalletModal } from "context/wallet-context/WalletModalContext";
import { useMemo, useState, type PropsWithChildren } from "react";
import { useScramble } from "use-scramble";
import OuterConnectText from "./OuterConnectText";
import Arrow from "@icons/Arrow";
import Popup from "components/popup";
import useIsUserGeoblocked from "@hooks/use-is-user-geoblocked";
import { useAptos } from "context/wallet-context/AptosContextProvider";

export interface ConnectWalletProps extends PropsWithChildren<{ className?: string }> {
  mobile?: boolean;
  onClick?: () => void;
  arrow?: boolean;
  forceAllowConnect?: boolean;
}

const CONNECT_WALLET = "Connect Wallet";

export const ButtonWithConnectWalletFallback = ({
  mobile,
  children,
  className,
  onClick,
  arrow = false,
  forceAllowConnect,
}: ConnectWalletProps) => {
  const { connected } = useWallet();
  const { openWalletModal } = useWalletModal();
  const { t } = translationFunction();
  const shouldBeGeoblocked = useIsUserGeoblocked();
  const geoblocked = useMemo(() => {
    // For letting the user connect on the `/verify_status` page when `forceAllowConnect` is `true`,
    // by only returning `geoblocked = true` if we're not force allow connecting and they're
    // geoblocked.
    return !forceAllowConnect && shouldBeGeoblocked;
  }, [forceAllowConnect, shouldBeGeoblocked]);

  const [enabled, setEnabled] = useState(false);
  const { addressName } = useAptos();

  const text = useMemo(() => {
    if (!geoblocked && connected) {
      if (addressName) {
        return formatDisplayName(addressName);
      } else {
        return t("Connected");
      }
    }
    return t(CONNECT_WALLET);
  }, [connected, addressName, t, geoblocked]);

  const width = useMemo(() => {
    return `${text.length + 1}ch`;
  }, [text]);

  const { ref, replay } = useScramble({
    text: text.startsWith("0x") ? `0x${text.slice(2).toUpperCase()}` : text.toUpperCase(),
    overdrive: false,
    speed: 0.5,
    ignore: [" "],
    playOnMount: mobile,
    onAnimationStart: () => setEnabled(false),
    onAnimationEnd: () => setEnabled(true),
  });

  const handleReplay = () => {
    if (enabled) {
      replay();
    }
  };

  // This component is used to display the `Connect Wallet` button and text with a scramble effect.
  // We use it in both mobile and desktop components.
  const inner =
    !connected || !children || geoblocked ? (
      <Button
        className={
          className + (mobile ? " px-[9px] border-dashed border-b border-b-dark-gray" : "")
        }
        disabled={geoblocked}
        onClick={(e) => {
          e.preventDefault();
          (onClick ?? openWalletModal)();
          handleReplay();
        }}
        onMouseOver={handleReplay}
      >
        <div
          className={`flex flex-row text-${geoblocked ? "dark-gray" : "ec-blue"} text-2xl justify-between`}
        >
          <div className="flex flex-row">
            <OuterConnectText
              geoblocked={geoblocked}
              side="left"
              connected={connected}
              mobile={mobile}
            />
            <div className={!mobile ? "" : "text-black text-[32px] leading-[40px]"}>
              <span
                className="whitespace-nowrap text-overflow-ellipsis overflow-hidden"
                style={{ width, maxWidth: width }}
                ref={ref}
              />
            </div>
            <OuterConnectText
              geoblocked={geoblocked}
              side="right"
              connected={connected}
              mobile={mobile}
            />
          </div>
          {arrow && <Arrow width={18} className="fill-black" />}
        </div>
      </Button>
    ) : (
      children
    );

  return geoblocked ? <Popup content="not available in your jurisdiction">{inner}</Popup> : inner;
};

export default ButtonWithConnectWalletFallback;
