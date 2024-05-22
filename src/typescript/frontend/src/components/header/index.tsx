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
import { StyledContainer, StyledClickItem, StyledMobileHeader, StyledCloseIcon } from "./styled";

import { ROUTES } from "router/routes";
import { NAVIGATE_LINKS } from "./constants";
import { slideTopVariants } from "./animations";

import { type HeaderProps } from "./types";
import { useTranslation } from "context/language-context";

import { usePathname } from "next/navigation";
import { showModal } from "store/modal";
import { type ModalProps } from "store/modal/types";
import { type WalletModalProps } from "../modal/components/wallet-modal/types";
import { useAppDispatch } from "store/store";

const Header: React.FC<HeaderProps> = ({ isOpen, setIsOpen }) => {
  const { isDesktop } = useMatchBreakpoints();
  const { t } = useTranslation();
  const pathname = usePathname();
  const dispatch = useAppDispatch();

  const currentPath = pathname.split("/")[1];
  const linksForCurrentPage = NAVIGATE_LINKS.filter(link => link.path !== currentPath);

  const walletHandler = () => {
    dispatch(
      (showModal as ModalProps<WalletModalProps>)({
        modalName: "walletModal",
        rootId: "modal",
        props: { items: [{ title: "Copy address" }, { title: "Disconnect" }] },
      }),
    );
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

        <StyledCloseIcon>
          <CloseIcon color="black" width="19px" onClick={handleCloseMobileMenu} />
        </StyledCloseIcon>
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
        linksForCurrentPage={linksForCurrentPage}
        offsetHeight={offsetHeight}
        walletHandler={walletHandler}
      />
    </StyledContainer>
  );
};

export default Header;
