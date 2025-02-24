"use client";

import { useEffect, useState, useMemo } from "react";
import { type SwapComponentProps } from "components/pages/emojicoin/types";
import { toActualCoinDecimals, toDisplayCoinDecimals } from "lib/utils/decimals";
import { useGetGasWithDefault } from "lib/hooks/queries/use-simulate-swap";
import { useEventStore } from "context/event-store-context";
import { useSearchParams } from "next/navigation";
import { translationFunction } from "context/language-context";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { toCoinTypes } from "@sdk/markets/utils";
import { getMaxSlippageSettings } from "utils/slippage";
import { useCalculateSwapPrice } from "lib/hooks/use-calculate-swap-price";
import { FormattedNumber } from "components/FormattedNumber";
import styled from "styled-components";
import { StyledImage } from "components/image/styled";
import Link from "next/link";
import { SwapButtonV2 } from "./SwapButtonV2";
import { InputNumeric } from "components/inputs";

const BalanceContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.25rem;
`;

const BalanceInfo = styled.div`
  h6 {
    font-size: 0.875rem;
    font-weight: 500;
    color: white;
  }

  h4 {
    font-size: 1.25rem;
    margin-top: 4px;
    font-weight: normal !important;
    color: white;
    margin-bottom: 0.5rem;

    @media (min-width: 768px) {
      font-size: 1.5rem;
      margin-bottom: 0;
    }
  }
`;

const DetailBox = styled.div`
  display: flex;
  text-align: center;
  margin-bottom: 1.25rem;
`;

const MatchBox = styled.div`
  background: rgba(255, 255, 255, 0.1);
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: between;
  margin-right: 0.75rem;

  h6 {
    color: white;
    font-size: 1.125rem;
    font-weight: 500;
  }
`;

const GreenpeaceText = styled.p`
  font-size: 1.25rem;
  color: white;
  text-align: center;
  margin-bottom: 1.25rem;
  font-family: Lora;
  font-weight: 400;
  line-height: 16.13px;
  letter-spacing: 0%;
`;

const inputAndOutputStyles = `
  block text-[16px] font-normal h-[32px] outline-none w-full
  font-forma
  border-transparent !p-0 text-white
`;

const OUTPUT_DISPLAY_DECIMALS = 4;

export default function SwapComponentV2({
  emojicoin,
  marketAddress,
  marketEmojis,
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
  const [inputAmount, setInputAmount] = useState(
    toActualCoinDecimals({ num: presetInputAmountIsValid ? presetInputAmount! : "1" })
  );
  const [outputAmount, setOutputAmount] = useState(0n);
  const [previous, setPrevious] = useState(inputAmount);
  const [isLoading, setIsLoading] = useState(false);
  const [isSell, setIsSell] = useState(!(searchParams.get("sell") === null));
  const [submit, setSubmit] = useState<(() => Promise<void>) | null>(null);
  const { aptBalance, emojicoinBalance, account, setEmojicoinType } = useAptos();

  const maxSlippage = getMaxSlippageSettings().maxSlippage;
  const minOutputAmount =
    outputAmount - (outputAmount * maxSlippage) / 10000n > 0n
      ? outputAmount - (outputAmount * maxSlippage) / 10000n
      : 1n;

  const numSwaps = useEventStore(
    (s) => s.getMarket(marketEmojis)?.swapEvents.length ?? initNumSwaps
  );

  const lastSwapEvent = useEventStore((s) => s.getMarket(marketEmojis)?.swapEvents?.at(0));

  const gasCost = useGetGasWithDefault({ marketAddress, inputAmount, isSell, numSwaps });

  const { netProceeds, error } = useCalculateSwapPrice({
    lastSwapEvent,
    isSell,
    inputAmount,
    userEmojicoinBalance: emojicoinBalance,
  });

  useEffect(() => {
    const emojicoinType = toCoinTypes(marketAddress).emojicoin.toString();
    setEmojicoinType(emojicoinType);
  }, [marketAddress, setEmojicoinType]);

  // const availableAptBalance = useMemo(
  //   () => (aptBalance - gasCost > 0 ? aptBalance - gasCost : 0n),
  //   [gasCost, aptBalance]
  // );

  useEffect(() => {
    if (netProceeds === 0n || error) {
      setIsLoading(true);
      return;
    }
    setPrevious(netProceeds);
    setOutputAmount(netProceeds);
    setIsLoading(false);
  }, [netProceeds, isSell, error]);

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
    const coinBalance = isSell ? emojicoinBalance : aptBalance;
    const balance = toDisplayCoinDecimals({
      num: coinBalance,
      decimals: 4,
    });
    return (
      <span>{balance}</span>
    );
  }, [isSell, aptBalance, emojicoinBalance]);



  return (
    <div className="mx-auto w-full">
      <BalanceContainer>
        <StyledImage className="mr-3" src="/images/coin/Aptos_White 2.png" />
        <BalanceInfo>
          <h6>Your balance</h6>
          <h4>
            {/* <FormattedNumber value={availableAptBalance} scramble /> */}
            {balanceLabel} APT
          </h4>
        </BalanceInfo>
      </BalanceContainer>
      <DetailBox>
        <MatchBox className="match_box w-full px-4 py-2 rounded-full justify-between flex items-center mr-3 sm-mb-5">
          <h6 className="text-lg font-medium text-white text-center w-full">
            {isSell ? t("You Deposit") : t("You Pay")} <br />
            <InputNumeric
              className={inputAndOutputStyles + " bg-transparent leading-[32px] w-full text-center"}
              value={inputAmount}
              onUserInput={(v) => setInputAmount(v)}
              onSubmit={() => (submit ? submit() : {})}
              decimals={8}
            />
          </h6>
          <StyledImage src="/images/coin/Aptos_White 1.png" />
        </MatchBox>
        <MatchBox
          className="match_box w-max-content self-center px-4 py-2 rounded-full justify-between flex items-center mr-3 sm-mb-5"
          onClick={() => {
            setInputAmount(outputAmount);
            setOutputAmount(inputAmount);
            setPrevious(inputAmount);
            setIsSell((v) => !v);
          }}
        >
          <Link href="#">
            <StyledImage src="/images/coin/up-arrow.png" />
          </Link>
          <Link href="#">
            <StyledImage src="/images/coin/down-arrow.png" />
          </Link>
        </MatchBox>

        <MatchBox
          className="match_box w-full px-4 py-2 rounded-full justify-between flex items-center sm-mb-5 cursor-pointer"
          onClick={() => setIsSell((v) => !v)}
        >
          <h6 className="text-lg font-medium text-white text-center w-full">
            You Receive: <br />
            <FormattedNumber
              value={isLoading ? previous : outputAmount}
              nominalize
              scramble
              decimals={OUTPUT_DISPLAY_DECIMALS}
            />
          </h6>
        </MatchBox>
      </DetailBox>
      <GreenpeaceText>Greenpeace Receives: 0.1</GreenpeaceText>
      <div className="w-full flex justify-center sm-mb-5 z-10">
        <SwapButtonV2
          inputAmount={inputAmount}
          marketAddress={marketAddress}
          isSell={isSell}
          setSubmit={setSubmit}
          // Disable the button if and only if the balance has been fetched and isn't sufficient *and*
          // the user is connected.
          disabled={!sufficientBalance && !isLoading && !!account}
          symbol={emojicoin}
          minOutputAmount={minOutputAmount}
        />
      </div>
    </div>
  );
}
