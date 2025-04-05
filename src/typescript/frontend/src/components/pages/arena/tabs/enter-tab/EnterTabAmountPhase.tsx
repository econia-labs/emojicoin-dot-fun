import { useState } from "react";
import { GlowingEmoji } from "utils/emoji";

import Button from "@/components/button";
import { InputNumeric } from "@/components/inputs";
import { AptosInputLabel } from "@/components/pages/emojicoin/components/trade-emojicoin/InputLabels";
import type { MarketStateModel } from "@/sdk/index";

const inputAndOutputStyles = `
  block text-[16px] font-normal h-[32px] outline-none w-full
  font-forma
  border-transparent !p-0 text-white
`;
const grayLabel = `
  pixel-heading-4 mb-[-6px] text-light-gray !leading-5 uppercase
`;

export const EnterTabAmountPhase: React.FC<{
  market: MarketStateModel;
  setAmount: (amount: bigint) => void;
  nextPhase: () => void;
}> = ({ market, setAmount, nextPhase }) => {
  const [innerAmount, setInnerAmount] = useState<bigint>(0n);
  return (
    <div className="grid place-items-center h-[100%]">
      <div className="flex flex-col gap-[2em] items-center">
        <div className="m-auto text-6xl">
          <GlowingEmoji emojis={market.market.symbolEmojis.join("")} />
        </div>
        <div className="font-forma text-xl uppercase text-white text-center">Deposit amount</div>
        <InnerWrapper>
          <div className="flex flex-col">
            <div className={grayLabel}>Amount</div>
            <InputNumeric
              className={inputAndOutputStyles + " bg-transparent leading-[32px]"}
              value={innerAmount}
              onUserInput={(v) => setInnerAmount(v)}
              onSubmit={() => setAmount(innerAmount)}
              decimals={8}
            />
          </div>
          <AptosInputLabel />
        </InnerWrapper>
        <Button
          scale="lg"
          onClick={() => {
            setAmount(innerAmount);
            nextPhase();
          }}
          disabled={innerAmount <= 0n}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

function InnerWrapper({ children }: React.PropsWithChildren) {
  return (
    <div
      className={
        `flex justify-between border border-solid border-dark-gray ` +
        `radii-xs px-[18px] py-[7px] items-center h-[55px] md:items-stretch max-w-[300px]`
      }
    >
      {children}
    </div>
  );
}
