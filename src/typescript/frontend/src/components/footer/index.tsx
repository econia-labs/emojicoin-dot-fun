"use client";

import { Container, Flex, FlexGap } from "@containers";
import LogoIcon from "components/svg/icons/LogoIcon";
import { Text } from "components/text";
import { LINKS } from "lib/env";
import Link from "next/link";
import React from "react";
import { ROUTES } from "router/routes";

import { SocialLinks } from "./components/social-links";
import { StyledClickItem, StyledContainer, StyledSocialWrapper } from "./styled";

const Footer: React.FC = () => {
  return (
    <Container width="100%">
      <Flex justifyContent="center">
        <StyledContainer>
          <StyledSocialWrapper>
            <StyledClickItem>
              <LogoIcon width="170px" cursor="pointer" versionBadge={true} />
            </StyledClickItem>

            <FlexGap gap="12px">
              <SocialLinks />
            </FlexGap>
          </StyledSocialWrapper>

          <Flex alignItems="center">
            <Link href={LINKS?.tos ?? ROUTES["not-found"]}>
              <Text
                textScale="display6"
                $fontWeight="bold"
                fontSize={{ _: "8px", tablet: "15px" }}
                textTransform="uppercase"
                py={{ _: "16px", tablet: "24px" }}
              >
                TERMS OF USE
              </Text>
            </Link>
          </Flex>
        </StyledContainer>
      </Flex>
    </Container>
  );
};

export default Footer;
