"use client";
import { StyledImage } from "components/image/styled";
import {
  HeaderWrapper,
  Container,
  HeaderContent,
  LogoContainer,
  NavbarLogo,
  NavContainer,
  MenuButton,
  MenuBar,
  Navigation,
  MenuList,
  MenuItem,
  MenuLink,
} from "./styled";

const HeaderComponent = (): JSX.Element => {
  return (
    <HeaderWrapper>
      <Container>
        <HeaderContent>
          <LogoContainer>
            <NavbarLogo href="/home">
              <StyledImage src="/images/logo.svg" alt="logo" className="header-logo w-[10px] h-[10px]" />
            </NavbarLogo>
          </LogoContainer>
          <NavContainer>
            <div className="mr-auto">
              <MenuButton id="navbarToggler">
                <MenuBar />
                <MenuBar />
                <MenuBar />
              </MenuButton>
              <Navigation id="navbarCollapse">
                <MenuList>
                  <MenuItem>
                    <MenuLink href="#">START</MenuLink>
                  </MenuItem>
                  <MenuItem>
                    <MenuLink href="#" className="text-primary">
                      CONNECT WALLET
                    </MenuLink>
                  </MenuItem>
                </MenuList>
              </Navigation>
            </div>
          </NavContainer>
        </HeaderContent>
      </Container>
    </HeaderWrapper>
  );
};

export default HeaderComponent;
