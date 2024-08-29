"use client";

import React from "react";
import Link from "next/link";

import { Container, FlexGap, Flex } from "@containers";
import { Text } from "components/text";

import { SocialLinks } from "./components/social-links";
import LogoIcon from "components/svg/icons/LogoIcon";

import { StyledClickItem, StyledContainer, StyledSocialWrapper } from "./styled";
import { LINKS } from "lib/env";
import { ROUTES } from "router/routes";

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
            <Link href={LINKS?.tos ?? ROUTES.notFound}>
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
