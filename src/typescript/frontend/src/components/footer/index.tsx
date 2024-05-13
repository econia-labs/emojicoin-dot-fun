import React from "react";

import { useMatchBreakpoints } from "hooks";

import { Container, FlexGap, Text, Flex } from "components";
import { SocialLinks } from "./components";
import { LogoIcon, EconiaLabsLogoIcon } from "components/svg";

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
              py="25px"
            >
              Copyright © 2024 | MADE WITH 🖤 BY
            </Text>

            <EconiaLabsLogoIcon width={isMobile ? "57px" : "105px"} mx="4px" pb="2px" />

            <Text
              textScale="display6"
              $fontWeight="bold"
              fontSize={{ _: "8px", tablet: "15px" }}
              textTransform="uppercase"
              py="25px"
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
