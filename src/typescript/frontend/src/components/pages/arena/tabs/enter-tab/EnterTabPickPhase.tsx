import Button from "components/button";
import React from "react";

import type { MarketStateModel } from "@/sdk/indexer-v2/types";

import { EmojiTitle } from "../../utils";
import { BlurModal } from "../enter-tab/BlurModal";

export const EnterTabPickPhase: React.FC<{
  market0: MarketStateModel;
  market1: MarketStateModel;
  setMarket: (market: MarketStateModel) => void;
  error: boolean;
  closeError: () => void;
  nextPhase: () => void;
}> = ({ market0, market1, setMarket, error, closeError, nextPhase }) => {
  return (
    <div className="relative grid gap-[3em] place-items-center h-[100%] w-[100%]">
      {error && (
        <BlurModal close={closeError}>
          <div className="flex flex-col gap-[3em] max-w-[58ch]">
            <div className="text-4xl uppercase text-white text-center">Entry cancel or error</div>
            <div className="font-forma text-light-gray leading-6 uppercase">
              We have detected that the entry was either cancelled or an error occurred during the
              entry process. No funds were moved and you did not enter the melee.
            </div>
          </div>
          <Button scale="lg" onClick={closeError}>
            Close
          </Button>
        </BlurModal>
      )}
      <div className="w-[100%]">
        <div className="font-forma text-xl uppercase text-white text-center">Pick your side</div>
        <EmojiTitle
          market0Symbols={market0.market.symbolEmojis}
          market1Symbols={market1.market.symbolEmojis}
          onClicks={{
            emoji0: () => {
              setMarket(market0);
              nextPhase();
            },
            emoji1: () => {
              setMarket(market1);
              nextPhase();
            },
          }}
        />
      </div>
    </div>
  );
};
