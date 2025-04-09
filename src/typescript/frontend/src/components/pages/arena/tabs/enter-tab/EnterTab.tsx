import Loading from "components/loading";
import type { CurrentUserPosition } from "lib/hooks/positions/use-current-position";
import { useCurrentPosition } from "lib/hooks/positions/use-current-position";
import type { PropsWithChildren } from "react";
import React, { useEffect } from "react";

import Button from "@/components/button";
import ProgressBar from "@/components/ProgressBar";

import { useArenaPhaseStore, useSelectedMarket } from "../../phase/store";
import EnterTabAmountPhase from "./EnterTabAmountPhase";
import EnterTabLockPhase from "./EnterTabLockPhase";
import EnterTabPickPhase from "./EnterTabPickPhase";
import EnterTabSummary from "./summary/EnterTabSummary";

type Phase = "pick" | "amount" | "lock" | "summary";

export default function EnterTab() {
  const selectedMarket = useSelectedMarket();
  const setPhase = useArenaPhaseStore((s) => s.setPhase);
  const setMarket = useArenaPhaseStore((s) => s.setMarket);
  const phase = useArenaPhaseStore((s) => s.phase);
  const amount = useArenaPhaseStore((s) => s.amount);

  const { position, isLoading } = useCurrentPosition();

  useEffect(() => {
    const { open } = position ?? {};
    if (open && phase !== "amount" && phase !== "lock") {
      setPhase("summary");
    }
    if ((position === null || open === false) && phase === "summary") {
      setPhase("pick");
    }
  }, [phase, position, setPhase]);

  if (isLoading) return <Loading />;

  if (phase === "summary") {
    if (!position) return <Loading />;
    return (
      <EnterTabSummary
        position={position}
        topOff={() => {
          setPhase("amount");
          setMarket(position);
        }}
        tapOut={() => setPhase("pick")}
        swap={() => setMarket(position, "reversed")}
      />
    );
  }

  if (phase === "pick") {
    return (
      <Container progress={1} phase={phase} position={position} setPhase={setPhase}>
        <EnterTabPickPhase />
      </Container>
    );
  }

  if (phase === "amount") {
    if (!selectedMarket) throw new Error("Market is undefined in amount phase");
    return (
      <Container progress={2} phase={phase} position={position} setPhase={setPhase}>
        <EnterTabAmountPhase market={selectedMarket} />
      </Container>
    );
  }

  if (phase === "lock") {
    if (!selectedMarket || amount === undefined)
      throw new Error("Market or amount is undefined in lock phase");
    return (
      <Container progress={3} phase={phase} position={position} setPhase={setPhase}>
        <EnterTabLockPhase market={selectedMarket} amount={amount} />
      </Container>
    );
  }
}

function Container({
  children,
  progress,
  phase,
  setPhase,
  position,
}: PropsWithChildren & {
  progress: number;
  phase: Phase;
  setPhase: (phase: Phase) => void;
  position?: CurrentUserPosition | null;
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
                  if (position?.open) setPhase("summary");
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
