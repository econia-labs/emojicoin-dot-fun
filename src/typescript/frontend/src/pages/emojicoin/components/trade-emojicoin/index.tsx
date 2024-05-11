import React, { useState } from "react";

import { Flex, Text, Column, Button, InputGroup, InputNumeric } from "components";
import { useTranslation } from "context";

import { StyledInputWrapper, StyledArrowWrapper, StyledInputContainer } from "./styled";
import { Arrow } from "components/svg";

const TradeEmojicoin: React.FC = () => {
  const [isForce, setIsForce] = useState(true);

  const { t } = useTranslation();

  const switchHandler = () => {
    setIsForce(!isForce);
  };

  return (
    <Column width="100%" maxWidth="414px" height="100%" justifyContent="center">
      <Text textScale="heading1" color="white" textTransform="uppercase" pb="17px">
        {t("Trade Emojicoin")}
      </Text>

      <StyledInputContainer isForce={isForce}>
        <StyledInputWrapper>
          <Column>
            <Text textScale="pixelHeading4" mb="-6px" color="lightGrey" lineHeight="20px" textTransform="uppercase">
              {t("You pay")}
            </Text>

            <InputGroup isShowError={false} height="22px" scale="sm">
              <InputNumeric borderColor="transparent" p="0px !important" onUserInput={() => {}} />
            </InputGroup>
          </Column>

          <Text textScale="pixelHeading3" color="lightGrey">
            APT
          </Text>
        </StyledInputWrapper>

        <StyledArrowWrapper onClick={switchHandler}>
          <Arrow width="18px" rotate={isForce ? "90deg" : "-90deg"} color="lightGrey" />
        </StyledArrowWrapper>

        <StyledInputWrapper>
          <Column>
            <Text textScale="pixelHeading4" mb="-6px" color="lightGrey" lineHeight="20px" textTransform="uppercase">
              {t("You receive")}
            </Text>

            <InputGroup isShowError={false} height="22px" scale="sm">
              <InputNumeric borderColor="transparent" p="0px !important" onUserInput={() => {}} />
            </InputGroup>
          </Column>

          <Text textScale="pixelHeading3" color="lightGrey">
            🖤
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
