"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useMatchBreakpoints } from "hooks";
import Button from "components/button";
import { Flex, FlexGap, Container } from "@containers";
import LogoIcon from "../svg/icons/LogoIcon";
import CloseIcon from "../svg/icons/Close";
import MenuItem from "components/header/components/menu-item";
import { MobileMenu } from "components/header/components/mobile-menu";
import { StyledContainer, StyledClickItem, StyledMobileHeader, StyledCloseIcon } from "./styled";
import { ROUTES } from "router/routes";
import { NAVIGATE_LINKS } from "./constants";
import { slideTopVariants } from "./animations";
import { type HeaderProps } from "./types";
import { translationFunction } from "context/language-context";
import WalletDropdownMenu from "components/wallet/WalletDropdownMenu";
import ButtonWithConnectWalletFallback from "./wallet-button/ConnectWalletButton";
import { useSearchParams } from "next/navigation";
import Link, { type LinkProps } from "next/link";
import { useEmojiPicker } from "context/emoji-picker-context";

const Header: React.FC<HeaderProps> = ({ isOpen, setIsOpen }) => {
  const { isDesktop } = useMatchBreakpoints();
  const { t } = translationFunction();
  const searchParams = useSearchParams();
  const linksForCurrentPage = NAVIGATE_LINKS;
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

  // When the user clicks the home page button, they probably expect the sort to be the same as it was before
  // they clicked. We reset the search bytes and the page here to nothing, which will resolve to their defaults.
  const linkProps: LinkProps = useMemo(() => {
    const sortParam = searchParams.get("sort");
    const query = sortParam ? { sort: sortParam } : {};
    return {
      href: {
        pathname: ROUTES.home,
        query,
      },
      onClick: () => {
        handleCloseMobileMenu();
        clear();
      },
    };
  }, [searchParams, handleCloseMobileMenu, clear]);

  return (
    <StyledContainer ref={headerRef}>
      <StyledMobileHeader
        initial="hidden"
        animate={isOpen ? "visible" : "hidden"}
        variants={slideTopVariants(offsetHeight)}
      >
        <Link className="mt-[6px]" {...linkProps}>
          <StyledClickItem>
            <LogoIcon width="170px" color="black" cursor="pointer" versionBadge={true} />
          </StyledClickItem>
        </Link>

        <StyledCloseIcon>
          <CloseIcon color="black" width="19px" onClick={handleCloseMobileMenu} />
        </StyledCloseIcon>
      </StyledMobileHeader>

      <Container>
        <Flex my="30px" justifyContent="space-between" alignItems="center">
          <Link className="ml-[50px]" {...linkProps}>
            <StyledClickItem>
              <LogoIcon width="170px" cursor="pointer" versionBadge={true} />
            </StyledClickItem>
          </Link>

          {isDesktop && (
            <FlexGap marginRight="50px" gap="24px" alignItems="center">
              {linksForCurrentPage.map(({ title, path, width }) => {
                return (
                  <Link
                    key={title}
                    href={path}
                    target={path.startsWith("https://") ? "_blank" : undefined}
                  >
                    <MenuItem width={width} title={title} />
                  </Link>
                );
              })}
              <ButtonWithConnectWalletFallback>
                <WalletDropdownMenu />
              </ButtonWithConnectWalletFallback>
            </FlexGap>
          )}

          {!isDesktop && (
            <Button marginRight="50px" scale="lg" onClick={() => setIsOpen(!isOpen)}>
              {t("Menu")}
            </Button>
          )}
        </Flex>
      </Container>
      <MobileMenu isOpen={isOpen} setIsOpen={setIsOpen} linksForCurrentPage={linksForCurrentPage} />
    </StyledContainer>
  );
};

export default Header;
