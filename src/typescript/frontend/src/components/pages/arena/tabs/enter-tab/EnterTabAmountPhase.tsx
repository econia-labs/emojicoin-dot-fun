import { useState } from "react";
import { GlowingEmoji } from "utils/emoji";

import Button from "@/components/button";
import { InputNumeric } from "@/components/inputs";
import { AptosInputLabel } from "@/components/pages/emojicoin/components/trade-emojicoin/InputLabels";
import type { MarketStateModel } from "@/sdk/index";

import { useArenaPhaseStore } from "../../phase/store";

const inputAndOutputStyles = `
    block text-[16px] font-normal h-[32px] outline-none w-full
    font-forma
    border-transparent !p-0 text-white
  `;
const grayLabel = `
    pixel-heading-4 mb-[-6px] text-light-gray !leading-5 uppercase
  `;

export default function EnterTabAmountPhase({ market }: { market: MarketStateModel }) {
  const setAmount = useArenaPhaseStore((s) => s.setAmount);
  const setPhase = useArenaPhaseStore((s) => s.setPhase);
  const [innerAmount, setInnerAmount] = useState<bigint>(0n);
  return (
    <div className="flex grow flex-col items-center justify-center">
      <div className="flex w-full grow flex-col items-center justify-center gap-[1rem]">
        <div className="text-6xl">
          <GlowingEmoji emojis={market.market.symbolEmojis.join("")} />
        </div>
        <div className="font-forma text-xl uppercase text-white">Deposit amount</div>
        <div className="flex h-[55px] max-w-[300px] items-center justify-between border border-solid border-dark-gray px-[18px] py-[7px] radii-xs md:items-stretch">
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
        </div>
      </div>
      <Button
        scale="lg"
        onClick={() => {
          setAmount(innerAmount);
          setPhase("lock");
        }}
        disabled={innerAmount <= 0n}
      >
        Next
      </Button>
    </div>
  );
}
