import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Button } from "@headlessui/react";
import { formatDisplayName } from "@sdk/utils/misc";
import { translationFunction } from "context/language-context";
import { useWalletModal } from "context/wallet-context/WalletModalContext";
import { useMemo, useState, type PropsWithChildren } from "react";
import { useScramble } from "use-scramble";
import OuterConnectText from "./OuterConnectText";
import Arrow from "@icons/Arrow";
import { useNameStore } from "context/state-store-context";
import Popup from "components/popup";
import Text from "components/text";

export interface ConnectWalletProps extends PropsWithChildren<{ className?: string }> {
  mobile?: boolean;
  onClick?: () => void;
  geoblocked: boolean;
}

const CONNECT_WALLET = "Connect Wallet";

export const ButtonWithConnectWalletFallback: React.FC<ConnectWalletProps> = ({
  mobile,
  children,
  className,
  onClick,
  geoblocked,
}) => {
  const { connected, account } = useWallet();
  const { openWalletModal } = useWalletModal();
  const { t } = translationFunction();

  const [enabled, setEnabled] = useState(false);

  const nameResolver = useNameStore((s) =>
    s.getResolverWithNames(account?.address ? [account.address] : [])
  );

  const text = useMemo(() => {
    if (!geoblocked && connected) {
      if (account) {
        return formatDisplayName(nameResolver(account.address));
      } else {
        return t("Connected");
      }
    }
    return t(CONNECT_WALLET);
  }, [connected, account, t, nameResolver, geoblocked]);

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
          <Arrow width={18} className="fill-black" />
        </div>
      </Button>
    ) : (
      children
    );

  return geoblocked ? (
    <Popup
      content={
        <Text textTransform="uppercase" color="black">
          not available in your jurisdiction
        </Text>
      }
    >
      {inner}
    </Popup>
  ) : (
    inner
  );
};

export default ButtonWithConnectWalletFallback;
