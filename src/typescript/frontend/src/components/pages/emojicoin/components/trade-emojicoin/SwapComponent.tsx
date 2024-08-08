"use client";

import { AptosInputLabel, EmojiInputLabel } from "./InputLabels";
import { type PropsWithChildren, useEffect, useState, useCallback, useMemo } from "react";
import FlipInputsArrow from "./FlipInputsArrow";
import { Column, Row } from "components/layout/components/FlexContainers";
import { SwapButton } from "./SwapButton";
import { type SwapComponentProps } from "components/pages/emojicoin/types";
import { toActualCoinDecimals, toDisplayCoinDecimals } from "lib/utils/decimals";
import { useScramble } from "use-scramble";
import { useSimulateSwap } from "lib/hooks/queries/use-simulate-swap";
import { useEventStore } from "context/state-store-context";
import { useMatchBreakpoints } from "@hooks/index";
import { useSearchParams } from "next/navigation";
import { translationFunction } from "context/language-context";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { AnimatePresence, motion } from "framer-motion";
import { toCoinTypes } from "@sdk/markets/utils";

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

const APT_DISPLAY_DECIMALS = 4;
const EMOJICOIN_DISPLAY_DECIMALS = 1;

export default function SwapComponent({
  emojicoin,
  marketAddress,
  marketID,
  initNumSwaps,
}: SwapComponentProps) {
  const { t } = translationFunction();
  const searchParams = useSearchParams();

  const presetInputAmount =
    searchParams.get("buy") !== null ? searchParams.get("buy") : searchParams.get("sell");
  const presetInputAmountIsValid =
    presetInputAmount !== null &&
    presetInputAmount !== "" &&
    !Number.isNaN(Number(presetInputAmount));
  const { isDesktop } = useMatchBreakpoints();
  const [inputAmount, setInputAmount] = useState(
    presetInputAmountIsValid ? presetInputAmount! : "1"
  );
  const [outputAmount, setOutputAmount] = useState("0");
  const [previous, setPrevious] = useState(inputAmount);
  const [isLoading, setIsLoading] = useState(false);
  const [isSell, setIsSell] = useState(!(searchParams.get("sell") === null));
  const [submit, setSubmit] = useState<(() => Promise<void>) | null>(null);
  const { aptBalance, emojicoinBalance, account, setEmojicoinType } = useAptos();

  const numSwaps = useEventStore((s) => s.getMarket(marketID)?.swapEvents.length ?? initNumSwaps);

  useEffect(() => {
    const emojicoinType = toCoinTypes(marketAddress).emojicoin.toString();
    setEmojicoinType(emojicoinType);
  }, [marketAddress, setEmojicoinType]);

  const swapResult = useSimulateSwap({
    marketAddress,
    inputAmount: toActualCoinDecimals({ num: inputAmount }),
    isSell,
    numSwaps,
  });

  const { ref, replay } = useScramble({
    text: Number(isLoading ? previous : outputAmount).toFixed(
      isSell ? APT_DISPLAY_DECIMALS : EMOJICOIN_DISPLAY_DECIMALS
    ),
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
    // We use the APT display decimal amount here to avoid early truncation.
    return toDisplayCoinDecimals({ num: value, decimals: APT_DISPLAY_DECIMALS }).toString();
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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && submit) {
        submit();
      }
    },
    [submit]
  );

  const sufficientBalance = useMemo(() => {
    if (!account || (isSell && !emojicoinBalance) || (!isSell && !aptBalance)) return false;
    if (account) {
      if (isSell) {
        return emojicoinBalance >= BigInt(toActualCoinDecimals({ num: inputAmount }));
      }
      return aptBalance >= BigInt(toActualCoinDecimals({ num: inputAmount }));
    }
  }, [account, aptBalance, emojicoinBalance, isSell, inputAmount]);

  const balanceLabel = useMemo(() => {
    const label = ` (${t("Balance")}: `;
    const coinBalance = isSell ? emojicoinBalance : aptBalance;
    const balance = toDisplayCoinDecimals({
      num: coinBalance,
      decimals: !isSell ? APT_DISPLAY_DECIMALS : EMOJICOIN_DISPLAY_DECIMALS,
    });
    return (
      <AnimatePresence>
        {account && (
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {label}
            <span className={sufficientBalance ? "text-green" : "text-error"}>{balance}</span>
            {")"}
          </motion.span>
        )}
      </AnimatePresence>
    );
  }, [t, account, isSell, aptBalance, emojicoinBalance, sufficientBalance]);

  return (
    <>
      <Column className="relative w-full max-w-[414px] h-full justify-center">
        <div
          className={`${isDesktop ? "heading-1" : "heading-2"} md:heading-1 text-white uppercase pb-[17px]`}
        >
          {t("Trade Emojicoin")}
        </div>

        <SimulateInputsWrapper>
          <InnerWrapper>
            <Column>
              <div className={grayLabel}>
                {isSell ? t("You sell") : t("You pay")}
                {balanceLabel}
              </div>
              <input
                className={inputAndOutputStyles + " bg-transparent leading-[32px]"}
                value={inputAmount}
                min={0} // min, max, and step don't do anything here. They're here for possible accessibility purposes.
                step={0.01}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                type="number"
              ></input>
            </Column>
            {isSell ? <EmojiInputLabel emoji={emojicoin} /> : <AptosInputLabel />}
          </InnerWrapper>

          <FlipInputsArrow
            onClick={() => {
              const outputAmountNumber = Number(outputAmount);
              // Keep in mind that we're switching the sell type, so we do the opposite of what you'd expect to see.
              const switchingToSell = !isSell;
              if (switchingToSell) {
                setInputAmount(outputAmountNumber.toFixed(EMOJICOIN_DISPLAY_DECIMALS));
              } else {
                setInputAmount(outputAmountNumber.toFixed(APT_DISPLAY_DECIMALS));
              }
              setIsSell((v) => !v);
            }}
          />

          <InnerWrapper>
            <Column>
              <div className={grayLabel}>{t("You receive")}</div>
              <div className="h-[22px] w-full">
                <div
                  onClick={() => setIsSell((v) => !v)}
                  className={inputAndOutputStyles + " mt-[8px] ml-[1px] cursor-pointer"}
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
            setSubmit={setSubmit}
            // Disable the button if and only if the balance has been fetched and isn't sufficient *and*
            // the user is connected.
            disabled={!sufficientBalance && !isLoading && !!account}
          />
        </Row>
      </Column>
    </>
  );
}
