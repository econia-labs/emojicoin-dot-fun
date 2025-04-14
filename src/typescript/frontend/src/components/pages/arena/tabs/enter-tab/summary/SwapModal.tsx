import type { CurrentUserPosition } from "lib/hooks/positions/use-current-position";
import { GlowingEmoji } from "utils/emoji";

import Button from "@/components/button";
import ButtonWithConnectWalletFallback from "@/components/header/wallet-button/ConnectWalletButton";
import { useCurrentMeleeInfo } from "@/hooks/use-current-melee-info";

import { marketTernary } from "../../../utils";
import { AnimatedLoadingBoxesWithFallback } from "../../utils";
import BlurModal from "../BlurModal";
import { EscrowAptValue } from "./utils";

/**
 * The Arena swap modal, not for the regular emojicoin dot fun package.
 */
export default function SwapModal({
  position,
  loading,
  onSwap,
  setIsSwapping,
}: {
  position: CurrentUserPosition;
  loading: boolean;
  onSwap: () => void;
  setIsSwapping: (value: boolean) => void;
}) {
  const { market0, market1, symbol0, symbol1 } = useCurrentMeleeInfo();

  return (
    <BlurModal close={() => setIsSwapping(false)}>
      <div className="flex flex-col justify-between items-center h-[100%] py-[3em] mt-[1em]">
        {symbol0 && symbol1 ? (
          <GlowingEmoji className="text-6xl" emojis={marketTernary(position, symbol1, symbol0)} />
        ) : (
          <AnimatedLoadingBoxesWithFallback fallback={<></>} numSquares={4} />
        )}
        <div className="flex flex-col justify-between items-center gap-[.5em]">
          <div className="text-light-gray uppercase text-2xl tracking-widest">Swap holdings</div>
          <EscrowAptValue
            position={position}
            market0={market0}
            market1={market1}
            loading={loading}
          />
        </div>
        <ButtonWithConnectWalletFallback>
          <Button scale="lg" onClick={onSwap}>
            Swap
          </Button>
        </ButtonWithConnectWalletFallback>
      </div>
    </BlurModal>
  );
}
