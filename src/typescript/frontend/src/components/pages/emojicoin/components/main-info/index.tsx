import React from "react";

import { Flex, Column, FlexGap } from "@containers";
import { translationFunction } from "context/language-context";
import { useTooltip } from "hooks";
import { StyledHeaderEmoji, StyledHeaderText, StyledStatsText } from "./styled";
import { toCoinDecimalString } from "lib/utils/decimals";
import AptosIconBlack from "components/svg/icons/AptosBlack";
import { type MainInfoProps } from "../../types";

const MainInfo = (props: MainInfoProps) => {
  const { t } = translationFunction();

  const { targetRef: targetRefEmojiName, tooltip: tooltipEmojiName } = useTooltip(undefined, {
    placement: "top",
    isEllipsis: true,
  });

  return (
    <Flex justifyContent="center">
      <Flex
        py={{ _: "17px", tablet: "37px", laptopL: "68px" }}
        justifyContent="space-around"
        flexDirection={{ _: "column", tablet: "row" }}
        px={{ _: "30px", laptopL: "44px" }}
        width="100%"
        maxWidth="1362px"
      >
        <FlexGap
          gap={{ _: "12px", tablet: "4px" }}
          width={{ _: "100%", tablet: "58%", laptopL: "65%" }}
          flexDirection={{ _: "row", tablet: "column" }}
          justifyContent={{ _: "", tablet: "space-between" }}
          mb="8px"
        >
          <StyledHeaderText ellipsis ref={targetRefEmojiName}>
            {props.data.name}
          </StyledHeaderText>
          {tooltipEmojiName}

          <StyledHeaderEmoji>{props.data.emoji}</StyledHeaderEmoji>
        </FlexGap>

        <Column width={{ _: "100%", tablet: "42%", laptopL: "35%" }} mt="-8px">
          <FlexGap gap="8px">
            <StyledStatsText
              textScale={{ _: "display6", tablet: "display4" }}
              color="lightGray"
              textTransform="uppercase"
            >
              {t("Mkt. Cap:")}
            </StyledStatsText>
            <StyledStatsText textScale={{ _: "display6", tablet: "display4" }}>
              {toCoinDecimalString(props.data.marketCap, 2)}
              &nbsp;
              <AptosIconBlack className={"icon-inline"} />
            </StyledStatsText>
          </FlexGap>

          <FlexGap gap="8px">
            <StyledStatsText
              textScale={{ _: "display6", tablet: "display4" }}
              color="lightGray"
              textTransform="uppercase"
            >
              {t("24 hour vol:")}
            </StyledStatsText>
            <StyledStatsText textScale={{ _: "display6", tablet: "display4" }}>
              {toCoinDecimalString(props.data.dailyVolume, 2)}
              &nbsp;
              <AptosIconBlack className={"icon-inline"} />
            </StyledStatsText>
          </FlexGap>

          <FlexGap gap="8px">
            <StyledStatsText
              textScale={{ _: "display6", tablet: "display4" }}
              color="lightGray"
              textTransform="uppercase"
            >
              {t("All-time vol:")}
            </StyledStatsText>
            <StyledStatsText textScale={{ _: "display6", tablet: "display4" }}>
              {toCoinDecimalString(props.data.allTimeVolume, 2)}
              &nbsp;
              <AptosIconBlack className={"icon-inline"} />
            </StyledStatsText>
          </FlexGap>
        </Column>
      </Flex>
    </Flex>
  );
};

export default MainInfo;
