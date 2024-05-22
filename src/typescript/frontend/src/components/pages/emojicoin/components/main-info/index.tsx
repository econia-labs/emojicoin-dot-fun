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
        py={{ _: "17px", tablet: "37px", laptopL: "68px" }}
        justifyContent="space-around"
        flexDirection={{ _: "column", tablet: "row" }}
        px={{_: "30px", laptopL: "44px"}}
        width="100%"
        maxWidth="1362px"
      >
        <FlexGap
          gap={{_: "12px", tablet: "4px"}}
          width={{ _: "100%", tablet: "58%", laptopL: "65%" }}
          flexDirection={{ _: "row", tablet: "column" }}
          justifyContent={{ _: "", tablet: "space-between" }}
          mb="8px"
        >
          <Text textScale={{ _: "display4", tablet: "display2" }} ellipsis ref={targetRefEmojiName}>
            BLACK HEART
          </Text>
          {tooltipEmojiName}

          <Text textScale={{ _: "display4", tablet: "display2" }} fontSize="24px">🖤</Text>
        </FlexGap>

        <Column width={{ _: "100%", tablet: "42%", laptopL: "35%" }} mt="-8px">
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
