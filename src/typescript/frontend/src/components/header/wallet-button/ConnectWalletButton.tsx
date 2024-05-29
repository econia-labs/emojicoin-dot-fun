import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Button } from "@headlessui/react";
import { truncateAddress } from "@sdk/utils/misc";
import { translationFunction } from "context/language-context";
import { useConnectWallet } from "context/wallet-context/ConnectWalletContext";
import { useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { useScramble } from "use-scramble";

export interface ConnectWalletProps extends PropsWithChildren<{ className?: string }> {
  mobile?: boolean;
}

const DEFAULT_TEXT = "Connect Wallet";

export const ButtonWithConnectWalletFallback: React.FC<ConnectWalletProps> = ({
  mobile,
  children,
  className,
}) => {
  const { connected, account } = useWallet();
  const { connectWallet } = useConnectWallet();
  const { t } = translationFunction();

  const [enabled, setEnabled] = useState(false);
  const [width, setWidth] = useState(`${DEFAULT_TEXT.length}ch`);

  const text = useMemo(() => {
    let str = DEFAULT_TEXT;
    if (connected) {
      if (account) {
        str = truncateAddress(account.address);
      } else {
        str = t("Connected");
      }
    } else {
      str = t("Connect Wallet");
    }
    return str;
  }, [connected, account, t]);

  useEffect(() => {
    setWidth(`${text.length}ch`);
  }, [text]);

  const { ref, replay } = useScramble({
    text,
    overdrive: false,
    overflow: false,
    speed: 0.6,
    onAnimationStart: () => setEnabled(false),
    onAnimationEnd: () => setEnabled(true),
  });

  const handleReplay = () => {
    if (enabled) {
      replay();
    }
  };

  if (mobile) {
    // do something;
  }

  return (
    <>
      {!connected || !children ? (
        <Button
          className={className}
          onClick={(e) => {
            e.preventDefault();
            connectWallet();
            handleReplay();
          }}
          onMouseOver={handleReplay}
        >
          <div className="flex flex-row text-ec-blue text-2xl">
            {connected ? (
              <p className="text-base flex mt-1.5 animate-flicker drop-shadow-voltage">{"⚡"}</p>
            ) : (
              <div className="pr-[1ch]">{"{"}</div>
            )}
            <p
              className="uppercase whitespace-nowrap text-overflow-ellipsis overflow-hidden"
              style={{ width, maxWidth: width }}
              ref={ref}
            />
            {connected ? (
              <p className="text-base flex mt-1.5 animate-flicker drop-shadow-voltage">{"⚡"}</p>
            ) : (
              <div className="pl-[1ch]">{"}"}</div>
            )}
          </div>
        </Button>
      ) : (
        children
      )}
    </>
  );
};

export default ButtonWithConnectWalletFallback;
