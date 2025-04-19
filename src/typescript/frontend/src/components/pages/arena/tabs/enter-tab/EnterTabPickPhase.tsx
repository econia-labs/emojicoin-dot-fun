import Button from "components/button";
import React from "react";

import { useArenaPhaseStore } from "../../phase/store";
import { EmojiTitle } from "../../utils";
import BlurModal from "../enter-tab/BlurModal";

export default function EnterTabPickPhase() {
  const setMarket = useArenaPhaseStore((s) => s.setMarket);
  const setPhase = useArenaPhaseStore((s) => s.setPhase);
  const setError = useArenaPhaseStore((s) => s.setError);
  const error = useArenaPhaseStore((s) => s.error);

  return (
    <div
      className="relative flex flex-col grow gap-[3em] justify-center place-items-center w-[100%]"
      style={{ containerType: "size" }}
    >
      {error && (
        <BlurModal close={() => setError(false)}>
          <div className="flex flex-col gap-[3em] max-w-[58ch]">
            <div className="text-4xl uppercase text-white text-center">Entry cancel or error</div>
            <div className="font-forma text-light-gray leading-6 uppercase">
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
        <div className="font-forma text-xl uppercase text-white text-center">Pick your side</div>
        <EmojiTitle
          fontSizeMultiplier={1.5}
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
