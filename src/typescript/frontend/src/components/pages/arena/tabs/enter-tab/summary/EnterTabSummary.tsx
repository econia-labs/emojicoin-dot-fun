import { useAptos } from "context/wallet-context/AptosContextProvider";
import { useCurrentPositionQuery } from "lib/hooks/queries/arena/use-current-position";
import { useArenaSwapTransactionBuilder } from "lib/hooks/transaction-builders/use-arena-swap-builder";
import { useExitTransactionBuilder } from "lib/hooks/transaction-builders/use-exit-builder";
import { useCallback, useState } from "react";

import { useCurrentMeleeInfo } from "@/hooks/use-current-melee-info";
import type { UserEscrow } from "@/sdk/index";

import Summary from "./Summary";
import SwapModal from "./SwapModal";
import TapOutModal from "./TapOutModal";

export default function EnterTabSummary({
  escrow,
  topOff,
  tapOut,
  swap,
}: {
  // Use the escrow value for things like which side the user is on and their current escrowed balance.
  escrow: UserEscrow & { currentSymbol: string };
  topOff: () => void;
  tapOut: () => void;
  swap: () => void;
}) {
  // Use the current position info for indexed data that can't be derived from on-chain data.
  const { position, isLoading, isFetching } = useCurrentPositionQuery();
  const [isTappingOut, setIsTappingOut] = useState<boolean>(false);
  const [isSwapping, setIsSwapping] = useState<boolean>(false);
  const { account, submit } = useAptos();
  const { market0, market1 } = useCurrentMeleeInfo();

  const swapTransactionBuilder = useArenaSwapTransactionBuilder(
    market0?.market.marketAddress,
    market1?.market.marketAddress
  );
  const exitTransactionBuilder = useExitTransactionBuilder(
    market0?.market.marketAddress,
    market1?.market.marketAddress
  );

  const onTapOut = useCallback(() => {
    if (!account) return;
    submit(exitTransactionBuilder).then((r) => {
      if (!r || r?.error) {
        console.error("Could not exit", { error: r?.error });
      } else {
        tapOut();
      }
    });
  }, [account, exitTransactionBuilder, tapOut, submit]);

  const onSwap = useCallback(() => {
    if (!account) return;
    submit(swapTransactionBuilder).then((r) => {
      if (!r || r?.error) {
        console.error("Could not swap", { error: r?.error });
      } else {
        swap();
        setIsSwapping(false);
      }
    });
  }, [account, swapTransactionBuilder, swap, submit]);

  return (
    <div className="relative h-[100%]">
      {isTappingOut && (
        <TapOutModal position={position} onTapOut={onTapOut} setIsTappingOut={setIsTappingOut} />
      )}
      {isSwapping && (
        <SwapModal
          escrow={escrow}
          onSwap={onSwap}
          setIsSwapping={setIsSwapping}
          loading={isLoading || isFetching}
        />
      )}
      <Summary
        escrow={escrow}
        loading={isLoading || isFetching}
        onTapOut={onTapOut}
        setIsTappingOut={setIsTappingOut}
        setIsSwapping={setIsSwapping}
        topOff={topOff}
      />
    </div>
  );
}
