import React from "react";

import { useTranslation } from "context/language-context";
import useTooltip from "hooks/use-tooltip";
import { Column, Flex, FlexGap } from "@/containers";
import { Text } from "components/text";
import Image from "components/image";
import { StyledEmoji } from "./styled";

const MainCard: React.FC = () => {
  const { t } = useTranslation();

  const { targetRef: targetRefEmojiName, tooltip: tooltipEmojiName } = useTooltip(undefined, {
    placement: "top",
    isEllipsis: true,
  });

  return (
    <Flex justifyContent="center" width="100%" my={{ _: "20px", tablet: "70px" }} maxWidth="1295px">
      <Flex
        alignItems="center"
        justifyContent="space-between"
        maxWidth="100%"
        flexDirection={{ _: "column", tablet: "row" }}
      >
        <Flex alignItems="center" position="relative">
          <Image
            src="/images/planet.webp"
            aspectRatio={1.4}
            width={{ _: "460px", tablet: "340px", laptopL: "650px" }}
            ml={{ _: "12px", tablet: "-45px" }}
            alt="Planet"
          />

          <StyledEmoji
            pt="32px"
            textAlign="center"
            fontSize={{ _: "75px", laptopL: "128px" }}
            textScale="pixelDisplay1"
          >
            🖤
          </StyledEmoji>
        </Flex>

        <Column maxWidth="100%">
          <Text textScale="pixelHeading1" color="darkGrey">
            01
          </Text>
          <Text
            textScale={{ _: "display2", laptopL: "display1" }}
            mb={{ _: "8px", tablet: "0px" }}
            ref={targetRefEmojiName}
            ellipsis
            maxWidth="653px"
          >
            BLACK HEART
          </Text>
          {tooltipEmojiName}

          <FlexGap gap="8px">
            <Text
              textScale={{ _: "display5", tablet: "display4" }}
              lineHeight={{ _: "20px", tablet: "48px" }}
              color="darkGrey"
              textTransform="uppercase"
              mb={{ _: "6px", tablet: "0px" }}
            >
              {t("Mkt. Cap:")}
            </Text>
            <Text
              textScale={{ _: "display5", tablet: "display4" }}
              lineHeight={{ _: "20px", tablet: "48px" }}
              mb={{ _: "6px", tablet: "0px" }}
            >
              11.11M
            </Text>
          </FlexGap>

          <FlexGap gap="8px">
            <Text
              textScale={{ _: "display5", tablet: "display4" }}
              lineHeight={{ _: "20px", tablet: "48px" }}
              color="darkGrey"
              textTransform="uppercase"
              mb={{ _: "6px", tablet: "0px" }}
            >
              {t("24 hour vol:")}
            </Text>
            <Text
              textScale={{ _: "display5", tablet: "display4" }}
              lineHeight={{ _: "20px", tablet: "48px" }}
              mb={{ _: "6px", tablet: "0px" }}
            >
              11.11M
            </Text>
          </FlexGap>

          <FlexGap gap="8px">
            <Text
              textScale={{ _: "display5", tablet: "display4" }}
              lineHeight={{ _: "20px", tablet: "48px" }}
              color="darkGrey"
              textTransform="uppercase"
              mb={{ _: "6px", tablet: "0px" }}
            >
              {t("All-time vol:")}
            </Text>
            <Text
              textScale={{ _: "display5", tablet: "display4" }}
              lineHeight={{ _: "20px", tablet: "48px" }}
              mb={{ _: "6px", tablet: "0px" }}
            >
              11.11M
            </Text>
          </FlexGap>
        </Column>
      </Flex>
    </Flex>
  );
};

export default MainCard;
