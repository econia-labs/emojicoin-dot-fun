"use client";

import React from "react";
import { useMatchBreakpoints } from "hooks";

import Link from "components/link/component";
import Button from "components/button";
import { Flex, FlexGap, Container } from "@/containers";
import LogoIcon from "../svg/icons/LogoIcon";
import CloseIcon from "../svg/icons/Close";
import MenuItem from "components/header/components/menu-item";
import { MobileMenu } from "components/header/components/mobile-menu";
import { StyledContainer, StyledClickItem, StyledMobileHeader } from "./styled";

import { ROUTES } from "router/routes";
import { NAVIGATE_LINKS } from "./constants";
import { slideTopVariants } from "./animations";

import { type HeaderProps } from "./types";
import { useTranslation } from "context/language-context";

const Header: React.FC<HeaderProps> = ({ isOpen, setIsOpen }) => {
  const { isDesktop } = useMatchBreakpoints();
  const { t } = useTranslation();

  const walletHandler = () => {
    /* eslint-disable-next-line no-console */
    console.log("walletHandler");
  };

  const { offsetHeight } = document.getElementById("header") ?? { offsetHeight: 0 };

  const handleCloseMobileMenu = () => {
    setIsOpen(false);
  };

  return (
    <StyledContainer id="header">
      <StyledMobileHeader
        initial="hidden"
        animate={isOpen ? "visible" : "hidden"}
        variants={slideTopVariants(offsetHeight)}
      >
        <Link href={ROUTES.home} mt="6px" onClick={handleCloseMobileMenu}>
          <StyledClickItem>
            <LogoIcon width="170px" color="black" cursor="pointer" />
          </StyledClickItem>
        </Link>

        <CloseIcon color="black" width="19px" onClick={handleCloseMobileMenu} />
      </StyledMobileHeader>

      <Container>
        <Flex my="30px" justifyContent="space-between" alignItems="center">
          <Link href={ROUTES.home}>
            <StyledClickItem>
              <LogoIcon width="170px" cursor="pointer" />
            </StyledClickItem>
          </Link>

          {isDesktop && (
            <FlexGap gap="24px" alignItems="center">
              {NAVIGATE_LINKS.map(({ title, path, width }) => {
                return (
                  <Link key={title} href={path}>
                    <MenuItem width={width} title={title} />
                  </Link>
                );
              })}
              <MenuItem title="0x2634...faf9" width="120px" onClick={walletHandler} />
            </FlexGap>
          )}

          {!isDesktop && (
            <Button scale="lg" onClick={() => setIsOpen(!isOpen)}>
              {t("Menu")}
            </Button>
          )}
        </Flex>
      </Container>
      <MobileMenu
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        linksForCurrentPage={NAVIGATE_LINKS}
        offsetHeight={offsetHeight}
        walletHandler={walletHandler}
      />
    </StyledContainer>
  );
};

export default Header;
