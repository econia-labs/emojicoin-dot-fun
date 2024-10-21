"use client";

import { AptosInputLabel, EmojiInputLabel } from "./InputLabels";
import {
  type PropsWithChildren,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type MouseEventHandler,
} from "react";
import FlipInputsArrow from "./FlipInputsArrow";
import { Column, Row } from "components/layout/components/FlexContainers";
import { SwapButton } from "./SwapButton";
import { type SwapComponentProps } from "components/pages/emojicoin/types";
import { toActualCoinDecimals, toDisplayCoinDecimals } from "lib/utils/decimals";
import { useScramble } from "use-scramble";
import { useSimulateSwap } from "lib/hooks/queries/use-simulate-swap";
import { useEventStore } from "context/event-store-context";
import { useMatchBreakpoints } from "@hooks/index";
import { useSearchParams } from "next/navigation";
import { translationFunction } from "context/language-context";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { AnimatePresence, motion } from "framer-motion";
import { toCoinTypes } from "@sdk/markets/utils";
import { Flex, FlexGap } from "@containers";
import Popup from "components/popup";
import { Text } from "components/text";

const SmallButton = ({
  emoji,
  description,
  onClick,
}: {
  emoji: string;
  description: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
}) => {
  return (
    <Popup
      content={
        <Text textScale="pixelHeading4" textTransform="uppercase" color="black">
          {description}
        </Text>
      }
    >
      <div
        className="px-[.7rem] py-[.2rem] border-[1px] border-solid rounded-full border-dark-gray h-[1.5rem] cursor-pointer hover:bg-neutral-800"
        onClick={onClick}
      >
        <div className="mt-[.11rem]">{emoji}</div>
      </div>
    </Popup>
  );
};

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

const INPUT_DISPLAY_DECIMALS = 8;
const OUTPUT_DISPLAY_DECIMALS = 4;
const SWAP_GAS_COST = 52500n;

export default function SwapComponent({
  emojicoin,
  marketAddress,
  marketEmojis,
  initNumSwaps,
  geoblocked,
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
    toActualCoinDecimals({ num: presetInputAmountIsValid ? presetInputAmount! : "1" })
  );
  const [inputAmountString, setInputAmountString] = useState(
    toDisplayCoinDecimals({ num: inputAmount, decimals: INPUT_DISPLAY_DECIMALS })
  );
  const [outputAmount, setOutputAmount] = useState(0n);
  const [previous, setPrevious] = useState(inputAmount);
  const [isLoading, setIsLoading] = useState(false);
  const [isSell, setIsSell] = useState(!(searchParams.get("sell") === null));
  const [submit, setSubmit] = useState<(() => Promise<void>) | null>(null);
  const { aptBalance, emojicoinBalance, account, setEmojicoinType } = useAptos();
  const availableAptBalance = useMemo(
    () => (aptBalance - SWAP_GAS_COST > 0 ? aptBalance - SWAP_GAS_COST : 0n),
    [aptBalance]
  );

  const numSwaps = useEventStore(
    (s) => s.getMarket(marketEmojis)?.swapEvents.length ?? initNumSwaps
  );

  useEffect(() => {
    const emojicoinType = toCoinTypes(marketAddress).emojicoin.toString();
    setEmojicoinType(emojicoinType);
  }, [marketAddress, setEmojicoinType]);

  const swapResult = useSimulateSwap({
    marketAddress,
    inputAmount: inputAmount.toString(),
    isSell,
    numSwaps,
  });

  const outputAmountString = toDisplayCoinDecimals({
    num: isLoading ? previous : outputAmount,
    decimals: OUTPUT_DISPLAY_DECIMALS,
  });

  const { ref, replay } = useScramble({
    text: new Intl.NumberFormat().format(Number(outputAmountString)),
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
    setPrevious(swapResult);
    setOutputAmount(swapResult);
    setIsLoading(false);
    replay();
  }, [swapResult, replay, isSell]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    value = value.replace(/^0*0\./, "0.");
    let decimals = value.replace(/^.*\.(.*)/, "$1");
    if (decimals.length > 8) {
      e.stopPropagation();
      return;
    }
    setInputAmountString(value);
    if (
      value === "" ||
      isNaN(parseFloat(value)) ||
      Number(toActualCoinDecimals({ num: value })) < 1
    ) {
      setInputAmount(0n);
      e.stopPropagation();
      return;
    }
    setInputAmount(BigInt(toActualCoinDecimals({ num: value })));
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
        return emojicoinBalance >= inputAmount;
      }
      return aptBalance >= inputAmount;
    }
  }, [account, aptBalance, emojicoinBalance, isSell, inputAmount]);

  const balanceLabel = useMemo(() => {
    const label = ` (${t("Balance")}: `;
    const coinBalance = isSell ? emojicoinBalance : aptBalance;
    const balance = toDisplayCoinDecimals({
      num: coinBalance,
      decimals: 4,
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
        <Flex flexDirection="row" justifyContent="space-between">
          <div
            className={`${isDesktop ? "heading-1" : "heading-2"} md:heading-1 text-white uppercase pb-[17px]`}
          >
            {t("Trade Emojicoin")}
          </div>
          <FlexGap flexDirection="row" gap="5px">
            {isSell ? (
              <>
                <SmallButton
                  emoji="🤢"
                  description="Sell 50%"
                  onClick={() => {
                    setInputAmount(emojicoinBalance / 2n);
                    setInputAmountString(
                      toDisplayCoinDecimals({ num: emojicoinBalance / 2n, decimals: 2 })
                    );
                  }}
                />
                <SmallButton
                  emoji="🤮"
                  description="Sell 100%"
                  onClick={() => {
                    setInputAmount(emojicoinBalance);
                    setInputAmountString(
                      toDisplayCoinDecimals({
                        num: emojicoinBalance,
                        decimals: INPUT_DISPLAY_DECIMALS,
                      })
                    );
                  }}
                />
              </>
            ) : (
              <>
                <SmallButton
                  emoji="🌒"
                  description="Buy 25%"
                  onClick={() => {
                    setInputAmount(availableAptBalance / 4n);
                    setInputAmountString(
                      toDisplayCoinDecimals({ num: availableAptBalance / 4n, decimals: 4 })
                    );
                  }}
                />
                <SmallButton
                  emoji="🌓"
                  description="Buy 50%"
                  onClick={() => {
                    setInputAmount(availableAptBalance / 2n);
                    setInputAmountString(
                      toDisplayCoinDecimals({ num: availableAptBalance / 2n, decimals: 4 })
                    );
                  }}
                />
                <SmallButton
                  emoji="🌕"
                  description="Buy 100%"
                  onClick={() => {
                    setInputAmount(availableAptBalance);
                    setInputAmountString(
                      toDisplayCoinDecimals({
                        num: availableAptBalance,
                        decimals: INPUT_DISPLAY_DECIMALS,
                      })
                    );
                  }}
                />
              </>
            )}
          </FlexGap>
        </Flex>

        <SimulateInputsWrapper>
          <InnerWrapper>
            <Column>
              <div className={grayLabel}>
                {isSell ? t("You sell") : t("You pay")}
                {balanceLabel}
              </div>
              <input
                className={inputAndOutputStyles + " bg-transparent leading-[32px]"}
                value={inputAmountString}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
              ></input>
            </Column>
            {isSell ? <EmojiInputLabel emoji={emojicoin} /> : <AptosInputLabel />}
          </InnerWrapper>

          <FlipInputsArrow
            onClick={() => {
              setInputAmount(outputAmount);
              setInputAmountString(outputAmountString);
              // This is done as to not display an old value if the swap simulation fails.
              setOutputAmount(0n);
              setPrevious(0n);
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
            inputAmount={inputAmount}
            marketAddress={marketAddress}
            isSell={isSell}
            setSubmit={setSubmit}
            // Disable the button if and only if the balance has been fetched and isn't sufficient *and*
            // the user is connected.
            disabled={!sufficientBalance && !isLoading && !!account}
            geoblocked={geoblocked}
            symbol={emojicoin}
          />
        </Row>
      </Column>
    </>
  );
}
