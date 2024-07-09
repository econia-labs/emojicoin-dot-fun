import { WalletItem, type AnyAptosWallet } from "@aptos-labs/wallet-adapter-react";
import { useState, useCallback, useEffect, type MouseEventHandler } from "react";
import { useScramble } from "use-scramble";

interface WalletRowProps {
  wallet: AnyAptosWallet;
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
        className="group hover:cursor-pointer border-dotted border-black border-2 mb-[5px]"
      >
        <WalletItem.ConnectButton asChild>
          <div className={"flex w-full gap-4 h-[50px] " + " group-hover:bg-[#0000000E]"}>
            <div className="flex flex-row m-auto">
              <WalletItem.Icon className="h-5 w-5 m-auto mr-[1.5ch] drop-shadow-text" />
              <WalletItem.Name className="font-pixelar uppercase text-xl" ref={ref} />
            </div>
          </div>
        </WalletItem.ConnectButton>
      </WalletItem>
    </div>
  );
}
