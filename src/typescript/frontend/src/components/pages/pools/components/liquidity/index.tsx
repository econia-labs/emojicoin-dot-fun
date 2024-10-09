"use client";

import React, { type PropsWithChildren, useEffect, useMemo, useState } from "react";
import { useThemeContext } from "context";
import { translationFunction } from "context/language-context";
import { Flex, Column, FlexGap } from "@containers";
import { Text, Button } from "components";
import { StyledAddLiquidityWrapper } from "./styled";
import { ProvideLiquidity, RemoveLiquidity } from "@sdk/emojicoin_dot_fun/emojicoin-dot-fun";
import { toCoinDecimalString } from "lib/utils/decimals";
import {
  AptosInputLabel,
  EmojiInputLabel,
} from "components/pages/emojicoin/components/trade-emojicoin/InputLabels";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { toActualCoinDecimals } from "lib/utils/decimals";
import { toCoinTypes } from "@sdk/markets/utils";
import ButtonWithConnectWalletFallback from "components/header/wallet-button/ConnectWalletButton";
import {
  useSimulateProvideLiquidity,
  useSimulateRemoveLiquidity,
} from "lib/hooks/queries/use-simulate-provide-liquidity";
import { Arrows } from "components/svg";
import type { EntryFunctionTransactionBuilder } from "@sdk/emojicoin_dot_fun/payload-builders";
import { useSearchParams } from "next/navigation";
import AnimatedStatusIndicator from "components/pages/launch-emojicoin/animated-status-indicator";
import { TypeTag } from "@aptos-labs/ts-sdk";
import Info from "components/info";
import { type AnyNumberString } from "@sdk/types/types";
import { type PoolsData } from "../../ClientPoolsPage";

type LiquidityProps = {
  market: PoolsData | undefined;
  geoblocked: boolean;
};

const fmtCoin = (n: AnyNumberString | undefined) => {
  if (n === undefined) {
    return n;
  }
  return new Intl.NumberFormat().format(Number(toCoinDecimalString(n, 8)));
};

const unfmtCoin = (n: AnyNumberString) => {
  return BigInt(
    toActualCoinDecimals({
      num: typeof n === "bigint" ? n : Number(n),
      decimals: 0,
    })
  );
};

const InnerWrapper = ({
  children,
  id,
  className,
}: PropsWithChildren<{ id: string; className?: string }>) => (
  <div
    id={id}
    className={
      `flex justify-between px-[18px] py-[7px] items-center ` +
      `h-[55px] md:items-stretch ` +
      className
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

const Liquidity: React.FC<LiquidityProps> = ({ market, geoblocked }) => {
  const { t } = translationFunction();
  const { theme } = useThemeContext();

  const searchParams = useSearchParams();
  const presetInputAmount =
    searchParams.get("add") !== null ? searchParams.get("add") : searchParams.get("remove");
  const presetInputAmountIsValid =
    presetInputAmount !== null &&
    presetInputAmount !== "" &&
    !Number.isNaN(Number(presetInputAmount));
  const [liquidity, setLiquidity] = useState<number | "">(
    searchParams.get("add") !== null && presetInputAmountIsValid ? Number(presetInputAmount) : ""
  );
  const [lp, setLP] = useState<number | "">(
    searchParams.get("remove") !== null && presetInputAmountIsValid ? Number(presetInputAmount) : ""
  );
  const [direction, setDirection] = useState<"add" | "remove">(
    searchParams.get("remove") !== null ? "remove" : "add"
  );

  const loadingComponent = useMemo(() => <AnimatedStatusIndicator numSquares={4} />, []);

  const {
    aptos,
    account,
    submit,
    aptBalance,
    refetchIfStale,
    setEmojicoinType,
    emojicoinBalance,
    emojicoinLPBalance,
  } = useAptos();

  const provideLiquidityResult = useSimulateProvideLiquidity({
    marketAddress: market?.market.marketAddress,
    quoteAmount: unfmtCoin(liquidity ?? 0),
  });

  const { emojicoin } = market ? toCoinTypes(market?.market.marketAddress) : { emojicoin: "" };

  const removeLiquidityResult = useSimulateRemoveLiquidity({
    marketAddress: market?.market.marketAddress,
    lpCoinAmount: unfmtCoin(lp ?? 0),
    typeTags: [emojicoin ?? ""],
  });

  const enoughApt =
    direction === "add"
      ? aptBalance !== undefined && aptBalance >= unfmtCoin(liquidity ?? 0)
      : true;
  const enoughEmoji =
    direction === "add"
      ? emojicoinBalance !== undefined &&
        emojicoinBalance >= BigInt(provideLiquidityResult?.base_amount ?? 0)
      : true;
  const enoughEmojiLP =
    direction === "remove"
      ? emojicoinLPBalance !== undefined && emojicoinLPBalance >= unfmtCoin(lp ?? 0)
      : true;

  useEffect(() => {
    if (emojicoin instanceof TypeTag) {
      setEmojicoinType(emojicoin);
    }
  }, [emojicoin, setEmojicoinType]);

  useEffect(() => {
    if (account) {
      refetchIfStale("apt");
    }
    if (market && account) {
      refetchIfStale("emojicoin");
      refetchIfStale("emojicoinLP");
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [market, account]);

  const isActionPossible =
    market !== undefined &&
    (direction === "add" ? liquidity !== "" : lp !== "") &&
    enoughApt &&
    enoughEmoji &&
    enoughEmojiLP;

  const balanceLabel = useMemo(() => {
    return ` (${t("Balance")}: `;
  }, [t]);

  const aptInput = (
    <InnerWrapper id="apt" className="liquidity-input">
      <Column>
        <div className={grayLabel}>
          {direction === "add" ? t("You deposit") : t("You get")}
          {balanceLabel}
          <span className={enoughApt ? "text-green" : "text-error"}>{fmtCoin(aptBalance)}</span>
          {")"}
        </div>
        <input
          className={inputAndOutputStyles + " bg-transparent leading-[32px]"}
          onChange={(e) => setLiquidity(e.target.value === "" ? "" : Number(e.target.value))}
          style={{
            color: direction === "remove" ? theme.colors.lightGray + "99" : "white",
          }}
          min={0}
          step={0.01}
          type={direction === "add" ? "number" : "text"}
          disabled={direction === "remove"}
          value={
            direction === "add"
              ? liquidity
              : (fmtCoin(removeLiquidityResult?.quote_amount) ?? "...")
          }
        ></input>
      </Column>
      <AptosInputLabel />
    </InnerWrapper>
  );

  const emojiInput = (
    <InnerWrapper id="emoji" className="liquidity-input">
      <Column>
        <div className={grayLabel}>
          {direction === "add" ? "You deposit" : "You get"}
          {balanceLabel}
          <span className={enoughEmoji ? "text-green" : "text-error"}>
            {fmtCoin(emojicoinBalance)}
          </span>
          {")"}
        </div>
        <input
          className={inputAndOutputStyles + " bg-transparent leading-[32px]"}
          style={{
            color: theme.colors.lightGray + "99",
          }}
          value={
            direction === "add"
              ? (fmtCoin(provideLiquidityResult?.base_amount) ?? "...")
              : (fmtCoin(removeLiquidityResult?.base_amount) ?? "...")
          }
          type="text"
          disabled
        ></input>
      </Column>
      <EmojiInputLabel emoji={market ? market.market.symbolData.symbol : "-"} />
    </InnerWrapper>
  );

  const emojiLPInput = (
    <InnerWrapper id="lp" className="liquidity-input">
      <Column>
        <div className={grayLabel}>
          {direction === "remove" ? "You deposit" : "You get"}
          {balanceLabel}
          <span className={enoughEmojiLP ? "text-green" : "text-error"}>
            {fmtCoin(emojicoinLPBalance)}
          </span>
          {")"}
        </div>
        <input
          className={inputAndOutputStyles + " bg-transparent leading-[32px]"}
          style={{
            color: direction === "add" ? theme.colors.lightGray + "99" : "white",
          }}
          value={
            direction === "add" ? (fmtCoin(provideLiquidityResult?.lp_coin_amount) ?? "...") : lp
          }
          type={direction === "add" ? "text" : "number"}
          onChange={(e) => setLP(e.target.value === "" ? "" : Number(e.target.value))}
          disabled={direction === "add"}
        ></input>
      </Column>
      <EmojiInputLabel emoji={market ? `${market.market.symbolData.symbol} LP` : "- LP"} />
    </InnerWrapper>
  );

  return (
    <Flex width="100%" justifyContent="center" p={{ _: "64px 17px", mobileM: "64px 33px" }}>
      <Column width="100%" maxWidth="414px" justifyContent="center">
        <Flex width="100%" justifyContent="space-between" alignItems="baseline">
          <FlexGap gap="10px" position="relative" justifyContent="left" alignItems="baseline">
            <Text textScale="heading1" textTransform="uppercase" mb="16px">
              {t(direction === "add" ? "Add liquidity" : "Remove liquidity")}
            </Text>

            <Info>
              <Text
                textScale="pixelHeading4"
                lineHeight="20px"
                color="black"
                textTransform="uppercase"
              >
                Liquidity providers receive a 0.25% fee from all trades, proportional to their pool
                share. Fees are continuously reinvested in the pool and can be claimed by
                withdrawing liquidity.
              </Text>
            </Info>
          </FlexGap>

          <button onClick={() => setDirection(direction === "add" ? "remove" : "add")}>
            <Arrows color="econiaBlue" />
          </button>
        </Flex>

        {direction === "add" ? (
          <StyledAddLiquidityWrapper>
            {aptInput}
            {emojiInput}
            {emojiLPInput}
          </StyledAddLiquidityWrapper>
        ) : (
          <StyledAddLiquidityWrapper>
            {emojiLPInput}
            {aptInput}
            {emojiInput}
          </StyledAddLiquidityWrapper>
        )}

        <Flex
          width="100%"
          justifyContent="center"
          mb={{ _: "17px", tablet: "37px" }}
          position="relative"
        >
          <ButtonWithConnectWalletFallback geoblocked={geoblocked}>
            <Button
              scale="lg"
              disabled={!isActionPossible}
              style={{ cursor: isActionPossible ? "pointer" : "not-allowed" }}
              onClick={async () => {
                if (!account) {
                  return;
                }
                const { emojicoin, emojicoinLP } = toCoinTypes(market!.market.marketAddress);
                let builderLambda: () => Promise<EntryFunctionTransactionBuilder>;
                if (direction === "add") {
                  builderLambda = () =>
                    ProvideLiquidity.builder({
                      aptosConfig: aptos.config,
                      provider: account.address,
                      marketAddress: market!.market.marketAddress,
                      quoteAmount: unfmtCoin(liquidity ?? 0),
                      typeTags: [emojicoin, emojicoinLP],
                      minLpCoinsOut: 1n,
                    });
                } else {
                  builderLambda = () =>
                    RemoveLiquidity.builder({
                      aptosConfig: aptos.config,
                      provider: account.address,
                      marketAddress: market!.market.marketAddress,
                      lpCoinAmount: unfmtCoin(lp),
                      typeTags: [emojicoin, emojicoinLP],
                      minQuoteOut: 1n,
                    });
                }
                await submit(builderLambda);
              }}
            >
              {t(direction === "add" ? "Add liquidity" : "Remove liquidity")}
            </Button>
          </ButtonWithConnectWalletFallback>
        </Flex>

        <Text textScale="heading1" textTransform="uppercase" mb="16px">
          {t("Reserves")}
        </Text>

        <StyledAddLiquidityWrapper>
          <Flex
            p={{ _: "10px 12px 7px 10px", tablet: "18px 25px 7px 25px" }}
            justifyContent="space-between"
            alignItems="center"
          >
            <AptosInputLabel />

            <Text textScale={{ _: "bodySmall", tablet: "bodyLarge" }} textTransform="uppercase">
              {market ? (fmtCoin(market.state.cpammRealReserves.quote) ?? loadingComponent) : "-"}
            </Text>
          </Flex>

          <Flex
            p={{ _: "0px 12px 10px 12px", tablet: "0px 25px 18px 25px" }}
            justifyContent="space-between"
            alignItems="center"
          >
            <EmojiInputLabel emoji={market ? market.market.symbolData.symbol : "-"} />

            <Text textScale={{ _: "bodySmall", tablet: "bodyLarge" }} textTransform="uppercase">
              {market ? (fmtCoin(market.state.cpammRealReserves.base) ?? loadingComponent) : "-"}
            </Text>
          </Flex>
        </StyledAddLiquidityWrapper>
      </Column>
    </Flex>
  );
};

export default Liquidity;
