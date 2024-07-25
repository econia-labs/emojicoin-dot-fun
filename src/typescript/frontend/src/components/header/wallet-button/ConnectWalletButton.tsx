import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Button } from "@headlessui/react";
import { truncateAddress, truncateANSName } from "@sdk/utils/misc";
import { translationFunction } from "context/language-context";
import { useWalletModal } from "context/wallet-context/WalletModalContext";
import { useMemo, useState, type PropsWithChildren } from "react";
import { useScramble } from "use-scramble";
import OuterConnectText from "./OuterConnectText";
import Arrow from "@icons/Arrow";

export interface ConnectWalletProps extends PropsWithChildren<{ className?: string }> {
  mobile?: boolean;
  onClick?: () => void;
}

const CONNECT_WALLET = "Connect Wallet";

export const ButtonWithConnectWalletFallback: React.FC<ConnectWalletProps> = ({
  mobile,
  children,
  className,
  onClick,
}) => {
  const { connected, account } = useWallet();
  const { openWalletModal } = useWalletModal();
  const { t } = translationFunction();

  const [enabled, setEnabled] = useState(false);

  const text = useMemo(() => {
    if (connected) {
      if (account) {
        if (account.ansName) {
          return truncateANSName(account.ansName);
        }
        // If there's no button text provided, we just show the truncated address.
        // Keep in mind this only shows if no children are passed to the component.
        return truncateAddress(account.address);
      } else {
        return t("Connected");
      }
    }
    return t(CONNECT_WALLET);
  }, [connected, account, t]);

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
  return (
    <>
      {!connected || !children ? (
        <Button
          className={
            className + (mobile ? " px-[9px] border-dashed border-b border-b-dark-gray" : "")
          }
          onClick={(e) => {
            e.preventDefault();
            onClick ? onClick() : openWalletModal();
            handleReplay();
          }}
          onMouseOver={handleReplay}
        >
          <div className="flex flex-row text-ec-blue text-2xl justify-between">
            <div className="flex flex-row">
              <OuterConnectText side="left" connected={connected} mobile={mobile} />
              <div className={!mobile ? "" : "text-black text-[32px] leading-[40px]"}>
                <span
                  className="whitespace-nowrap text-overflow-ellipsis overflow-hidden"
                  style={{ width, maxWidth: width }}
                  ref={ref}
                />
              </div>
              <OuterConnectText side="right" connected={connected} mobile={mobile} />
            </div>
            <Arrow width={18} className="fill-black" />
          </div>
        </Button>
      ) : (
        children
      )}
    </>
  );
};

export default ButtonWithConnectWalletFallback;
