"use client";

import React from "react";

import { useThemeContext } from "context";
import { translationFunction } from "context/language-context";

import { Flex, Column } from "@containers";
import { Text, InputNumeric, InputGroup, Button, Prompt } from "components";

import { StyledAddLiquidityWrapper } from "./styled";

const Liquidity: React.FC = () => {
  const { t } = translationFunction();
  const { theme } = useThemeContext();

  return (
    <Flex width="100%" justifyContent="center" p={{ _: "64px 17px", mobileM: "64px 33px" }}>
      <Column width="100%" maxWidth="414px" justifyContent="center">
        <Text textScale={{ _: "heading2", tablet: "heading1" }} textTransform="uppercase" mb="16px">
          {t("Add liquidity")}
        </Text>

        <StyledAddLiquidityWrapper>
          <Flex p={{ _: "10px 20px", tablet: "7px 20px" }}>
            <InputGroup isShowError={false} height="22px" scale="sm" mt={{ _: "-3px", tablet: "6px" }}>
              <InputNumeric borderColor="transparent" p="0px !important" onUserInput={() => {}} />
            </InputGroup>

            <Text
              textScale={{ _: "pixelHeading4", tablet: "pixelHeading3" }}
              color="lightGray"
              textTransform="uppercase"
            >
              apt
            </Text>
          </Flex>

          <Flex p={{ _: "0px 20px", tablet: "5px 20px" }} borderTop={`1px solid ${theme.colors.darkGray}`}>
            <InputGroup isShowError={false} height="22px" scale="sm" pt={{ _: "3px", tablet: "6px" }}>
              <InputNumeric borderColor="transparent" p="0px !important" onUserInput={() => {}} />
            </InputGroup>

            <Text
              textScale="pixelHeading3"
              fontSize={{ _: "24px", tablet: "32px" }}
              color="lightGray"
              textTransform="uppercase"
              pt="4px"
            >
              🖤
            </Text>
          </Flex>
        </StyledAddLiquidityWrapper>

        <Flex width="100%" justifyContent="center" mb={{ _: "17px", tablet: "37px" }} position="relative">
          <Prompt text="Liquidity providers receive a 0.25% fee from all trades, proportional to their pool share. Fees are continuously reinvested in the pool and can be claimed by withdrawing liquidity." />

          <Button scale="lg">{t("Add liquidity")}</Button>
        </Flex>

        <Text textScale={{ _: "heading2", tablet: "heading1" }} textTransform="uppercase" mb="16px">
          {t("Reserves")}
        </Text>

        <StyledAddLiquidityWrapper>
          <Flex p={{ _: "10px 12px 7px 10px", tablet: "18px 25px 7px 25px" }} justifyContent="space-between">
            <Text textScale={{ _: "bodySmall", tablet: "bodyLarge" }} textTransform="uppercase">
              apt
            </Text>

            <Text textScale={{ _: "bodySmall", tablet: "bodyLarge" }} textTransform="uppercase">
              11,111,111
            </Text>
          </Flex>

          <Flex p={{ _: "0px 12px 10px 12px", tablet: "0px 25px 18px 25px" }} justifyContent="space-between">
            <Text textScale={{ _: "bodySmall", tablet: "bodyLarge" }} textTransform="uppercase" textAlign="start">
              🖤
            </Text>

            <Text textScale={{ _: "bodySmall", tablet: "bodyLarge" }} textTransform="uppercase">
              111,111,111
            </Text>
          </Flex>
        </StyledAddLiquidityWrapper>
      </Column>
    </Flex>
  );
};

export default Liquidity;
