"use client";

import React, { type PropsWithChildren, useEffect, useState } from "react";

import { useThemeContext } from "context";
import { translationFunction } from "context/language-context";

import { Flex, Column } from "@containers";
import { Text, Button, Prompt } from "components";

import { StyledAddLiquidityWrapper } from "./styled";
import { ProvideLiquidity } from "@sdk/emojicoin_dot_fun/emojicoin-dot-fun";
import { toCoinDecimalString } from "lib/utils/decimals";
import {
  AptosInputLabel,
  EmojiInputLabel,
} from "components/pages/emojicoin/components/trade-emojicoin/InputLabels";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { toActualCoinDecimals } from "lib/utils/decimals";
import { toCoinTypes } from "@sdk/markets/utils";
import ButtonWithConnectWalletFallback from "components/header/wallet-button/ConnectWalletButton";
import { useSimulateProvideLiquidity } from "lib/hooks/queries/use-simulate-provide-liquidity";
import type { FetchSortedMarketDataReturn } from "lib/queries/sorting/market-data";

type LiquidityProps = {
  market: FetchSortedMarketDataReturn["markets"][0] | undefined;
};

const InnerWrapper = ({ children, id }: PropsWithChildren<{ id: string }>) => (
  <div
    id={id}
    className={
      `flex justify-between px-[18px] py-[7px] items-center ` + `h-[55px] md:items-stretch`
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

  const [liquidity, setLiquidity] = useState<number>(0);
  const [aptBalance, setAptBalance] = useState<number>();
  const [emojiBalance, setEmojiBalance] = useState<number>();

  const { aptos, account, submit } = useAptos();

  const provideLiquidityResult = useSimulateProvideLiquidity({
    marketAddress: market?.marketAddress,
    quoteAmount: toActualCoinDecimals({ num: liquidity }),
  });

  const enoughAssets = (apt: number, emoji: number) =>
    aptBalance && emojiBalance && apt <= aptBalance && emoji <= emojiBalance;

  useEffect(() => {
    if (market) {
      const emojicoin = `${market.marketAddress.toString()}::coin_factory::Emojicoin`;
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
      Promise.all([aptosBalance, emojicoinBalance]).then(([apt, emojicoin]) => {
        if (apt[0] && emojicoin[0]) {
          setEmojiBalance(Number(emojicoin[0].toString()));
          setAptBalance(Number(apt[0].toString()));
        }
      });
    }
  }, [market, account, aptos]);

  return (
    <Flex width="100%" justifyContent="center" p={{ _: "64px 17px", mobileM: "64px 33px" }}>
      <Column width="100%" maxWidth="414px" justifyContent="center">
        <Text textScale="heading1" textTransform="uppercase" mb="16px">
          {t("Add liquidity")}
        </Text>

        <StyledAddLiquidityWrapper>
          <InnerWrapper id="apt">
            <Column>
              <div className={grayLabel}>You deposit</div>
              <input
                className={inputAndOutputStyles + " bg-transparent leading-[32px]"}
                onChange={(e) => setLiquidity(Number(e.target.value))}
                min={0}
                step={0.01}
                type="number"
              ></input>
            </Column>
            <AptosInputLabel />
          </InnerWrapper>
          <InnerWrapper id="emoji">
            <Column>
              <div className={grayLabel}>You deposit</div>
              <input
                className={inputAndOutputStyles + " bg-transparent leading-[32px]"}
                style={{
                  color: theme.colors.lightGray + "99",
                }}
                value={toCoinDecimalString(provideLiquidityResult ?? 0n, 4)}
                type="number"
                disabled
              ></input>
            </Column>
            <EmojiInputLabel emoji={market ? market.symbol : "-"} />
          </InnerWrapper>
        </StyledAddLiquidityWrapper>

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
                !liquidity ||
                !(provideLiquidityResult
                  ? enoughAssets(liquidity, Number(provideLiquidityResult))
                  : false)
              }
              onClick={async () => {
                if (!account) {
                  return;
                }
                const { emojicoin, emojicoinLP } = toCoinTypes(market!.marketAddress);
                const builderLambda = () =>
                  ProvideLiquidity.builder({
                    aptosConfig: aptos.config,
                    provider: account.address,
                    marketAddress: market!.marketAddress,
                    quoteAmount: BigInt(toActualCoinDecimals({ num: liquidity })),
                    typeTags: [emojicoin, emojicoinLP],
                  });
                await submit(builderLambda);
              }}
            >
              {t("Add liquidity")}
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
