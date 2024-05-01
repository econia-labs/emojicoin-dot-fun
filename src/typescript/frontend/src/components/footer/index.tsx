import React from "react";

import { Container, FlexGap, Text, Flex } from "components";
import { SocialLinks } from "./components";
import { LogoIcon } from "components/svg";

import { StyledClickItem, StyledContainer, StyledSocialWrapper } from "./styled";

const Footer: React.FC = () => {
  return (
    <Container>
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

          <Text textScale="display6" $fontWeight="bold" textTransform="uppercase" py="25px">
            Copyright © 2024 | MADE WITH 🖤 BY | ALL RIGHTS RESERVED.
          </Text>
        </StyledContainer>
      </Flex>
    </Container>
  );
};

export default Footer;
