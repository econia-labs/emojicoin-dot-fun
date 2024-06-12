"use client";

import { AptosInputLabel, EmojiInputLabel } from "./InputLabels";
import { useSimulateSwap } from "lib/queries/client-api/simulate-swap";
import { type PropsWithChildren, useEffect, useState } from "react";
import FlipInputsArrow from "./FlipInputsArrow";
import { Column, Row } from "components/layout/components/FlexContainers";
import { SwapButton } from "./SwapButton";
import { type SwapComponentProps } from "components/pages/emojicoin/types";
import { toActualCoinDecimals, toDisplayCoinDecimals } from "lib/utils/decimals";
import { useScramble } from "use-scramble";

const SimulateInputsWrapper = ({ children }: PropsWithChildren) => (
  <div className="flex flex-col relative gap-[19px]">{children}</div>
);

const InnerWrapper = ({ children }: PropsWithChildren) => (
  <div
    className={
      `flex justify-between border border-solid border-dark-gray ` +
      `radii-xs px-[18px] py-[7px] items-center h-[55px] md:items-stretch`
    }
  >
    {children}
  </div>
);

const grayLabel = `
  pixel-heading-4 mb-[-6px] text-light-gray !leading-5 uppercase
`;

const inputAndOutputStyles = `
  block text-[16px] font-normal h-[32px] outline-none w-full
  font-forma
  border-transparent !p-0 text-white
`;

export default function SwapComponent({ emojicoin, marketAddress, numSwaps }: SwapComponentProps) {
  const [inputAmount, setInputAmount] = useState("1");
  const [outputAmount, setOutputAmount] = useState("0"); // TODO: Use calculation for initial value...?
  const [previous, setPrevious] = useState(inputAmount);
  const [isLoading, setIsLoading] = useState(false);
  const [isSell, setIsSell] = useState(false);

  const swapResult = useSimulateSwap({
    marketAddress,
    inputAmount: toActualCoinDecimals({ num: inputAmount }),
    isSell,
    numSwaps,
  });

  const { ref, replay } = useScramble({
    text: isLoading ? previous : outputAmount,
    overdrive: false,
    overflow: true,
    speed: isLoading ? 0.4 : 1000,
    scramble: isLoading ? 5 : 0,
    range: [48, 58],
    playOnMount: false,
  });

  useEffect(() => {
    replay();
  }, [isLoading, replay]);

  useEffect(() => {
    if (typeof swapResult === "undefined") {
      setIsLoading(true);
      return;
    }
    const swapResultDisplay = toDisplayNumber(swapResult);
    setPrevious(swapResultDisplay);
    setOutputAmount(swapResultDisplay);
    setIsLoading(false);
    replay();
  }, [swapResult, replay]);

  const toDisplayNumber = (value: bigint | number | string) => {
    const badString = typeof value === "string" && (value === "" || isNaN(parseInt(value)));
    if (!value || badString) {
      return "0";
    }
    return toDisplayCoinDecimals({ num: value, decimals: 2 }).toString();
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value === "") {
      setInputAmount("");
    }
    if (isNaN(parseFloat(e.target.value))) {
      e.stopPropagation();
      return;
    }
    setInputAmount(e.target.value);
  };

  return (
    <>
      <Column className="w-full max-w-[414px] h-full justify-center">
        <div className="heading-2 md:heading-1 text-white uppercase pb-[17px]">
          {"Trade emojicoin"}
        </div>

        <SimulateInputsWrapper>
          <InnerWrapper>
            <Column>
              <div className={grayLabel}>You {isSell ? "sell" : "pay"}</div>
              <input
                className={inputAndOutputStyles + " bg-transparent leading-[32px]"}
                value={inputAmount}
                min={0}
                step={0.01}
                onChange={handleInput}
                type="number"
              ></input>
            </Column>
            {isSell ? <EmojiInputLabel emoji={emojicoin} /> : <AptosInputLabel />}
          </InnerWrapper>

          <FlipInputsArrow
            onClick={() => {
              setInputAmount(outputAmount);
              setIsSell((v) => !v);
            }}
          />

          <InnerWrapper>
            <Column>
              <div className={grayLabel}>You receive</div>
              <div className="h-[22px] w-full">
                <div
                  className={inputAndOutputStyles + " mt-[8px] ml-[1px]"}
                  style={{ opacity: isLoading ? 0.6 : 1 }}
                >
                  {/* Scrambled swap result output below. */}
                  <div ref={ref}></div>
                </div>
              </div>
            </Column>
            {isSell ? <AptosInputLabel /> : <EmojiInputLabel emoji={emojicoin} />}
          </InnerWrapper>
        </SimulateInputsWrapper>

        <Row className="justify-center mt-[14px]">
          <SwapButton
            inputAmount={toActualCoinDecimals({ num: inputAmount })}
            marketAddress={marketAddress}
            isSell={isSell}
          />
        </Row>
      </Column>
    </>
  );
}
