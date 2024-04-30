import React from "react";

import { Box, Flex, Text, Column, FlexGap, Button } from "components";
import { useTranslation } from "context";

import {
  StyledContentWrapper,
  StyledContentColumn,
  StyledContentHeader,
  StyledBlockWrapper,
  StyledInput,
  StyledArrowWrapper,
} from "./styled";
import { Arrow } from "../../components/svg";

const EmojicoinPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Box pt="120px">
      <Flex py="83px" justifyContent="space-around">
        <Column width="50%" px="44px">
          <Text textScale="display2" mb="4px">
            BLACK HEART
          </Text>

          <Text textScale="display2">🖤</Text>
        </Column>

        <Column width="50%">
          <FlexGap gap="8px">
            <Text textScale="display4" color="darkGrey" textTransform="uppercase">
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

      <StyledContentWrapper>
        <StyledContentColumn>
          <Column>
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
          </Column>

          <Column>
            <StyledContentHeader>
              <Text textScale="pixelHeading3" color="lightGrey" textTransform="uppercase">
                {t("Trade History")}
              </Text>
            </StyledContentHeader>

            <StyledBlockWrapper>
              <Text textScale="pixelHeading3" color="lightGrey" textTransform="uppercase">
                Table
              </Text>
            </StyledBlockWrapper>
          </Column>
        </StyledContentColumn>

        <Column width="40%">
          <Column>
            <StyledContentHeader>
              <Button scale="lg">{t("Provide liquidity")}</Button>
            </StyledContentHeader>

            <StyledBlockWrapper>
              <Column width="100%" maxWidth="414px" height="100%" justifyContent="center">
                <Text textScale="heading1" color="white" textTransform="uppercase" pb="17px">
                  {t("Trade Emojicoin")}
                </Text>

                <FlexGap gap="19px" position="relative" flexDirection="column">
                  <StyledInput>
                    <Text textScale="pixelHeading3">APT</Text>
                  </StyledInput>

                  <StyledArrowWrapper>
                    <Arrow width="18px" rotate="90deg" />
                  </StyledArrowWrapper>

                  <StyledInput>
                    <Text textScale="pixelHeading3">🖤</Text>
                  </StyledInput>
                </FlexGap>

                <Flex justifyContent="center" mt="14px">
                  <Button scale="lg">{t("Swap")}</Button>
                </Flex>
              </Column>
            </StyledBlockWrapper>
          </Column>

          <Column>
            <StyledContentHeader>
              <Text textScale="pixelHeading3" color="lightGrey" textTransform="uppercase">
                {t("Chat")}
              </Text>
            </StyledContentHeader>

            <Flex>
              <Text textScale="pixelHeading3" color="lightGrey" textTransform="uppercase">
                Chat
              </Text>
            </Flex>
          </Column>
        </Column>
      </StyledContentWrapper>
    </Box>
  );
};

export default EmojicoinPage;
