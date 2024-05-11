import React from "react";

import { Flex, Text, Column, FlexGap } from "components";
import { useTranslation } from "context";
import { useTooltip } from "../../../../hooks";

const MainInfo: React.FC = () => {
  const { t } = useTranslation();

  const { targetRef: targetRefEmojiName, tooltip: tooltipEmojiName } = useTooltip(undefined, {
    placement: "top",
    isEllipsis: true,
  });

  return (
    <Flex justifyContent="center">
      <Flex py="83px" justifyContent="space-around" width="100%" maxWidth="1362px">
        <Column width="60%" px="44px" justifyContent="space-between">
          <Text textScale="display2" ellipsis ref={targetRefEmojiName}>
            BLACK HEART
          </Text>
          {tooltipEmojiName}

          <Text textScale="display2">🖤</Text>
        </Column>

        <Column width="40%" px="5%">
          <FlexGap gap="8px">
            <Text textScale="display4" color="lightGrey" textTransform="uppercase">
              {t("Mkt. Cap:")}
            </Text>
            <Text textScale="display4">11.11M</Text>
          </FlexGap>

          <FlexGap gap="8px">
            <Text textScale="display4" color="lightGrey" textTransform="uppercase">
              {t("24 hour vol:")}
            </Text>
            <Text textScale="display4">11.11M</Text>
          </FlexGap>

          <FlexGap gap="8px">
            <Text textScale="display4" color="lightGrey" textTransform="uppercase">
              {t("All-time vol:")}
            </Text>
            <Text textScale="display4">11.11M</Text>
          </FlexGap>
        </Column>
      </Flex>
    </Flex>
  );
};

export default MainInfo;
