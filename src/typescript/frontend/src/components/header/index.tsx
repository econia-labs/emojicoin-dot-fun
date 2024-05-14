import React from "react";
import { useLocation } from "react-router-dom";

import { useMatchBreakpoints } from "hooks";
import { useTranslation } from "context";

import { Button, Container, Flex, FlexGap, Link } from "components";
import { LogoIcon, CloseIcon } from "../svg";
import { MenuItem, MobileMenu } from "./components";
import { StyledContainer, StyledClickItem, StyledMobileHeader } from "./styled";

import { ROUTES } from "router/routes";
import { NAVIGATE_LINKS } from "./constants";
import { slideTopVariants } from "./animations";

import { HeaderProps } from "./types";

const Header: React.FC<HeaderProps> = ({ isOpen, setIsOpen }) => {
  const { isDesktop } = useMatchBreakpoints();
  const { pathname } = useLocation();
  const { t } = useTranslation();

  const currentPath = pathname.split("/")[1];
  const linksForCurrentPage = NAVIGATE_LINKS.filter(link => link.path !== currentPath);

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
              {linksForCurrentPage.map(({ title, path, width }) => {
                return (
                  <Link key={title} href={path}>
                    <MenuItem width={width} title={title} />
                  </Link>
                );
              })}

              <MenuItem title="05I34OT0ff9C" width="120px" onClick={walletHandler} />
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
        linksForCurrentPage={linksForCurrentPage}
        offsetHeight={offsetHeight}
        walletHandler={walletHandler}
      />
    </StyledContainer>
  );
};

export default Header;
