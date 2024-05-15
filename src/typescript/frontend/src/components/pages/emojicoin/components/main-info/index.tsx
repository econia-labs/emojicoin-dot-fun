import React from "react";

import { Flex, Column, FlexGap } from "@/containers";
import { Text } from "components/text";
import { useTranslation } from "context";
import { useTooltip } from "hooks";

const MainInfo: React.FC = () => {
  const { t } = useTranslation();

  const { targetRef: targetRefEmojiName, tooltip: tooltipEmojiName } = useTooltip(undefined, {
    placement: "top",
    isEllipsis: true,
  });

  return (
    <Flex justifyContent="center">
      <Flex
        py={{ _: "37px", tablet: "66px", laptopL: "83px" }}
        justifyContent="space-around"
        flexDirection={{ _: "column", tablet: "row" }}
        width="100%"
        maxWidth="1362px"
      >
        <FlexGap
          gap="12px"
          width={{ _: "100%", tablet: "60%" }}
          px={{ _: "30px", laptopL: "44px" }}
          flexDirection={{ _: "row", tablet: "column" }}
          justifyContent={{ _: "", tablet: "space-between" }}
        >
          <Text textScale={{ _: "display4", tablet: "display2" }} ellipsis ref={targetRefEmojiName}>
            BLACK HEART
          </Text>
          {tooltipEmojiName}

          <Text textScale={{ _: "display4", tablet: "display2" }}>🖤</Text>
        </FlexGap>

        <Column width={{ _: "100%", tablet: "40%" }} px={{ _: "30px", laptopL: "5%" }}>
          <FlexGap gap="8px">
            <Text textScale={{ _: "display6", tablet: "display4" }} color="lightGrey" textTransform="uppercase">
              {t("Mkt. Cap:")}
            </Text>
            <Text textScale={{ _: "display6", tablet: "display4" }}>11.11M</Text>
          </FlexGap>

          <FlexGap gap="8px">
            <Text textScale={{ _: "display6", tablet: "display4" }} color="lightGrey" textTransform="uppercase">
              {t("24 hour vol:")}
            </Text>
            <Text textScale={{ _: "display6", tablet: "display4" }}>11.11M</Text>
          </FlexGap>

          <FlexGap gap="8px">
            <Text textScale={{ _: "display6", tablet: "display4" }} color="lightGrey" textTransform="uppercase">
              {t("All-time vol:")}
            </Text>
            <Text textScale={{ _: "display6", tablet: "display4" }}>11.11M</Text>
          </FlexGap>
        </Column>
      </Flex>
    </Flex>
  );
};

export default MainInfo;
