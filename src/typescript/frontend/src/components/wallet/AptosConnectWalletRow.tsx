import type { AdapterNotDetectedWallet, AdapterWallet } from "@aptos-labs/wallet-adapter-react";
import { WalletItem } from "@aptos-labs/wallet-adapter-react";
import { type MouseEventHandler, useCallback, useEffect, useState } from "react";
import { useScramble } from "use-scramble";

interface WalletRowProps {
  wallet: AdapterWallet | AdapterNotDetectedWallet;
  onConnect?: () => void;
  onClick?: MouseEventHandler<HTMLElement>;
}

export function AptosConnectWalletRow({ wallet, onConnect, onClick }: WalletRowProps) {
  const [enabled, setEnabled] = useState(false);
  const [hover, setHover] = useState<boolean>(false);

  const { ref, replay } = useScramble({
    text: wallet.name,
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

  return (
    <div onMouseOver={() => setHover(true)} onMouseLeave={() => setHover(false)} onClick={onClick}>
      <WalletItem
        wallet={wallet}
        onConnect={onConnect}
        className="group mb-[5px] border-2 border-dotted border-black hover:cursor-pointer"
      >
        <WalletItem.ConnectButton asChild>
          <div className={"flex h-[50px] w-full gap-4 " + " group-hover:bg-[#0000000E]"}>
            <div className="m-auto flex flex-row">
              <WalletItem.Icon className="m-auto mr-[1.5ch] h-5 w-5 drop-shadow-text" />
              <WalletItem.Name className="font-pixelar text-xl uppercase text-black" ref={ref} />
            </div>
          </div>
        </WalletItem.ConnectButton>
      </WalletItem>
    </div>
  );
}
