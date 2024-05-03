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

import { Chat, MainInfo, TradeEmojicoin, TradeHistory } from "./components";

const EmojicoinPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Box pt="120px">
      <MainInfo />

      <StyledContentWrapper>
        <StyledContentInner>
          <StyledContentColumn>
            <StyledBlock width="57%">
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

            <StyledBlock width="43%">
              <StyledContentHeader>
                <Flex width="100%" justifyContent="center">
                  <Button scale="lg">{t("Provide liquidity")}</Button>
                </Flex>
              </StyledContentHeader>

              <StyledBlockWrapper>
                <TradeEmojicoin />
              </StyledBlockWrapper>
            </StyledBlock>
          </StyledContentColumn>

          <StyledContentColumn>
            <StyledBlock width="57%">
              <StyledContentHeader>
                <Text textScale="pixelHeading3" color="lightGrey" textTransform="uppercase">
                  {t("Trade History")}
                </Text>
              </StyledContentHeader>

              <StyledBlockWrapper>
                <TradeHistory />
              </StyledBlockWrapper>
            </StyledBlock>

            <StyledBlock width="43%">
              <StyledContentHeader>
                <Text textScale="pixelHeading3" color="lightGrey" textTransform="uppercase">
                  {t("Chat")}
                </Text>
              </StyledContentHeader>

              <StyledBlockWrapper>
                <Chat />
              </StyledBlockWrapper>
            </StyledBlock>
          </StyledContentColumn>
        </StyledContentInner>
      </StyledContentWrapper>
    </Box>
  );
};

export default EmojicoinPage;
