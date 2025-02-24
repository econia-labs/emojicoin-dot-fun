import styled from "styled-components";
import Link from "next/link";

export const HeaderWrapper = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  z-index: 40;
  display: flex;
  width: 100%;
  align-items: center;
`;

export const Container = styled.div`
  width: 100%;
  margin: 0 auto;
  padding: 0 2.5rem !important;

  @media (min-width: 1024px) {
    padding: 0 5rem !important;
  }
`;

export const HeaderContent = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const LogoContainer = styled.div`
  max-width: 100%;
  padding: 0 1rem;
`;

export const NavbarLogo = styled(Link)`
  display: block;
  width: 100%;
  padding: 1.25rem 0;
`;

export const NavContainer = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: flex-end;
  padding: 0 1rem;
  position: relative;
  z-index: 40;
`;

export const MenuButton = styled.button`
  position: relative;
  right: 1rem;
  padding: 6px 0.75rem;
  border-radius: 0.5rem;
  display: block;
  transform: translateY(-50%);

  @media (min-width: 1024px) {
    display: none;
  }

  &:focus {
    ring: 2;
    ring-color: primary;
  }
`;

export const MenuBar = styled.span`
  position: relative;
  display: block;
  height: 2px;
  width: 30px;
  margin: 6px 0;
  background-color: white;
`;

export const Navigation = styled.nav`
  position: absolute;
  right: 0;
  top: 100%;
  z-index: 40;
  width: 100%;
  padding: 1.25rem 0;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  display: none;

  @media (min-width: 1024px) {
    position: static;
    display: block;
    width: 100%;
    max-width: 100%;
    background: transparent;
    padding: 0 1rem;
    box-shadow: none;
  }
`;

export const MenuList = styled.ul`
  display: block;

  @media (min-width: 1024px) {
    display: flex;
  }
`;

export const MenuItem = styled.li`
  position: relative;
  padding: 0 1.25rem;
`;

export const MenuLink = styled.a`
  display: flex;
  font-size: 1rem;
  font-weight: 600;
  color: white;

  @media (min-width: 1024px) {
    display: inline-flex;
    padding: 0;
    color: rgb(229 231 235);
    margin-right: 0;

    &:hover {
      color: blue;
      opacity: 0.7;
    }
  }
`;

// FOOTER STYLES
export const FooterWrapper = styled.footer`
  position: relative;
  z-index: 10;
  margin-top: 3rem;
  background-color: var(--primary);
  animation: fadeInUp;
  animation-delay: 0.15s;
`;

export const FooterContent = styled.div`
  margin-top: 1.25rem;
  padding-top: 1.25rem;
  padding-bottom: 1.25rem;
`;

export const TextWrapper = styled.div`
  margin-top: 0.25rem;
  margin-bottom: 0.25rem;
`;

export const FooterText = styled.p`
  text-align: center;
  color: white;
  font-size: 1rem;

  a {
    color: inherit;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;
