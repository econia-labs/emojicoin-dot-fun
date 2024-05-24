import React from "react";

import { Flex } from "@/containers";
import { Text, Button } from "components";

import { translationFunction } from "context/language-context";

import {
  StyledContentWrapper,
  StyledContentColumn,
  StyledContentHeader,
  StyledBlockWrapper,
  StyledContentInner,
  StyledBlock,
} from "./styled";

import Chat from "../chat";
import TradeEmojicoin from "../trade-emojicoin";
import TradeHistory from "../trade-history";

const DesktopGrid: React.FC = () => {
  const { t } = translationFunction();

  return (
    <StyledContentWrapper>
      <StyledContentInner>
        <StyledContentColumn>
          <StyledBlock width="57%">
            <StyledContentHeader>
              <Text
                textScale={{ _: "pixelHeading4", tablet: "pixelHeading3" }}
                color="lightGrey"
                textTransform="uppercase"
              >
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
  );
};

export default DesktopGrid;
