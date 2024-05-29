"use client";

import React from "react";

import { useMatchBreakpoints } from "hooks";
import { Container, FlexGap, Flex } from "@containers";
import { Text } from "components/text";

import { SocialLinks } from "./components/social-links";
import LogoIcon from "components/svg/icons/LogoIcon";
import EconiaLabsLogoIcon from "components/svg/icons/EconiaLabsLogoIcon";

import { StyledClickItem, StyledContainer, StyledSocialWrapper } from "./styled";

const Footer: React.FC = () => {
  const { isMobile } = useMatchBreakpoints();

  return (
    <Container width="100%">
      <Flex justifyContent="center">
        <StyledContainer>
          <StyledSocialWrapper>
            <StyledClickItem>
              <LogoIcon width="170px" cursor="pointer" />
            </StyledClickItem>

            <FlexGap gap="12px">
              <SocialLinks />
            </FlexGap>
          </StyledSocialWrapper>

          <Flex alignItems="center">
            <Text
              textScale="display6"
              $fontWeight="bold"
              fontSize={{ _: "8px", tablet: "15px" }}
              textTransform="uppercase"
              py={{ _: "16px", tablet: "24px" }}
            >
              Copyright © 2024 | MADE WITH 🖤 BY
            </Text>

            <EconiaLabsLogoIcon width={isMobile ? "57px" : "105px"} mx="4px" pb="2px" />

            <Text
              textScale="display6"
              $fontWeight="bold"
              fontSize={{ _: "8px", tablet: "15px" }}
              textTransform="uppercase"
              py={{ _: "16px", tablet: "24px" }}
            >
              | ALL RIGHTS RESERVED.
            </Text>
          </Flex>
        </StyledContainer>
      </Flex>
    </Container>
  );
};

export default Footer;
