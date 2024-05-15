"use client";

import React from "react";

import { useThemeContext, useTranslation } from "context";

import { Flex, Column } from "@/containers";
import { Text, InputNumeric, InputGroup, Button, Prompt } from "components";

import { StyledAddLiquidityWrapper } from "./styled";

const Liquidity: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useThemeContext();

  return (
    <Flex width="100%" justifyContent="center" p="64px 33px">
      <Column width="100%" maxWidth="414px" justifyContent="center">
        <Text textScale="heading1" textTransform="uppercase" mb="16px">
          {t("Add liquidity")}
        </Text>

        <StyledAddLiquidityWrapper>
          <Flex p="7px 20px">
            <InputGroup isShowError={false} height="22px" scale="sm" pt="6px">
              <InputNumeric borderColor="transparent" p="0px !important" onUserInput={() => {}} />
            </InputGroup>

            <Text textScale="pixelHeading3" color="lightGrey" textTransform="uppercase">
              apt
            </Text>
          </Flex>

          <Flex p="7px 20px" borderTop={`1px solid ${theme.colors.darkGrey}`}>
            <InputGroup isShowError={false} height="22px" scale="sm" pt="6px">
              <InputNumeric borderColor="transparent" p="0px !important" onUserInput={() => {}} />
            </InputGroup>

            <Text textScale="pixelHeading3" color="lightGrey" textTransform="uppercase">
              🖤
            </Text>
          </Flex>
        </StyledAddLiquidityWrapper>

        <Flex width="100%" justifyContent="center" mb="37px" position="relative">
          <Prompt text="Liquidity providers receive a 0.25% fee from all trades, proportional to their pool share. Fees are continuously reinvested in the pool and can be claimed by withdrawing liquidity." />

          <Button scale="lg">{t("Add liquidity")}</Button>
        </Flex>

        <Text textScale="heading1" textTransform="uppercase" mb="16px">
          {t("Reserves")}
        </Text>

        <StyledAddLiquidityWrapper>
          <Flex p="18px 25px 7px 25px" justifyContent="space-between">
            <Text textScale="bodyLarge" textTransform="uppercase">
              apt
            </Text>

            <Text textScale="bodyLarge" textTransform="uppercase">
              11,111,111
            </Text>
          </Flex>

          <Flex p="0px 25px 18px 25px" justifyContent="space-between">
            <Text textScale="bodyLarge" textTransform="uppercase" textAlign="start">
              🖤
            </Text>

            <Text textScale="bodyLarge" textTransform="uppercase">
              111,111,111
            </Text>
          </Flex>
        </StyledAddLiquidityWrapper>
      </Column>
    </Flex>
  );
};

export default Liquidity;
