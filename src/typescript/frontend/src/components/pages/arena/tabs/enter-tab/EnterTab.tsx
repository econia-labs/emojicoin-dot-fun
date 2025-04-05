import Loading from "components/loading";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { useCurrentPositionQuery } from "lib/hooks/queries/arena/use-current-position";
import type { PropsWithChildren } from "react";
import React, { useEffect } from "react";

import Button from "@/components/button";
import ProgressBar from "@/components/ProgressBar";
import { useCurrentMeleeInfo } from "@/hooks/use-current-melee-info";
import { useLatestMeleeID } from "@/hooks/use-latest-melee-id";
import type { UserEscrow } from "@/sdk/index";
import { useArenaEscrow } from "@/store/escrow/hooks";

import { useArenaPhaseStore } from "../../phase/store";
import { EnterTabAmountPhase } from "./EnterTabAmountPhase";
import { EnterTabLockPhase } from "./EnterTabLockPhase";
import { EnterTabPickPhase } from "./EnterTabPickPhase";
import { EnterTabSummary } from "./EnterTabSummary";

type Phase = "pick" | "amount" | "lock" | "summary";

export const EnterTab = () => {
  const selection = useArenaPhaseStore((s) => s.selectedMarket);
  const { selectedMarket: market } = useCurrentMeleeInfo();
  const setPhase = useArenaPhaseStore((s) => s.setPhase);
  const setMarket = useArenaPhaseStore((s) => s.setMarket);
  const phase = useArenaPhaseStore((s) => s.phase);
  const amount = useArenaPhaseStore((s) => s.amount);

  const latestMeleeID = useLatestMeleeID();
  const { meleeInfo } = useCurrentMeleeInfo();
  const { position } = useCurrentPositionQuery();
  const escrow = useArenaEscrow(meleeInfo?.meleeID);

  const { account } = useAptos();

  useEffect(() => {
    if (account && position && position.meleeID >= latestMeleeID) {
      setPhase("summary");
    } else {
      setPhase("pick");
    }
  }, [account, position, latestMeleeID, setPhase]);

  // If somehow the phase is set to summary when there's no selection,
  // set it to pick so there's not an infinite loading animation.
  useEffect(() => {
    if (selection === undefined && phase === "summary") {
      setPhase("pick");
    }
  }, [selection, phase, setPhase]);

  if (phase === "summary") {
    if (!escrow || !market) return <Loading />;
    return (
      <EnterTabSummary
        escrow={escrow}
        market={market}
        topOff={() => {
          setPhase("amount");
          setMarket(escrow);
        }}
        tapOut={() => setPhase("pick")}
        swap={() => setMarket(escrow, "reversed")}
      />
    );
  }

  if (phase === "pick") {
    return (
      <Container progress={1} phase={phase} escrow={escrow} setPhase={setPhase}>
        <EnterTabPickPhase />
      </Container>
    );
  }

  if (phase === "amount") {
    if (!market) throw new Error("Market is undefined in amount phase");
    return (
      <Container progress={2} phase={phase} escrow={escrow} setPhase={setPhase}>
        <EnterTabAmountPhase market={market} />
      </Container>
    );
  }

  if (phase === "lock") {
    if (!market || amount === undefined)
      throw new Error("Market or amount is undefined in lock phase");
    return (
      <Container progress={3} phase={phase} escrow={escrow} setPhase={setPhase}>
        <EnterTabLockPhase market={market} amount={amount} />
      </Container>
    );
  }

  return <Loading />;
};

function Container({
  children,
  progress,
  phase,
  setPhase,
  escrow,
}: PropsWithChildren & {
  progress: number;
  phase: Phase;
  setPhase: (phase: Phase) => void;
  escrow?: UserEscrow | null;
}) {
  return (
    <div className="relative flex flex-col h-[100%] gap-[3em]">
      <div className="absolute left-0 w-[100%] text-white flex">
        <div className="m-auto w-[33%] pt-[2em]">
          <ProgressBar length={3} position={progress} />
        </div>
        {(phase === "amount" || phase === "lock") && (
          <div className="absolute top-[1.5em] left-[1em]">
            <Button
              scale="lg"
              onClick={() => {
                if (phase === "amount") {
                  if (escrow?.open) setPhase("summary");
                  else setPhase("pick");
                } else if (phase === "lock") setPhase("amount");
              }}
            >
              Back
            </Button>
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
