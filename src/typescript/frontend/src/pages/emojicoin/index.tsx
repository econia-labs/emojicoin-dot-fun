import React from "react";

import { Box, Flex, Text, Button } from "components";
import { useTranslation } from "context";

import {
  StyledContentWrapper,
  StyledContentColumn,
  StyledContentHeader,
  StyledBlockWrapper,
  StyledContentInner,
  StyledBlock,
} from "./styled";

import { MainInfo, TradeEmojicoin, TradeHistory } from "./components";

const EmojicoinPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Box pt="120px">
      <MainInfo />

      <StyledContentWrapper>
        <StyledContentInner>
          <StyledContentColumn width="60%">
            <StyledBlock id="1111">
              <StyledContentHeader>
                <Text textScale="pixelHeading3" color="lightGrey" textTransform="uppercase">
                  {t("Price Chart")}
                </Text>
              </StyledContentHeader>

              <StyledBlockWrapper>
                <Text textScale="pixelHeading3" color="lightGrey" textTransform="uppercase">
                  Chart
                </Text>
              </StyledBlockWrapper>
            </StyledBlock>

            <StyledBlock id="2222">
              <StyledContentHeader>
                <Text textScale="pixelHeading3" color="lightGrey" textTransform="uppercase">
                  {t("Trade History")}
                </Text>
              </StyledContentHeader>

              <StyledBlockWrapper>
                <TradeHistory />
              </StyledBlockWrapper>
            </StyledBlock>
          </StyledContentColumn>

          <StyledContentColumn width="40%">
            <StyledBlock id="3333">
              <StyledContentHeader>
                <Flex width="100%" justifyContent="center">
                  <Button scale="lg">{t("Provide liquidity")}</Button>
                </Flex>
              </StyledContentHeader>

              <StyledBlockWrapper>
                <TradeEmojicoin />
              </StyledBlockWrapper>
            </StyledBlock>

            <StyledBlock id="4444">
              <StyledContentHeader>
                <Text textScale="pixelHeading3" color="lightGrey" textTransform="uppercase">
                  {t("Chat")}
                </Text>
              </StyledContentHeader>

              <StyledBlockWrapper>
                <Text textScale="pixelHeading3" color="lightGrey" textTransform="uppercase">
                  Chat
                </Text>
              </StyledBlockWrapper>
            </StyledBlock>
          </StyledContentColumn>
        </StyledContentInner>
      </StyledContentWrapper>
    </Box>
  );
};

export default EmojicoinPage;
