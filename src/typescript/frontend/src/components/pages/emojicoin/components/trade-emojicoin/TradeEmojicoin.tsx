"use client";

import React, { useCallback, useEffect, useState } from "react";

import { Flex, Column } from "@containers";
import { Text, InputGroup, InputNumeric } from "components";

import { translationFunction } from "context/language-context";

import { StyledInputWrapper, StyledArrowWrapper, StyledInputContainer } from "./styled";
import { Arrow } from "components/svg";
import { type TradeEmojicoinProps } from "../../types";
import { toNominalPrice, toQuotePrice } from "@sdk/utils/nominal-price";
import { useSimulateSwap } from "lib/queries/client-api/simulate-swap";
import { fromCoinDecimals, toCoinDecimalString } from "lib/utils/decimals";
import { AptosInputLabel, EmojiInputLabel } from "./components/InputLabels";
import { type AnyNumber } from "@sdk/emojicoin_dot_fun/types";
import { SwapButton } from "./components/SwapButton";

const getInputDisplay = ({
  firstOrSecond,
  isSell,
  aptAmount = 0n,
  emojiAmount = 0n,
}: {
  firstOrSecond: "first" | "second";
  isSell: boolean;
  aptAmount?: AnyNumber;
  emojiAmount?: AnyNumber;
}) => {
  // For the first input:
  // If it's a sell, the first input is the emojicoin amount.
  // If it's a buy, the first input is the APT amount.
  if (firstOrSecond === "first") {
    if (isSell) {
      return Number(toCoinDecimalString(emojiAmount, 10));
    }
    return Number(toCoinDecimalString(aptAmount, 10));
  }
  // For the second input:
  // If it's a sell, the second input is the APT amount.
  // If it's a buy, the second input is the emojicoin amount.
  if (isSell) {
    return Number(toCoinDecimalString(aptAmount, 10));
  }
  return Number(toCoinDecimalString(emojiAmount, 10));
};

const TradeEmojicoin = (props: TradeEmojicoinProps) => {
  const [isSell, setIsSell] = useState(true);
  const { t } = translationFunction();
  const [inputAmount, setInputAmount] = useState<bigint>(fromCoinDecimals("10000"));
  const { emojiAmount, aptAmount, simulatedSwap } = useSimulateSwap({
    marketAddress: props.data.marketAddress,
    // After the first query, we can use the input amount to simulate the swap.
    // But initially, we must use the default display amount, converted to the correct decimals.
    inputAmount,
    isSell,
    numSwaps: props.data.numSwaps,
  });

  useEffect(() => {
    if (!simulatedSwap) {
      return;
    }
    const price = simulatedSwap.avgExecutionPrice;
    const base = toNominalPrice(price);
    const quote = toQuotePrice(price);
    setBasePrice(base);
    setQuotePrice(quote);
  }, [simulatedSwap]);

  const [basePrice, setBasePrice] = useState(
    toNominalPrice(simulatedSwap?.avgExecutionPrice ?? inputAmount.toString())
  );
  const [_quotePrice, setQuotePrice] = useState(toQuotePrice(basePrice));

  const handleInputAmount = useCallback((n: string) => {
    setInputAmount(fromCoinDecimals(n));
  }, []);

  const switchHandler = useCallback(
    (isSell: boolean) => {
      if (!aptAmount || !emojiAmount) {
        return;
      }
      // We need to set the input amount to the current output amount (the second input).
      // Thus if it's a sell *becoming* a buy, we flip the input amount to the APT amount,
      // and if it's a buy *becoming* a sell, we flip the input amount to the emojicoin amount.
      const amt = isSell ? aptAmount : emojiAmount;
      // TODO: Fix the rounding errors when converting back and forth here.
      setInputAmount(amt);
      setIsSell((val) => !val);
    },
    [aptAmount, emojiAmount]
  );

  return (
    <Column width="100%" maxWidth="414px" height="100%" justifyContent="center">
      <Text
        textScale={{ _: "heading2", tablet: "heading1" }}
        color="white"
        textTransform="uppercase"
        pb="17px"
      >
        {t("Trade Emojicoin")}
      </Text>

      <StyledInputContainer isForce={isSell}>
        <StyledInputWrapper>
          <Column>
            <Text
              textScale="pixelHeading4"
              mb="-6px"
              color="lightGray"
              lineHeight="20px"
              textTransform="uppercase"
            >
              {isSell ? t("You sell") : t("You pay")}
            </Text>

            {/* Keep in mind, this is the INPUT amount, meaning the user is
                either paying in APT or selling emojicoin. */}
            <InputGroup isShowError={false} height="22px" scale="sm">
              <InputNumeric
                borderColor="transparent"
                p="0px !important"
                disabled={false}
                onUserInput={(n: string) => handleInputAmount(n)}
                value={getInputDisplay({ firstOrSecond: "first", isSell, aptAmount, emojiAmount })}
                style={{
                  color: "white",
                }}
              />
            </InputGroup>
          </Column>

          {isSell ? <EmojiInputLabel emoji={props.data.emoji} /> : <AptosInputLabel />}
        </StyledInputWrapper>

        <StyledArrowWrapper onClick={() => switchHandler(isSell)}>
          <Arrow width="18px" rotate={isSell ? "90deg" : "-90deg"} color="lightGray" />
        </StyledArrowWrapper>

        <StyledInputWrapper>
          <Column>
            <Text
              textScale="pixelHeading4"
              mb="-6px"
              color="lightGray"
              lineHeight="20px"
              textTransform="uppercase"
            >
              {t("You receive")}
            </Text>

            <InputGroup isShowError={false} height="22px" scale="sm">
              <InputNumeric
                borderColor="transparent"
                p="0px !important"
                disabled={true}
                onUserInput={() => {}}
                value={getInputDisplay({ firstOrSecond: "second", isSell, aptAmount, emojiAmount })}
                style={{
                  color: "white",
                }}
              />
            </InputGroup>
          </Column>
          {isSell ? <AptosInputLabel /> : <EmojiInputLabel emoji={props.data.emoji} />}
        </StyledInputWrapper>
      </StyledInputContainer>

      <Flex justifyContent="center" mt="14px">
        <SwapButton
          inputAmount={inputAmount}
          marketAddress={props.data.marketAddress}
          isSell={isSell}
        />
      </Flex>
    </Column>
  );
};

export default TradeEmojicoin;
