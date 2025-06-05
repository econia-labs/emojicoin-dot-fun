import Button from "components/button";

import { useArenaPhaseStore } from "../../phase/store";
import { EmojiTitle } from "../../utils";
import BlurModal from "../enter-tab/BlurModal";

export default function EnterTabPickPhase() {
  const setMarket = useArenaPhaseStore((s) => s.setMarket);
  const setPhase = useArenaPhaseStore((s) => s.setPhase);
  const setError = useArenaPhaseStore((s) => s.setError);
  const error = useArenaPhaseStore((s) => s.error);

  return (
    <div className="relative flex w-[100%] grow flex-col place-items-center justify-center gap-[3em]">
      {error && (
        <BlurModal close={() => setError(false)}>
          <div className="flex max-w-[58ch] flex-col gap-[3em]">
            <div className="text-center text-4xl uppercase text-white">Entry cancel or error</div>
            <div className="font-forma uppercase leading-6 text-light-gray">
              We have detected that the entry was either cancelled or an error occurred during the
              entry process. No funds were moved and you did not enter the melee.
            </div>
          </div>
          <Button scale="lg" onClick={() => setError(false)}>
            Close
          </Button>
        </BlurModal>
      )}
      <div className="w-[100%]">
        <div className="text-center font-forma text-xl uppercase text-white">Pick your side</div>
        <EmojiTitle
          onClicks={{
            emoji0: () => {
              setMarket(0);
              setPhase("amount");
            },
            emoji1: () => {
              setMarket(1);
              setPhase("amount");
            },
          }}
        />
      </div>
    </div>
  );
}
