"use client";

import LogoIcon from "components/svg/icons/LogoIcon";
import { LINKS } from "lib/env";
import Link from "next/link";
import React from "react";
import { EXTERNAL_LINKS } from "router/external-links";
import { ROUTES } from "router/routes";

import { Container, Flex, FlexGap } from "@/containers";

import MenuItem from "../header/components/menu-item";
import { EXTERNAL_LINK_PROPS } from "../link";
import { SocialLinks } from "./components/social-links";
import { StyledClickItem } from "./styled";

const Footer: React.FC = () => {
  return (
    <Container className="w-full">
      <Flex justifyContent="center">
        <div className="flex w-full flex-col items-center justify-between max-w-[1108px]">
          <div className="flex py-6 md:py-12 w-full items-center justify-between border-b border-solid border-dark-gray">
            <StyledClickItem>
              <LogoIcon width="170px" cursor="pointer" versionBadge={true} />
            </StyledClickItem>

            <FlexGap gap="12px">
              <Link href={EXTERNAL_LINKS.docs} {...EXTERNAL_LINK_PROPS}>
                <MenuItem title={"docs"} />
              </Link>
              <SocialLinks />
            </FlexGap>
          </div>

          <Link href={LINKS?.tos ?? ROUTES["not-found"]}>
            <p className="uppercase font-bold py-4 md:py-6 text-[8px] md:text-[15px] font-forma line-he leading-[20px]">
              TERMS OF USE
            </p>
          </Link>
        </div>
      </Flex>
    </Container>
  );
};

export default Footer;
