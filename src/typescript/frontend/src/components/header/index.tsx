import React from "react";
import { useLocation } from "react-router-dom";

import { StyledContainer, StyledClickItem } from "./styled";
import { Container, Flex, FlexGap, Link, Button } from "components";
import { LogoIcon } from "../svg";
import { useMatchBreakpoints } from "hooks";
import { NAVIGATE_LINKS } from "./constants";
import { useTranslation } from "context";
import { ROUTES } from "../../router/routes";

const Header: React.FC = () => {
  const { t } = useTranslation();
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
            <FlexGap gap="16px">
              {linksForCurrentPage.map(({ title, path }) => {
                return (
                  <Link key={title} href={path}>
                    <Button scale="lg">{t(title)}</Button>
                  </Link>
                );
              })}

              <Button onClick={walletHandler} scale="lg">
                05I34OT0ff9C
              </Button>
            </FlexGap>
          )}
        </Flex>
      </Container>
    </StyledContainer>
  );
};

export default Header;
