import React from "react";
import { useLocation } from "react-router-dom";
import { useScramble } from "use-scramble";

import { useMatchBreakpoints } from "hooks";

import { Container, Flex, FlexGap, Link, Text } from "components";
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

  const { ref, replay } = useScramble({
    text: "{ 05I34OT0ff9C }",
    overdrive: false,
    speed: 0.5,
  });

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
            <FlexGap gap="16px" alignItems="center">
              {linksForCurrentPage.map(({ title, path, width }) => {
                return <MenuItem width={width} key={title} title={title} path={path} />;
              })}

              <Flex onMouseOver={replay} cursor="pointer" onClick={walletHandler}>
                <Text
                  ref={ref}
                  textScale="pixelHeading4"
                  color="econiaBlue"
                  textTransform="uppercase"
                  fontSize="24px"
                  width="154px"
                  maxWidth="154px"
                  ellipsis
                />
              </Flex>
            </FlexGap>
          )}
        </Flex>
      </Container>
    </StyledContainer>
  );
};

export default Header;
