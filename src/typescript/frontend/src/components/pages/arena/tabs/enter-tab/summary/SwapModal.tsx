import { GlowingEmoji } from "utils/emoji";

import Button from "@/components/button";
import ButtonWithConnectWalletFallback from "@/components/header/wallet-button/ConnectWalletButton";
import AnimatedLoadingBoxes from "@/components/pages/launch-emojicoin/animated-loading-boxes";
import { useCurrentMeleeInfo } from "@/hooks/use-current-melee-info";
import type { UserEscrow } from "@/sdk/utils/arena/escrow";

import { ifEscrowTernary } from "../../../utils";
import BlurModal from "../BlurModal";
import { EscrowAptValue } from "./utils";

/**
 * The Arena swap modal, not for the regular emojicoin dot fun package.
 */
export default function SwapModal({
  escrow,
  loading,
  onSwap,
  setIsSwapping,
}: {
  escrow: UserEscrow & { currentSymbol: string };
  loading: boolean;
  onSwap: () => void;
  setIsSwapping: (value: boolean) => void;
}) {
  const { market0, market1, symbol0, symbol1 } = useCurrentMeleeInfo();

  return (
    <BlurModal close={() => setIsSwapping(false)}>
      <div className="flex flex-col justify-between items-center h-[100%] py-[3em]">
        {symbol0 && symbol1 ? (
          <GlowingEmoji
            className="text-6xl mt-[1em]"
            emojis={ifEscrowTernary(escrow, symbol1, symbol0)}
          />
        ) : (
          <AnimatedLoadingBoxes numSquares={4} />
        )}
        <div className="flex flex-col justify-between items-center gap-[.5em]">
          <div className="text-light-gray uppercase text-2xl tracking-widest">Swap holdings</div>
          <EscrowAptValue escrow={escrow} market0={market0} market1={market1} loading={loading} />
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
