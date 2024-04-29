import React from "react";

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

  const walletHandler = () => {
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
              {NAVIGATE_LINKS.map(({ title, path }) => {
                return (
                  <Link key={title} href={path}>
                    <Button>{t(title)}</Button>
                  </Link>
                );
              })}

              <Button onClick={walletHandler}>05I34OT0ff9C</Button>
            </FlexGap>
          )}
        </Flex>
      </Container>
    </StyledContainer>
  );
};

export default Header;
