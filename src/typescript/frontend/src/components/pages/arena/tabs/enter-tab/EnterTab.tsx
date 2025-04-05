import Loading from "components/loading";
import type { PropsWithChildren } from "react";
import React, { useEffect, useState } from "react";

import Button from "@/components/button";
import ProgressBar from "@/components/ProgressBar";
import type { ArenaPositionModel } from "@/sdk/index";
import type { MarketStateModel } from "@/sdk/indexer-v2/types";

import { marketTernary } from "../../utils";
import { EnterTabAmountPhase } from "./EnterTabAmountPhase";
import { EnterTabLockPhase } from "./EnterTabLockPhase";
import { EnterTabPickPhase } from "./EnterTabPickPhase";
import { EnterTabSummary } from "./EnterTabSummary";

type Phase = "pick" | "amount" | "lock" | "summary";

export const EnterTab: React.FC<{
  market0: MarketStateModel;
  market1: MarketStateModel;
  position?: ArenaPositionModel | null;
  setPosition: (position: ArenaPositionModel | null) => void;
}> = ({ market0, market1, position, setPosition }) => {
  const [phase, setPhase] = useState<Phase>();
  const [market, setMarket] = useState<MarketStateModel>();
  const [amount, setAmount] = useState<bigint>();
  const [error, setError] = useState<boolean>(false);
  const [cranked, setCranked] = useState<boolean>(false);

  useEffect(() => {
    if (position !== undefined && position !== null && position.open) {
      setPhase("summary");
    } else if (position === null || position?.open === false) {
      setPhase("pick");
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [position]);

  if (phase === "summary") {
    if (!position) return <Loading />;
    return (
      <EnterTabSummary
        market={marketTernary(position, market0, market1)}
        topOff={() => {
          setPhase("amount");
          setMarket(marketTernary(position, market0, market1));
        }}
        tapOut={() => setPhase("pick")}
        swap={() => setMarket(marketTernary(position, market1, market0))}
        {...{ market0, market1, setPosition, position }}
      />
    );
  }

  if (phase === "pick") {
    return (
      <Container progress={1} {...{ phase, position, setPhase }}>
        <EnterTabPickPhase
          {...{
            market0,
            market1,
            setMarket,
            error,
            closeError: () => setError(false),
            cranked,
            closeCranked: () => setCranked(false),
            nextPhase: () => setPhase("amount"),
          }}
        />
      </Container>
    );
  }

  if (phase === "amount") {
    if (!market) throw new Error("Market is undefined in amount phase");
    return (
      <Container progress={2} {...{ phase, position, setPhase }}>
        <EnterTabAmountPhase {...{ market, setAmount, nextPhase: () => setPhase("lock") }} />
      </Container>
    );
  }

  if (phase === "lock") {
    if (!market || amount === undefined)
      throw new Error("Market or amount is undefined in lock phase");
    return (
      <Container progress={3} {...{ phase, position, setPhase }}>
        <EnterTabLockPhase
          {...{
            market,
            market0,
            market1,
            amount,
            errorOut: () => {
              setPhase("pick");
              setError(true);
            },
            setCranked: () => {
              setPhase("pick");
              setCranked(true);
            },
            position,
            setPosition,
          }}
        />
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
  position,
}: PropsWithChildren & {
  progress: number;
  phase: Phase;
  setPhase: (phase: Phase) => void;
  position?: ArenaPositionModel | null;
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
