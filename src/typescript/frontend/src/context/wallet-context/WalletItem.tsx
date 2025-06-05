// cspell:word bitget
// cspell:word pontem
import type { AdapterNotDetectedWallet, AdapterWallet } from "@aptos-labs/wallet-adapter-react";
import { useWallet, WalletReadyState } from "@aptos-labs/wallet-adapter-react";
import { Arrow } from "components/svg";
import { type MouseEventHandler, type ReactElement, useCallback, useEffect, useState } from "react";
import { useScramble } from "use-scramble";
import { emoji } from "utils";
import { Emoji } from "utils/emoji";

import BitgetIcon from "@/icons/BitgetIcon";
import MartianIcon from "@/icons/MartianIcon";
import NightlyIcon from "@/icons/NightlyIcon";
import OKXIcon from "@/icons/OKXIcon";
import PetraIcon from "@/icons/PetraIcon";
import PontemIcon from "@/icons/PontemIcon";
import RiseIcon from "@/icons/RiseIcon";

const IconProps = {
  width: 28,
  height: 28,
  className: "m-auto",
};

const WALLET_ICON: { [key: string]: ReactElement } = {
  "okx wallet": <OKXIcon {...IconProps} />,
  petra: <PetraIcon {...IconProps} />,
  "bitget wallet": <BitgetIcon {...IconProps} />,
  nightly: <NightlyIcon {...IconProps} className="text-ec-blue" />,
  pontem: <PontemIcon {...IconProps} />,
  martian: <MartianIcon {...IconProps} />,
  rise: <RiseIcon {...IconProps} />,
};

export const walletSort = (
  a: AdapterWallet | AdapterNotDetectedWallet,
  b: AdapterWallet | AdapterNotDetectedWallet
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
  wallet: AdapterWallet | AdapterNotDetectedWallet;
  className?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}) => {
  const [hover, setHover] = useState<boolean>(false);
  const { wallet: current } = useWallet();

  const inner = (
    <>
      <div className="flex h-[28px] w-[28px] rounded-[4px] text-black">
        {WALLET_ICON[wallet.name.toLowerCase()]}
      </div>
      <div className={WalletNameClassName}>
        <div>
          <ScrambledRow
            active={wallet.name === current?.name}
            text={wallet.name}
            installed={wallet.readyState === WalletReadyState.Installed}
            hover={hover}
          />
        </div>
      </div>
      <div className={ArrowDivClassName}>
        {wallet.name === current?.name ? (
          <>
            <Emoji
              className="absolute bottom-[-2px] right-[5px] mr-[1ch] inline-flex animate-flicker drop-shadow-text group-hover:hidden"
              emojis={emoji("high voltage")}
            />
            <Emoji
              className="absolute bottom-[-2px] right-[6px] mr-[1ch] hidden scale-[0.75] group-hover:inline-flex"
              emojis={emoji("cross mark")}
            />
          </>
        ) : (
          <Arrow width={16} height={19} className="mr-[1ch] fill-black" />
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
