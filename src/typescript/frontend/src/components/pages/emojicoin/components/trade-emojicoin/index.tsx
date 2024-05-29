"use client";

import React, { useState } from "react";

import { Flex, Column } from "@containers";
import { Text, Button, InputGroup, InputNumeric } from "components";

import { translationFunction } from "context/language-context";

import { StyledInputWrapper, StyledArrowWrapper, StyledInputContainer } from "./styled";
import { Arrow } from "components/svg";
import { type TradeEmojicoinProps } from "../../types";
import AptosIconBlack from "components/svg/icons/AptosBlack";

const TradeEmojicoin = (props: TradeEmojicoinProps) => {
  const [isForce, setIsForce] = useState(true);

  const { t } = translationFunction();

  const switchHandler = () => {
    setIsForce(!isForce);
  };

  return (
    <Column width="100%" maxWidth="414px" height="100%" justifyContent="center">
      <Text textScale={{ _: "heading2", tablet: "heading1" }} color="white" textTransform="uppercase" pb="17px">
        {t("Trade Emojicoin")}
      </Text>

      <StyledInputContainer isForce={isForce}>
        <StyledInputWrapper>
          <Column>
            <Text textScale="pixelHeading4" mb="-6px" color="lightGray" lineHeight="20px" textTransform="uppercase">
              {t("You pay")}
            </Text>

            <InputGroup isShowError={false} height="22px" scale="sm">
              <InputNumeric borderColor="transparent" p="0px !important" onUserInput={() => {}} />
            </InputGroup>
          </Column>

          <Text textScale={{ _: "pixelHeading4", tablet: "pixelHeading3" }} color="lightGray">
            <AptosIconBlack style={{ marginTop: 5, marginRight: 3 }} height="27px" width="27px" />
          </Text>
        </StyledInputWrapper>

        <StyledArrowWrapper onClick={switchHandler}>
          <Arrow width="18px" rotate={isForce ? "90deg" : "-90deg"} color="lightGray" />
        </StyledArrowWrapper>

        <StyledInputWrapper>
          <Column>
            <Text textScale="pixelHeading4" mb="-6px" color="lightGray" lineHeight="20px" textTransform="uppercase">
              {t("You receive")}
            </Text>

            <InputGroup isShowError={false} height="22px" scale="sm">
              <InputNumeric borderColor="transparent" p="0px !important" onUserInput={() => {}} />
            </InputGroup>
          </Column>

          <Text
            textScale="pixelHeading3"
            fontSize={{ _: "24px", tablet: "30px" }}
            lineHeight="34px"
            pt="6px"
            color="lightGray"
          >
            {props.data.emoji.emoji}
          </Text>
        </StyledInputWrapper>
      </StyledInputContainer>

      <Flex justifyContent="center" mt="14px">
        <Button scale="lg">{t("Swap")}</Button>
      </Flex>
    </Column>
  );
};

export default TradeEmojicoin;
