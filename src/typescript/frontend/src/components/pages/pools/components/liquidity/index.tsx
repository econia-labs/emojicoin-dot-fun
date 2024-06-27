"use client";

import React, { useEffect, useState } from "react";

import { useThemeContext } from "context";
import { translationFunction } from "context/language-context";

import { Flex, Column } from "@containers";
import { Text, InputNumeric, InputGroup, Button, Prompt } from "components";

import { StyledAddLiquidityWrapper } from "./styled";
import { ProvideLiquidity } from "@sdk/emojicoin_dot_fun/emojicoin-dot-fun";
import type fetchSortedMarketData from "lib/queries/sorting/market-data";
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

type LiquidityProps = {
  market: Awaited<ReturnType<typeof fetchSortedMarketData>>["markets"][0] | undefined;
};

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
  }, [market]);

  return (
    <Flex width="100%" justifyContent="center" p={{ _: "64px 17px", mobileM: "64px 33px" }}>
      <Column width="100%" maxWidth="414px" justifyContent="center">
        <Text textScale="heading1" textTransform="uppercase" mb="16px">
          {t("Add liquidity")}
        </Text>

        <StyledAddLiquidityWrapper>
          <Flex p={{ _: "10px 20px", tablet: "7px 20px" }}>
            <InputGroup
              isShowError={false}
              height="22px"
              scale="sm"
              mt={{ _: "-3px", tablet: "6px" }}
            >
              <InputNumeric
                borderColor="transparent"
                p="0px !important"
                onUserInput={(e) => {
                  setLiquidity(Number(e));
                }}
              />
            </InputGroup>
            <AptosInputLabel />
          </Flex>

          <Flex
            p={{ _: "0px 20px", tablet: "5px 20px" }}
            borderTop={`1px solid ${theme.colors.darkGray}`}
          >
            <InputGroup
              isShowError={false}
              height="22px"
              scale="sm"
              pt={{ _: "-3px", tablet: "6px" }}
            >
              <InputNumeric
                disabled
                borderColor="transparent"
                p="0px !important"
                onUserInput={() => {}}
                value={toCoinDecimalString(provideLiquidityResult ?? 0n, 4)}
              />
            </InputGroup>

            {market ? (
              <EmojiInputLabel emoji={market.symbol} />
            ) : (
              <Text textScale="pixelHeading3" color="lightGray" textTransform="uppercase" pt="4px">
                -
              </Text>
            )}
          </Flex>
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
            {market ? <EmojiInputLabel emoji={market.symbol} /> : "-"}

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
