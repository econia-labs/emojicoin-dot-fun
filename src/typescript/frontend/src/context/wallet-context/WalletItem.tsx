import {
  type Wallet,
  WalletReadyState,
  type AptosStandardSupportedWallet,
  useWallet,
} from "@aptos-labs/wallet-adapter-react";
import { type MouseEventHandler, type ReactElement, useEffect, useState, useCallback } from "react";
import MartianIcon from "@icons/MartianIcon";
import PetraIcon from "@icons/PetraIcon";
import PontemIcon from "@icons/PontemIcon";
import RiseIcon from "@icons/RiseIcon";
import NightlyIcon from "@icons/NightlyIcon";
import { Arrow } from "components/svg";
import { useScramble } from "use-scramble";

export const WALLET_ICON: { [key: string]: ReactElement } = {
  petra: <PetraIcon />,
  pontem: <PontemIcon />,
  martian: <MartianIcon />,
  rise: <RiseIcon />,
  nightly: <NightlyIcon />,
};

export const walletSort = (
  a: Wallet | AptosStandardSupportedWallet,
  b: Wallet | AptosStandardSupportedWallet
) => {
  const keys = Object.keys(WALLET_ICON);
  return keys.indexOf(a.name.toLowerCase()) - keys.indexOf(b.name.toLowerCase());
};

export const isSupportedWallet = (s: string) => {
  return Object.keys(WALLET_ICON).includes(s.toLowerCase());
};

const WalletNameClassName =
  "group-hover:text-white ml-4 font-pixelar text-[20px] text-black uppercase flex";
const ArrowDivClassName = "arrow-wrapper absolute right-0 p-[7px] transition-all text-black";

type ScrambledProps = {
  text: string;
  active: boolean;
  hover: boolean;
};

const ScrambledRow: React.FC<ScrambledProps> = ({ text, active, hover }) => {
  const [enabled, setEnabled] = useState(false);

  const display = ({ text, active, hover }: ScrambledProps) => {
    if (active) {
      return hover ? "Disconnect" : `${text} Wallet`;
    }
    return hover ? "Connect" : `${text} Wallet`;
  };

  const { ref, replay } = useScramble({
    text: display({ text, active, hover }),
    overdrive: true,
    overflow: true,
    speed: 0.7,
    onAnimationStart: () => setEnabled(false),
    onAnimationEnd: () => setEnabled(true),
  });

  const handleReplay = useCallback(() => {
    if (enabled) {
      replay();
    }
  }, [enabled, replay]);

  useEffect(() => {
    if (hover) {
      handleReplay();
    }
  }, [hover]); /* eslint-disable-line react-hooks/exhaustive-deps */

  return <p className={active && hover ? "text-lighter-gray" : ""} ref={ref} />;
};

export const WalletItem: React.FC<{
  wallet: Wallet | AptosStandardSupportedWallet;
  className?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}> = ({ wallet, className, onClick }) => {
  const [hover, setHover] = useState<boolean>(false);
  const { wallet: current } = useWallet();

  const inner = (
    <>
      {WALLET_ICON[wallet.name.toLowerCase()]}
      <div className={WalletNameClassName}>
        <div>
          {wallet.readyState === WalletReadyState.NotDetected ? (
            `Install ${wallet.name} Wallet`
          ) : (
            <ScrambledRow active={wallet.name === current?.name} text={wallet.name} hover={hover} />
          )}
        </div>
      </div>
      <div className={ArrowDivClassName}>
        {wallet.name === current?.name ? (
          <div className="group-hover:text-white">
            <p className="absolute bottom-[-2px] right-[6px] inline-flex group-hover:hidden animate-flicker drop-shadow-text">
              {"⚡"}
            </p>
            <p className="absolute bottom-[-2px] right-[8px] hidden group-hover:inline-flex scale-[0.75]">
              {"❌"}
            </p>
          </div>
        ) : (
          <Arrow className="fill-black group-hover:fill-white" />
        )}
      </div>
    </>
  );

  return (
    <div>
      {wallet.readyState === WalletReadyState.NotDetected ? (
        <a
          href={wallet.url}
          className={className}
          target="_blank"
          rel="noreferrer"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        >
          {inner}
        </a>
      ) : (
        <button
          className={className}
          onClick={onClick}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        >
          {inner}
        </button>
      )}
    </div>
  );
};
