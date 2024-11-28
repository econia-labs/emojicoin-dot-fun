// cspell:word pontem
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
import OKXIcon from "@icons/OKXIcon";
import { Arrow } from "components/svg";
import { useScramble } from "use-scramble";
import { Emoji } from "utils/emoji";
import { emoji } from "utils";

const IconProps = {
  width: 28,
  height: 28,
  className: "m-auto",
};

export const WALLET_ICON: { [key: string]: ReactElement } = {
  "okx wallet": <OKXIcon {...IconProps} />,
  petra: <PetraIcon {...IconProps} />,
  nightly: <NightlyIcon {...IconProps} className="text-ec-blue" />,
  pontem: <PontemIcon {...IconProps} />,
  martian: <MartianIcon {...IconProps} />,
  rise: <RiseIcon {...IconProps} />,
};

export const walletSort = (
  a: Wallet | AptosStandardSupportedWallet,
  b: Wallet | AptosStandardSupportedWallet
) => {
  const keys = Object.keys(WALLET_ICON);
  return keys.indexOf(a.name.toLowerCase()) - keys.indexOf(b.name.toLowerCase());
};

export const isSupportedWallet = (s: string) => {
  return Object.keys(WALLET_ICON)
    .map((w) => w.toLowerCase())
    .includes(s.toLowerCase());
};

const WalletNameClassName = "ml-4 font-pixelar text-[20px] text-black uppercase flex";
const ArrowDivClassName = "arrow-wrapper absolute right-0 p-[7px] transition-all text-black";

type ScrambledProps = {
  text: string;
  active: boolean;
  hover: boolean;
  installed: boolean;
};

const ScrambledRow: React.FC<ScrambledProps> = ({ text, active, hover, installed }) => {
  const [enabled, setEnabled] = useState(false);

  const display = ({ text, active, hover, installed }: ScrambledProps) => {
    if (!installed) {
      return `Install ${text}`;
    }
    if (active) {
      return hover ? `Disconnect from ${text}` : `${text}`;
    }
    return hover ? `Connect to ${text}` : `${text}`;
  };

  const { ref, replay } = useScramble({
    text: display({ text, active, hover, installed }),
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

  return <p ref={ref} />;
};

export const WalletItem = ({
  wallet,
  className,
  onClick,
}: {
  wallet: Wallet | AptosStandardSupportedWallet;
  className?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}) => {
  const [hover, setHover] = useState<boolean>(false);
  const { wallet: current } = useWallet();

  const inner = (
    <>
      <div className="flex text-black rounded-[4px] w-[28px] h-[28px]">
        {WALLET_ICON[wallet.name.toLowerCase()]}
      </div>
      <div className={WalletNameClassName}>
        <div>
          <ScrambledRow
            active={wallet.name === current?.name}
            text={wallet.name}
            installed={
              wallet.readyState === WalletReadyState.Installed ||
              wallet.readyState === WalletReadyState.Loadable
            }
            hover={hover}
          />
        </div>
      </div>
      <div className={ArrowDivClassName}>
        {wallet.name === current?.name ? (
          <>
            <Emoji
              className="absolute bottom-[-2px] right-[5px] mr-[1ch] inline-flex group-hover:hidden animate-flicker drop-shadow-text"
              emojis={emoji("high voltage")}
            />
            <Emoji
              className="absolute bottom-[-2px] right-[6px] mr-[1ch] hidden group-hover:inline-flex scale-[0.75]"
              emojis={emoji("cross mark")}
            />
          </>
        ) : (
          <Arrow width={16} height={19} className="fill-black mr-[1ch]" />
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
