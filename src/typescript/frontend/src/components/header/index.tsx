"use client";

import Button from "components/button";
import MenuItem from "components/header/components/menu-item";
import { MobileMenu } from "components/header/components/mobile-menu";
import WalletDropdownMenu from "components/wallet/WalletDropdownMenu";
import { useEmojiPicker } from "context/emoji-picker-context";
import { translationFunction } from "context/language-context";
import Link, { type LinkProps } from "next/link";
import React, { useCallback, useMemo, useState } from "react";
import { ROUTES } from "router/routes";

import { Container, Flex } from "@/containers";

import { EXTERNAL_LINK_PROPS } from "../link/const";
import CloseIcon from "../svg/icons/Close";
import LogoIcon from "../svg/icons/LogoIcon";
import { slideTopVariants } from "./animations";
import { NAVIGATE_LINKS } from "./constants";
import { StyledClickItem, StyledCloseIcon, StyledContainer, StyledMobileHeader } from "./styled";
import type { HeaderProps } from "./types";
import ButtonWithConnectWalletFallback from "./wallet-button/ConnectWalletButton";

const Header = ({ isOpen, setIsOpen }: HeaderProps) => {
  const { t } = translationFunction();
  const clear = useEmojiPicker((s) => s.clear);

  const [offsetHeight, setOffsetHeight] = useState(0);

  const headerRef = useCallback((node: HTMLElement | null) => {
    if (node) {
      setOffsetHeight(node.offsetHeight);
    }
  }, []);

  const handleCloseMobileMenu = useCallback(() => {
    setIsOpen(false);
  }, [setIsOpen]);

  const linkProps: LinkProps = useMemo(() => {
    return {
      href: {
        pathname: ROUTES.home,
      },
      onClick: () => {
        handleCloseMobileMenu();
        clear();
      },
    };
  }, [handleCloseMobileMenu, clear]);

  return (
    <StyledContainer ref={headerRef}>
      <StyledMobileHeader
        initial="hidden"
        animate={isOpen ? "visible" : "hidden"}
        variants={slideTopVariants(offsetHeight)}
      >
        <Link className="mt-[6px]" {...linkProps}>
          <StyledClickItem>
            <LogoIcon width="170px" color="econiaBlue" cursor="pointer" versionBadge={true} />
          </StyledClickItem>
        </Link>

        <StyledCloseIcon>
          <CloseIcon color="econiaBlue" width="19px" onClick={handleCloseMobileMenu} />
        </StyledCloseIcon>
      </StyledMobileHeader>

      <Container>
        <Flex my="30px" justifyContent="space-between" alignItems="center">
          <Link className="ml-[50px]" {...linkProps}>
            <StyledClickItem>
              <LogoIcon width="170px" cursor="pointer" versionBadge={false} />
            </StyledClickItem>
          </Link>

          <div className="hidden lg:flex mr-[50px] gap-[24px] items-center">
            {NAVIGATE_LINKS.map(({ title, path }) => {
              return (
                <Link
                  key={title}
                  href={path}
                  {...(path.startsWith("https://") ? EXTERNAL_LINK_PROPS : {})}
                >
                  <MenuItem title={title} />
                </Link>
              );
            })}
            <ButtonWithConnectWalletFallback>
              <WalletDropdownMenu />
            </ButtonWithConnectWalletFallback>
          </div>

          <Button
            className="inline-flex lg:hidden"
            marginRight="50px"
            scale="lg"
            onClick={() => setIsOpen(!isOpen)}
          >
            {t("Menu")}
          </Button>
        </Flex>
      </Container>
      <MobileMenu isOpen={isOpen} setIsOpen={setIsOpen} linksForCurrentPage={NAVIGATE_LINKS} />
    </StyledContainer>
  );
};

export default Header;
