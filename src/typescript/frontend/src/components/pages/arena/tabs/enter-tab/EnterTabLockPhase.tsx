import { useEventStore } from "context/event-store-context/hooks";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { useCurrentPosition } from "lib/hooks/positions/use-current-position";
import { useEnterTransactionBuilder } from "lib/hooks/transaction-builders/use-enter-builder";
import { useArenaSubmissionSnapshot } from "lib/hooks/use-arena-submission-snapshot";
import { Lock } from "lucide-react";
import { useMemo, useState } from "react";

import Button from "@/components/button";
import ButtonWithConnectWalletFallback from "@/components/header/wallet-button/ConnectWalletButton";
import Info from "@/components/info";
import Popup from "@/components/popup";
import { Switch } from "@/components/ui/Switch";
import { useCurrentMeleeInfo } from "@/hooks/use-current-melee-info";
import useRewardsRemaining from "@/hooks/use-rewards-remaining";
import { getEvents, type MarketStateModel } from "@/sdk/index";

import MATCH_AMOUNT_TEXT from "../../match-amount-text";
import { globalArenaPhaseStore, useArenaPhaseStore } from "../../phase/store";
import { GET_MATCHED_EXPLANATION_STRINGS } from "../InfoTab";
import { FormattedNominalNumber } from "../utils";
import { MatchAmount } from "./MatchAmount";

export default function EnterTabLockPhase({
  market,
  amount,
}: {
  market: MarketStateModel;
  amount: bigint;
}) {
  const { position } = useCurrentPosition();
  const { account, submit } = useAptos();
  const { market0, market1 } = useCurrentMeleeInfo();
  const setPhase = useArenaPhaseStore((s) => s.setPhase);
  const setError = useArenaPhaseStore((s) => s.setError);
  const rewardsRemaining = useRewardsRemaining();
  const arenaInfo = useEventStore((s) => s.arenaInfoFromServer);
  const snapshot = useArenaSubmissionSnapshot();
  // Lock in ("get matched") by default if there are rewards remaining.
  const [innerLock, setInnerLock] = useState<boolean>(position?.lockedIn || !!rewardsRemaining);

  const { mustLockIn, lockedIn } = useMemo(() => {
    const mustLockIn = position?.lockedIn === true;
    const lockedIn = innerLock || mustLockIn;
    return {
      mustLockIn,
      lockedIn,
    };
  }, [innerLock, position?.lockedIn]);

  const transactionBuilder = useEnterTransactionBuilder(
    amount,
    lockedIn,
    market0?.market.marketAddress,
    market1?.market.marketAddress,
    market.market.marketAddress
  );

  return (
    <div className="flex flex-col grow items-center">
      <div className="flex flex-col grow justify-center">
        <div className="flex justify-between w-[300px]">
          <div className="flex gap-[6px] items-center font-forma text-xl uppercase text-white text-center">
            Get matched
            <Info infoIconClassName="!mb-[1px]">
              <div className="flex flex-col gap-1">
                {GET_MATCHED_EXPLANATION_STRINGS.map((content, i) => {
                  return <div key={`${content.substring(10)}-${i}`}>{content}</div>;
                })}
              </div>
            </Info>
          </div>
          <div className="flex gap-[1em] items-center">
            <div className="uppercase text-light-gray text-xl">
              {mustLockIn ? (
                <Popup
                  content={
                    <span>
                      You&apos;re already locked in.
                      <br />
                      Any additional deposits
                      <br />
                      must also be locked in.
                    </span>
                  }
                >
                  <Lock className="m-auto ml-[3px] text-ec-blue" size={16} />
                </Popup>
              ) : lockedIn ? (
                <span className="text-green">Enabled</span>
              ) : (
                <span className={rewardsRemaining ? "text-pink" : ""}>Disabled</span>
              )}
            </div>
            {!mustLockIn && (
              <Switch checked={lockedIn} onCheckedChange={(checked) => setInnerLock(checked)} />
            )}
          </div>
        </div>
        <div className="max-w-[350px] w-[100%]">
          <div className="flex justify-between p-[0.8em] rounded-[3px] bg-ec-blue text-2xl text-black uppercase">
            <div>Deposit amount</div>
            <FormattedNominalNumber value={amount} suffix=" APT" />
          </div>
          <div className="flex uppercase justify-between text-2xl text-light-gray py-[0.8em] mx-[0.8em] border-dashed border-b-[1px] border-light-gray ">
            <div className="flex flex-row gap-1">
              {"Match amount"}
              <Info>
                <div className="flex flex-col gap-2">
                  {MATCH_AMOUNT_TEXT.map((text, i) => (
                    <span key={`${(text.substring(5), i)}`}>{text}</span>
                  ))}
                </div>
              </Info>
            </div>
            <MatchAmount
              lockedIn={lockedIn}
              mustLockIn={mustLockIn}
              rewardsRemaining={rewardsRemaining}
              arenaInfo={arenaInfo}
              position={position}
              amount={amount}
            />
          </div>
        </div>
      </div>
      <ButtonWithConnectWalletFallback>
        <Button
          scale="lg"
          onClick={() => {
            if (!account) return;
            globalArenaPhaseStore.getState().setSubmitSnapshot(snapshot, transactionBuilder);
            submit(transactionBuilder).then((res) => {
              if (getEvents(res?.response).arenaMeleeEvents.length) {
                setPhase("pick");
              } else {
                setPhase("summary");
              }
              if (!res || res?.error) {
                setError(true);
              }
            });
          }}
        >
          Enter
        </Button>
      </ButtonWithConnectWalletFallback>
    </div>
  );
}
