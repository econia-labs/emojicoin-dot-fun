"use client";

import React, { type PropsWithChildren, useEffect, useState } from "react";

import { useThemeContext } from "context";
import { translationFunction } from "context/language-context";

import { Flex, Column } from "@containers";
import { Text, Button, Prompt } from "components";

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
import type { FetchSortedMarketDataReturn } from "lib/queries/sorting/market-data";
import { Arrows } from "components/svg";
import { COIN_FACTORY_MODULE_NAME } from "@sdk/const";
import type { EntryFunctionTransactionBuilder } from "@sdk/emojicoin_dot_fun/payload-builders";

type LiquidityProps = {
  market: FetchSortedMarketDataReturn["markets"][0] | undefined;
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

const Liquidity: React.FC<LiquidityProps> = ({ market }) => {
  const { t } = translationFunction();
  const { theme } = useThemeContext();

  const [liquidity, setLiquidity] = useState<number | "">("");
  const [lp, setLP] = useState<number | "">("");
  const [aptBalance, setAptBalance] = useState<number>();
  const [emojiBalance, setEmojiBalance] = useState<number>();
  const [emojiLPBalance, setEmojiLPBalance] = useState<number>();
  const [direction, setDirection] = useState<"add" | "remove">("add");

  const { aptos, account, submit } = useAptos();

  const provideLiquidityResult = useSimulateProvideLiquidity({
    marketAddress: market?.marketAddress,
    quoteAmount: toActualCoinDecimals({ num: liquidity ?? 0, decimals: 0 }),
  });

  const { emojicoin } = market ? toCoinTypes(market?.marketAddress) : { emojicoin: "" };

  const removeLiquidityResult = useSimulateRemoveLiquidity({
    marketAddress: market?.marketAddress,
    lpCoinAmount: toActualCoinDecimals({ num: lp ?? 0, decimals: 0 }),
    typeTags: [emojicoin ?? ""],
  });

  const enoughAssets = (apt: number, emoji: number) =>
    aptBalance && emojiBalance && apt <= aptBalance && emoji <= emojiBalance;

  let tooltipText = "";
  const hasEnoughApt =
    (typeof liquidity === "string"
      ? 0
      : Number(toActualCoinDecimals({ num: liquidity, decimals: 0 }))) <= (aptBalance ?? 0);
  const hasEnoughEmoji = (Number(provideLiquidityResult?.base_amount) ?? 0) <= (emojiBalance ?? 0);
  const hasEnoughEmojiLP =
    (typeof lp === "string" ? 0 : Number(toActualCoinDecimals({ num: lp, decimals: 0 }))) <=
    (emojiLPBalance ?? 0);
  if (direction === "add") {
    if (!hasEnoughApt && !hasEnoughEmoji) {
      tooltipText =
        `Not enough APT and ${market?.symbol}. ` +
        `You need ${liquidity} APT and ` +
        `${toCoinDecimalString(BigInt(provideLiquidityResult?.base_amount ?? "0"), 4)} ${market?.symbol} ` +
        `but you only have ` +
        `${toCoinDecimalString(BigInt(aptBalance ?? "0"), 4)} APT and ` +
        `${toCoinDecimalString(BigInt(emojiBalance ?? "0"), 4)} ${market?.symbol}.`;
    } else if (!hasEnoughApt) {
      tooltipText =
        `Not enough APT. ` +
        `You need ${liquidity} APT ` +
        `but you only have ` +
        `${toCoinDecimalString(BigInt(aptBalance ?? "0"), 4)} APT.`;
    } else if (!hasEnoughEmoji) {
      tooltipText =
        `Not enough ${market?.symbol}. ` +
        `You need ${toCoinDecimalString(BigInt(provideLiquidityResult?.base_amount ?? "0"), 4)} ${market?.symbol} ` +
        `but you only have ` +
        `${toCoinDecimalString(BigInt(emojiBalance ?? "0"), 4)} ${market?.symbol}.`;
    }
  } else if (!hasEnoughEmojiLP) {
    tooltipText =
      `Not enough ${market?.symbol} LP. ` +
      `You need ${lp} ${market?.symbol} LP ` +
      `but you only have ` +
      `${toCoinDecimalString(BigInt(emojiLPBalance ?? "0"), 4)} ${market?.symbol} LP.`;
  }

  useEffect(() => {
    if (market && account) {
      const emojicoin = `${market.marketAddress.toString()}::${COIN_FACTORY_MODULE_NAME}::Emojicoin`;
      const emojicoinLP = `${market.marketAddress.toString()}::${COIN_FACTORY_MODULE_NAME}::EmojicoinLP`;
      const aptosBalance = aptos.view({
        payload: {
          function: "0x1::coin::balance",
          typeArguments: ["0x1::aptos_coin::AptosCoin"],
          functionArguments: [account?.address],
        },
      });
      const emojicoinBalance = aptos.view({
        payload: {
          function: "0x1::coin::balance",
          typeArguments: [emojicoin],
          functionArguments: [account?.address],
        },
      });
      const emojicoinLPBalance = aptos.view({
        payload: {
          function: "0x1::coin::balance",
          typeArguments: [emojicoinLP],
          functionArguments: [account?.address],
        },
      });
      Promise.all([aptosBalance, emojicoinBalance, emojicoinLPBalance]).then(
        ([apt, emojicoin, emojicoinLP]) => {
          if (apt[0] && emojicoin[0] && emojicoinLP[0]) {
            setEmojiBalance(Number(emojicoin[0].toString()));
            setAptBalance(Number(apt[0].toString()));
            setEmojiLPBalance(Number(emojicoinLP[0].toString()));
          }
        }
      );
    }
  }, [market, account, aptos]);

  useEffect(() => {
    setLP("");
    setLiquidity("");
  }, [direction]);

  const aptInput = (
    <InnerWrapper id="apt" className="liquidity-input">
      <Column>
        <div className={grayLabel}>{direction === "add" ? "You deposit" : "You get"}</div>
        <input
          className={inputAndOutputStyles + " bg-transparent leading-[32px]"}
          onChange={(e) => setLiquidity(e.target.value === "" ? "" : Number(e.target.value))}
          style={{
            color: direction === "remove" ? theme.colors.lightGray + "99" : "white",
          }}
          min={0}
          step={0.01}
          type="number"
          disabled={direction === "remove"}
          value={
            direction === "add"
              ? liquidity
              : toCoinDecimalString(BigInt(removeLiquidityResult?.quote_amount ?? "0"), 4)
          }
        ></input>
      </Column>
      <AptosInputLabel />
    </InnerWrapper>
  );

  const emojiInput = (
    <InnerWrapper id="emoji" className="liquidity-input">
      <Column>
        <div className={grayLabel}>{direction === "add" ? "You deposit" : "You get"}</div>
        <input
          className={inputAndOutputStyles + " bg-transparent leading-[32px]"}
          style={{
            color: theme.colors.lightGray + "99",
          }}
          value={
            direction === "add"
              ? toCoinDecimalString(BigInt(provideLiquidityResult?.base_amount ?? "0"), 4)
              : toCoinDecimalString(BigInt(removeLiquidityResult?.base_amount ?? "0"), 4)
          }
          type="number"
          disabled
        ></input>
      </Column>
      <EmojiInputLabel emoji={market ? market.symbol : "-"} />
    </InnerWrapper>
  );

  const emojiLPInput = (
    <InnerWrapper id="lp" className="liquidity-input">
      <Column>
        <div className={grayLabel}>{direction === "remove" ? "You deposit" : "You get"}</div>
        <input
          className={inputAndOutputStyles + " bg-transparent leading-[32px]"}
          style={{
            color: direction === "add" ? theme.colors.lightGray + "99" : "white",
          }}
          value={
            direction === "add"
              ? toCoinDecimalString(BigInt(provideLiquidityResult?.lp_coin_amount ?? "0"), 4)
              : lp
          }
          type="number"
          onChange={(e) => setLP(e.target.value === "" ? "" : Number(e.target.value))}
          disabled={direction === "add"}
        ></input>
      </Column>
      <EmojiInputLabel emoji={market ? `${market.symbol} LP` : "- LP"} />
    </InnerWrapper>
  );

  return (
    <Flex width="100%" justifyContent="center" p={{ _: "64px 17px", mobileM: "64px 33px" }}>
      <Column width="100%" maxWidth="414px" justifyContent="center">
        <Flex width="100%" justifyContent="space-between" alignItems="baseline">
          <Text textScale="heading1" textTransform="uppercase" mb="16px">
            {t(direction === "add" ? "Add liquidity" : "Remove liquidity")}
          </Text>

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
          <Prompt text="Liquidity providers receive a 0.25% fee from all trades, proportional to their pool share. Fees are continuously reinvested in the pool and can be claimed by withdrawing liquidity." />

          <ButtonWithConnectWalletFallback>
            <Button
              scale="lg"
              disabled={
                (market ? false : true) ||
                !(direction === "add" ? liquidity !== "" : lp !== "") ||
                !(direction === "add"
                  ? provideLiquidityResult
                    ? enoughAssets(
                        Number(
                          toActualCoinDecimals({
                            num: Number(liquidity),
                            decimals: 0,
                          })
                        ),
                        Number(provideLiquidityResult.base_amount)
                      )
                    : false
                  : (Number(
                      toActualCoinDecimals({
                        num: Number(lp),
                        decimals: 0,
                      })
                    ) <= (emojiLPBalance ?? 0)))
              }
              onClick={async () => {
                if (!account) {
                  return;
                }
                const { emojicoin, emojicoinLP } = toCoinTypes(market!.marketAddress);
                let builderLambda: () => Promise<EntryFunctionTransactionBuilder>;
                if (direction === "add") {
                  builderLambda = () =>
                    ProvideLiquidity.builder({
                      aptosConfig: aptos.config,
                      provider: account.address,
                      marketAddress: market!.marketAddress,
                      quoteAmount: BigInt(toActualCoinDecimals({ num: liquidity, decimals: 0 })),
                      typeTags: [emojicoin, emojicoinLP],
                    });
                } else {
                  builderLambda = () =>
                    RemoveLiquidity.builder({
                      aptosConfig: aptos.config,
                      provider: account.address,
                      marketAddress: market!.marketAddress,
                      lpCoinAmount: BigInt(toActualCoinDecimals({ num: lp, decimals: 0 })),
                      typeTags: [emojicoin, emojicoinLP],
                    });
                }
                await submit(builderLambda);
              }}
            >
              {t(direction === "add" ? "Add liquidity" : "Remove liquidity")}
            </Button>
            {tooltipText !== "" && <Prompt top={false} text={tooltipText} close={false} />}
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
              {market ? toCoinDecimalString(market.cpammRealReservesQuote, 2) : "-"}
            </Text>
          </Flex>

          <Flex
            p={{ _: "0px 12px 10px 12px", tablet: "0px 25px 18px 25px" }}
            justifyContent="space-between"
            alignItems="center"
          >
            <EmojiInputLabel emoji={market ? market.symbol : "-"} />

            <Text textScale={{ _: "bodySmall", tablet: "bodyLarge" }} textTransform="uppercase">
              {market ? toCoinDecimalString(market.cpammRealReservesBase, 2) : "-"}
            </Text>
          </Flex>
        </StyledAddLiquidityWrapper>
      </Column>
    </Flex>
  );
};

export default Liquidity;
