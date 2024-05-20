import React, { useEffect } from "react";

import { Flex } from "@/containers";
import { Text, Button } from "components";

import { useTranslation } from "context";

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
import { type ChartContainerProps } from "components/charts/types";
import dynamic from "next/dynamic";
// import { Chart } from "components/charts/private/Chart";

const Chart = dynamic(() => import("components/charts/private/Chart"), { ssr: false });
export interface DesktopGridProps extends ChartContainerProps {}

const DesktopGrid = (props: DesktopGridProps) => {
  const { t } = useTranslation();

  useEffect(() =>{
    console.log("isScriptReady", props.isScriptReady);
  }, [props.isScriptReady]);

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
              <Chart {...props} marketID={2} />
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
