import Loading from "components/loading";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { useCurrentPositionQuery } from "lib/hooks/queries/arena/use-current-position";
import type { PropsWithChildren } from "react";
import React, { useEffect, useState } from "react";

import Button from "@/components/button";
import ProgressBar from "@/components/ProgressBar";
import { useCurrentMeleeInfo } from "@/hooks/use-current-melee-info";
import { useLatestMeleeID } from "@/hooks/use-latest-melee-id";
import type { UserEscrow } from "@/sdk/index";
import type { MarketStateModel } from "@/sdk/indexer-v2/types";
import { useArenaEscrow } from "@/store/escrow/hooks";

import AnimatedLoadingBoxes from "../../../launch-emojicoin/animated-loading-boxes";
import { ifEscrowTernary } from "../../utils";
import { EnterTabAmountPhase } from "./EnterTabAmountPhase";
import { EnterTabLockPhase } from "./EnterTabLockPhase";
import { EnterTabPickPhase } from "./EnterTabPickPhase";
import { EnterTabSummary } from "./EnterTabSummary";

type Phase = "pick" | "amount" | "lock" | "summary";

export const EnterTab = () => {
  const [phase, setPhase] = useState<Phase>();
  const [market, setMarket] = useState<MarketStateModel>();
  const [amount, setAmount] = useState<bigint>();
  const [error, setError] = useState<boolean>(false);

  const latestMeleeID = useLatestMeleeID();
  const { meleeInfo, market0, market1 } = useCurrentMeleeInfo();
  const { position } = useCurrentPositionQuery();
  const escrow = useArenaEscrow(meleeInfo?.meleeID);

  const { account } = useAptos();

  useEffect(() => {
    if (account && position && position.meleeID >= latestMeleeID) {
      setPhase("summary");
    } else {
      setPhase("pick");
    }
  }, [account, position, latestMeleeID]);

  if (phase === "summary") {
    if (!escrow || !market0 || !market1) return <Loading />;
    return (
      <EnterTabSummary
        escrow={escrow}
        market={ifEscrowTernary(escrow, market0, market1)}
        topOff={() => {
          setPhase("amount");
          setMarket(ifEscrowTernary(escrow, market0, market1));
        }}
        tapOut={() => setPhase("pick")}
        swap={() => setMarket(ifEscrowTernary(escrow, market1, market0))}
      />
    );
  }

  if (phase === "pick") {
    return (
      <Container progress={1} phase={phase} escrow={escrow} setPhase={setPhase}>
        {!market0 || !market1 ? (
          <AnimatedLoadingBoxes numSquares={4} />
        ) : (
          <EnterTabPickPhase
            market0={market0}
            market1={market1}
            setMarket={setMarket}
            error={error}
            closeError={() => setError(false)}
            nextPhase={() => setPhase("amount")}
          />
        )}
      </Container>
    );
  }

  if (phase === "amount") {
    if (!market) throw new Error("Market is undefined in amount phase");
    return (
      <Container progress={2} phase={phase} escrow={escrow} setPhase={setPhase}>
        <EnterTabAmountPhase
          market={market}
          setAmount={setAmount}
          nextPhase={() => () => setPhase("lock")}
        />
      </Container>
    );
  }

  if (phase === "lock") {
    if (!market || amount === undefined)
      throw new Error("Market or amount is undefined in lock phase");
    return (
      <Container progress={3} phase={phase} escrow={escrow} setPhase={setPhase}>
        {!market0 || !market1 ? (
          <AnimatedLoadingBoxes numSquares={4} />
        ) : (
          <EnterTabLockPhase
            market={market}
            amount={amount}
            errorOut={() => {
              setPhase("pick");
              setError(true);
            }}
          />
        )}
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
