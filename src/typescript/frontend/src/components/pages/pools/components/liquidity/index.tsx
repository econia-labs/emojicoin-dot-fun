"use client";

import React, { type PropsWithChildren, useEffect, useMemo, useState } from "react";
import { translationFunction } from "context/language-context";
import { Flex, Column, FlexGap } from "@containers";
import { Text, Button, InputNumeric } from "components";
import { StyledAddLiquidityWrapper } from "./styled";
import { ProvideLiquidity, RemoveLiquidity } from "@/contract-apis/emojicoin-dot-fun";
import {
  AptosInputLabel,
  EmojiInputLabel,
  EmojiInputLabelStyles,
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
import { useSearchParams } from "next/navigation";
import { TypeTag } from "@aptos-labs/ts-sdk";
import Info from "components/info";
import { type PoolsData } from "../../ClientPoolsPage";
import { EmojiPill } from "components/EmojiPill";
import { FormattedNumber } from "components/FormattedNumber";
import { useMatchBreakpoints } from "@hooks/index";
import { useTransactionBuilder } from "lib/hooks/use-transaction-builder";
import { doNotCallThisFunctionDirectly_serverSideLog } from "lib/utils/server-logs/log-to-server";
import { serverLog } from "lib/utils/server-logs/wrapper";

type LiquidityProps = {
  market: PoolsData | undefined;
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
  md:pixel-heading-4 mb-[-6px] text-light-gray !leading-5 uppercase
`;

const inputAndOutputStyles = `
  block text-[16px] font-normal h-[32px] outline-none w-full
  font-forma
  border-transparent !p-0 text-white
`;

const Liquidity = ({ market }: LiquidityProps) => {
  const { t } = translationFunction();

  const { isMobile } = useMatchBreakpoints();

  const searchParams = useSearchParams();

  const presetInputAmount =
    searchParams.get("add") !== null ? searchParams.get("add") : searchParams.get("remove");
  const presetInputAmountIsValid =
    presetInputAmount !== null &&
    presetInputAmount !== "" &&
    !Number.isNaN(Number(presetInputAmount));

  const [liquidity, setLiquidity] = useState<bigint>(
    toActualCoinDecimals({
      num: searchParams.get("add") !== null && presetInputAmountIsValid ? presetInputAmount! : "1",
    })
  );

  const [lp, setLP] = useState<bigint>(
    toActualCoinDecimals({
      num:
        searchParams.get("remove") !== null && presetInputAmountIsValid ? presetInputAmount! : "1",
    })
  );

  const [direction, setDirection] = useState<"add" | "remove">(
    searchParams.get("remove") !== null ? "remove" : "add"
  );

  const {
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
    quoteAmount: liquidity ?? 0n,
  });

  const { emojicoin } = market ? toCoinTypes(market?.market.marketAddress) : { emojicoin: "" };

  const removeLiquidityResult = useSimulateRemoveLiquidity({
    marketAddress: market?.market.marketAddress,
    lpCoinAmount: lp ?? 0n,
    typeTags: [emojicoin ?? ""],
  });

  const enoughApt =
    direction === "add" ? aptBalance !== undefined && aptBalance >= (liquidity ?? 0n) : true;
  const enoughEmoji =
    direction === "add"
      ? emojicoinBalance !== undefined &&
        emojicoinBalance >= BigInt(provideLiquidityResult?.base_amount ?? 0n)
      : true;
  const enoughEmojiLP =
    direction === "remove"
      ? emojicoinLPBalance !== undefined && emojicoinLPBalance >= (lp ?? 0n)
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
    (direction === "add" ? liquidity !== 0n : lp !== 0n) &&
    enoughApt &&
    enoughEmoji &&
    enoughEmojiLP;

  const balanceLabel = useMemo(() => {
    return ` (${t("Balance")}: `;
  }, [t]);

  const { memoizedArgs, ProvideOrRemove } = useMemo(() => {
    const ProvideOrRemove = direction === "add" ? ProvideLiquidity : RemoveLiquidity;
    if (!account || !market?.market.marketAddress) {
      return {
        memoizedArgs: null,
        ProvideOrRemove,
      };
    }
    const marketAddress = market.market.marketAddress;
    const { emojicoin, emojicoinLP } = toCoinTypes(marketAddress);
    serverLog({
      provider: account.address,
      marketAddress,
      quoteAmount: direction === "add" ? liquidity : lp,
      typeTags: [emojicoin, emojicoinLP] as [TypeTag, TypeTag],
      minLpCoinsOut: 1n,
      minQuoteOut: 1n,
    });
    return {
      ProvideOrRemove,
      memoizedArgs: {
        provider: account.address,
        marketAddress,
        quoteAmount: direction === "add" ? liquidity : lp,
        typeTags: [emojicoin, emojicoinLP] as [TypeTag, TypeTag],
        minLpCoinsOut: 1n,
        minQuoteOut: 1n,
      },
    };
  }, [account, direction, liquidity, lp, market?.market.marketAddress]);

  const transactionBuilder = useTransactionBuilder(memoizedArgs, ProvideOrRemove);

  const aptInput = (
    <InnerWrapper id="apt" className="liquidity-input">
      <Column>
        <div className={grayLabel}>
          <span className="text-nowrap">
            {direction === "add" ? t("You deposit") : t("You get")}
            {balanceLabel}
          </span>
          <FormattedNumber
            value={aptBalance}
            className={enoughApt ? "text-green" : "text-error"}
            nominalize
            decimals={3}
          />
          {")"}
        </div>
        {direction === "add" ? (
          <InputNumeric
            className={inputAndOutputStyles + " bg-transparent leading-[32px] text-white"}
            onUserInput={(e) => setLiquidity(e)}
            value={liquidity}
            decimals={8}
          />
        ) : (
          <FormattedNumber
            value={BigInt(removeLiquidityResult?.quote_amount ?? 0)}
            decimals={3}
            className={inputAndOutputStyles + " bg-transparent leading-[32px] text-medium-gray"}
            nominalize
          />
        )}
      </Column>
      <AptosInputLabel />
    </InnerWrapper>
  );

  const emojiInput = (
    <InnerWrapper id="emoji" className="liquidity-input">
      <Column>
        <div className={grayLabel}>
          <span className="text-nowrap">
            {direction === "add" ? "You deposit" : "You get"}
            {balanceLabel}
          </span>
          <FormattedNumber
            value={emojicoinBalance}
            className={enoughEmoji ? "text-green" : "text-error"}
            nominalize
            decimals={3}
          />
          {")"}
        </div>
        <FormattedNumber
          value={BigInt(
            (direction === "add"
              ? provideLiquidityResult?.base_amount
              : removeLiquidityResult?.base_amount) ?? 0
          )}
          decimals={3}
          className={inputAndOutputStyles + ` bg-transparent leading-[32px] !text-light-gray/[.6]`}
          nominalize
        />
      </Column>
      <div>
        <EmojiInputLabel emoji={market ? market.market.symbolData.symbol : "-"} />
        <span className={EmojiInputLabelStyles}>{market ? "" : "-"}</span>
      </div>
    </InnerWrapper>
  );

  const emojiLPInput = (
    <InnerWrapper id="lp" className="liquidity-input">
      <Column>
        <div className={grayLabel}>
          <span className="text-nowrap">
            {direction === "remove" ? "You deposit" : "You get"}
            {balanceLabel}
          </span>
          <FormattedNumber
            value={emojicoinLPBalance}
            className={enoughEmojiLP ? "text-green" : "text-error"}
            nominalize
            decimals={3}
          />
          {")"}
        </div>
        {direction === "add" ? (
          <FormattedNumber
            value={BigInt(provideLiquidityResult?.lp_coin_amount ?? 0)}
            decimals={3}
            className={inputAndOutputStyles + " bg-transparent leading-[32px] text-medium-gray"}
            nominalize
          />
        ) : (
          <InputNumeric
            className={inputAndOutputStyles + " bg-transparent leading-[32px] text-white"}
            onUserInput={(e) => setLP(e)}
            value={lp}
            decimals={8}
          />
        )}
      </Column>
      <div className="text-nowrap">
        <EmojiInputLabel emoji={market ? `${market.market.symbolData.symbol}` : ""} />
        <span className={EmojiInputLabelStyles}>{market ? " LP" : "-"}</span>
      </div>
    </InnerWrapper>
  );

  return (
    <Flex width="100%" justifyContent="center" p={{ _: "64px 17px", mobileM: "64px 33px" }}>
      <Column width="100%" maxWidth="414px" justifyContent="center">
        <Flex width="100%" justifyContent="space-between" alignItems="center" mb="10px">
          <Flex flexDirection="row">
            <FlexGap gap="10px" position="relative" justifyContent="left" alignItems="center">
              <button
                onClick={() => setDirection(direction === "add" ? "remove" : "add")}
                className="absolute left-[-30px]"
              >
                <Arrows color="econiaBlue" />
              </button>

              <Text
                textScale={isMobile ? "heading2" : "heading1"}
                textTransform="uppercase"
                className={isMobile ? "w-min" : ""}
              >
                {t(direction === "add" ? "Add liquidity" : "Remove liquidity")}
              </Text>

              <Info>
                Liquidity providers receive a 0.25% fee from all trades, proportional to their pool
                share. Fees are continuously reinvested in the pool and can be claimed by
                withdrawing liquidity.
              </Info>
            </FlexGap>
          </Flex>
          <FlexGap flexDirection="row" gap="5px">
            {direction === "add" ? (
              <>
                <EmojiPill
                  emoji={"waxing crescent moon"}
                  description="Deposit 25%"
                  onClick={() => {
                    setLiquidity(aptBalance / 4n);
                  }}
                />
                <EmojiPill
                  emoji={"first quarter moon"}
                  description="Deposit 50%"
                  onClick={() => {
                    setLiquidity(aptBalance / 2n);
                  }}
                />
                <EmojiPill
                  emoji={"full moon"}
                  description="Deposit 100%"
                  onClick={() => {
                    setLiquidity(aptBalance);
                  }}
                />
              </>
            ) : (
              <>
                <EmojiPill
                  emoji="nauseated face"
                  description="Withdraw 50%"
                  onClick={() => {
                    setLP(emojicoinLPBalance / 2n);
                  }}
                />
                <EmojiPill
                  emoji="face vomiting"
                  description="Withdraw 100%"
                  onClick={() => {
                    setLP(emojicoinLPBalance);
                  }}
                />
              </>
            )}
          </FlexGap>
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
          <ButtonWithConnectWalletFallback>
            <Button
              scale="lg"
              disabled={!isActionPossible}
              style={{ cursor: isActionPossible ? "pointer" : "not-allowed" }}
              onClick={async () => {
                await submit(transactionBuilder);
              }}
            >
              {t(direction === "add" ? "Add liquidity" : "Remove liquidity")}
            </Button>
          </ButtonWithConnectWalletFallback>
        </Flex>

        <Text textScale={isMobile ? "heading2" : "heading1"} textTransform="uppercase" mb="16px">
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
              {market ? (
                <FormattedNumber
                  value={market.state.cpammRealReserves.quote}
                  nominalize
                  decimals={3}
                />
              ) : (
                "-"
              )}
            </Text>
          </Flex>

          <Flex
            p={{ _: "0px 12px 10px 12px", tablet: "0px 25px 18px 25px" }}
            justifyContent="space-between"
            alignItems="center"
          >
            <EmojiInputLabel emoji={market ? market.market.symbolData.symbol : "-"} />

            <Text textScale={{ _: "bodySmall", tablet: "bodyLarge" }} textTransform="uppercase">
              {market ? (
                <FormattedNumber
                  value={market.state.cpammRealReserves.base}
                  nominalize
                  decimals={3}
                />
              ) : (
                "-"
              )}
            </Text>
          </Flex>
        </StyledAddLiquidityWrapper>
      </Column>
    </Flex>
  );
};

export default Liquidity;
