import React from "react";
import { useLocation } from "react-router-dom";

import { useMatchBreakpoints } from "hooks";

import { Container, Flex, FlexGap, Link } from "components";
import { LogoIcon } from "../svg";
import { MenuItem } from "./components";
import { StyledContainer, StyledClickItem } from "./styled";

import { ROUTES } from "router/routes";
import { NAVIGATE_LINKS } from "./constants";

const Header: React.FC = () => {
  const { isDesktop } = useMatchBreakpoints();
  const { pathname } = useLocation();

  const currentPath = pathname.split("/")[1];
  const linksForCurrentPage = NAVIGATE_LINKS.filter(link => link.path !== currentPath);

  const walletHandler = () => {
    /* eslint-disable-next-line no-console */
    console.log("walletHandler");
  };

  return (
    <StyledContainer id="header">
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
        </Flex>
      </Container>
    </StyledContainer>
  );
};

export default Header;
