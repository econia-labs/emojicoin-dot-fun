"use client";

import React, { type PropsWithChildren, useEffect, useState } from "react";
import Image from "next/image";

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
import info from "../../../../../../public/images/infoicon.svg";
import { useSearchParams } from "next/navigation";

type LiquidityProps = {
  market: FetchSortedMarketDataReturn["markets"][0] | undefined;
};

const fmtCoin = (n: number | bigint | string | undefined) => {
  if (n === undefined) {
    return n;
  }
  return new Intl.NumberFormat().format(Number(toCoinDecimalString(BigInt(n), 8)));
};

const unfmtCoin = (n: number | bigint | string) => {
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

const Liquidity: React.FC<LiquidityProps> = ({ market }) => {
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
  const [aptBalance, setAptBalance] = useState<bigint>();
  const [emojiBalance, setEmojiBalance] = useState<bigint>();
  const [emojiLPBalance, setEmojiLPBalance] = useState<bigint>();
  const [direction, setDirection] = useState<"add" | "remove">(
    searchParams.get("remove") !== null ? "remove" : "add"
  );
  const [showLiquidityPrompt, setShowLiquidityPrompt] = useState<boolean>(false);

  const { aptos, account, submit } = useAptos();

  const provideLiquidityResult = useSimulateProvideLiquidity({
    marketAddress: market?.marketAddress,
    quoteAmount: unfmtCoin(liquidity ?? 0),
  });

  const { emojicoin } = market ? toCoinTypes(market?.marketAddress) : { emojicoin: "" };

  const removeLiquidityResult = useSimulateRemoveLiquidity({
    marketAddress: market?.marketAddress,
    lpCoinAmount: unfmtCoin(lp ?? 0),
    typeTags: [emojicoin ?? ""],
  });

  const enoughApt =
    direction === "add"
      ? aptBalance !== undefined && aptBalance >= unfmtCoin(liquidity ?? 0)
      : true;
  const enoughEmoji =
    direction === "add"
      ? emojiBalance !== undefined &&
        emojiBalance >= BigInt(provideLiquidityResult?.base_amount ?? 0)
      : true;
  const enoughEmojiLP =
    direction === "remove"
      ? emojiLPBalance !== undefined && emojiLPBalance >= unfmtCoin(lp ?? 0)
      : true;

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
            setEmojiBalance(BigInt(emojicoin[0].toString()));
            setAptBalance(BigInt(apt[0].toString()));
            setEmojiLPBalance(BigInt(emojicoinLP[0].toString()));
          }
        }
      );
    } else if (account) {
      aptos
        .view({
          payload: {
            function: "0x1::coin::balance",
            typeArguments: ["0x1::aptos_coin::AptosCoin"],
            functionArguments: [account?.address],
          },
        })
        .then((res) => {
          if (res[0]) {
            setAptBalance(BigInt(res[0].toString()));
          }
        });
    }
  }, [market, account, aptos]);

  const isActionPossible =
    market !== undefined &&
    (direction === "add" ? liquidity !== "" : lp !== "") &&
    enoughApt &&
    enoughEmoji &&
    enoughEmojiLP;

  const aptInput = (
    <InnerWrapper id="apt" className="liquidity-input">
      <Column>
        <div className={grayLabel}>
          {direction === "add" ? "You deposit" : "You get"}{" "}
          {aptBalance !== undefined && (
            <>
              (balance: <span className={enoughApt ? "" : "text-error"}>{fmtCoin(aptBalance)}</span>
              )
            </>
          )}
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
              : fmtCoin(removeLiquidityResult?.quote_amount) ?? "Loading..."
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
          {direction === "add" ? "You deposit" : "You get"}{" "}
          {emojiBalance !== undefined && (
            <>
              (balance:{" "}
              <span className={enoughEmoji ? "" : "text-error"}>{fmtCoin(emojiBalance)}</span>)
            </>
          )}
        </div>
        <input
          className={inputAndOutputStyles + " bg-transparent leading-[32px]"}
          style={{
            color: theme.colors.lightGray + "99",
          }}
          value={
            direction === "add"
              ? fmtCoin(provideLiquidityResult?.base_amount) ?? "Loading..."
              : fmtCoin(removeLiquidityResult?.base_amount) ?? "Loading..."
          }
          type="text"
          disabled
        ></input>
      </Column>
      <EmojiInputLabel emoji={market ? market.symbol : "-"} />
    </InnerWrapper>
  );

  const emojiLPInput = (
    <InnerWrapper id="lp" className="liquidity-input">
      <Column>
        <div className={grayLabel}>
          {direction === "remove" ? "You deposit" : "You get"}{" "}
          {emojiLPBalance !== undefined && (
            <>
              (balance:{" "}
              <span className={enoughEmojiLP ? "" : "text-error"}>{fmtCoin(emojiLPBalance)}</span>)
            </>
          )}
        </div>
        <input
          className={inputAndOutputStyles + " bg-transparent leading-[32px]"}
          style={{
            color: direction === "add" ? theme.colors.lightGray + "99" : "white",
          }}
          value={
            direction === "add"
              ? fmtCoin(provideLiquidityResult?.lp_coin_amount) ?? "Loading..."
              : lp
          }
          type={direction === "add" ? "text" : "number"}
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
          <Flex position="relative" justifyContent="left" alignItems="baseline">
            <Text textScale="heading1" textTransform="uppercase" mb="16px">
              {t(direction === "add" ? "Add liquidity" : "Remove liquidity")}
            </Text>

            <div>
              <Image
                src={info}
                alt="info"
                className="ml-[.4em]"
                onTouchStart={() => setShowLiquidityPrompt(!showLiquidityPrompt)}
                onMouseEnter={() => setShowLiquidityPrompt(true)}
                onMouseLeave={() => setShowLiquidityPrompt(false)}
              />
              <Prompt
                text="Liquidity providers receive a 0.25% fee from all trades, proportional to their pool share. Fees are continuously reinvested in the pool and can be claimed by withdrawing liquidity."
                visible={showLiquidityPrompt}
                close={false}
                width={300}
                top={false}
              />
            </div>
          </Flex>

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
          <ButtonWithConnectWalletFallback>
            <Button
              scale="lg"
              disabled={!isActionPossible}
              style={{ cursor: isActionPossible ? "pointer" : "not-allowed" }}
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
                      quoteAmount: unfmtCoin(lp),
                      typeTags: [emojicoin, emojicoinLP],
                    });
                } else {
                  builderLambda = () =>
                    RemoveLiquidity.builder({
                      aptosConfig: aptos.config,
                      provider: account.address,
                      marketAddress: market!.marketAddress,
                      lpCoinAmount: unfmtCoin(lp),
                      typeTags: [emojicoin, emojicoinLP],
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
              {market ? fmtCoin(market.cpammRealReservesQuote) ?? "Loading..." : "-"}
            </Text>
          </Flex>

          <Flex
            p={{ _: "0px 12px 10px 12px", tablet: "0px 25px 18px 25px" }}
            justifyContent="space-between"
            alignItems="center"
          >
            <EmojiInputLabel emoji={market ? market.symbol : "-"} />

            <Text textScale={{ _: "bodySmall", tablet: "bodyLarge" }} textTransform="uppercase">
              {market ? fmtCoin(market.cpammRealReservesBase) ?? "Loading..." : "-"}
            </Text>
          </Flex>
        </StyledAddLiquidityWrapper>
      </Column>
    </Flex>
  );
};

export default Liquidity;
