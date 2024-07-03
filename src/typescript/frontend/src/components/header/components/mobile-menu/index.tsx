import React from "react";

import { useHideOverflow } from "@hooks/use-hide-overflow";

import { MobileMenuInner, MobileMenuWrapper, StyledMotion } from "./styled";
import { Link } from "components/link";
import { Flex } from "@containers";
import { MobileSocialLinks } from "./components/mobile-social-links";
import { MobileMenuItem } from "../index";

import { type MobileMenuProps } from "./types";

import { slideVariants } from "./animations";
import ButtonWithConnectWalletFallback from "components/header/wallet-button/ConnectWalletButton";

export const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  setIsOpen,
  linksForCurrentPage,
  offsetHeight,
}) => {
  useHideOverflow({ trigger: isOpen });

  const handleCloseMobileMenu = () => {
    setIsOpen(false);
  };

  return (
    <StyledMotion
      initial="hidden"
      animate={isOpen ? "visible" : "hidden"}
      variants={slideVariants}
      offsetHeight={offsetHeight}
    >
      <MobileMenuWrapper offsetHeight={offsetHeight}>
        <MobileMenuInner>
          {linksForCurrentPage.map(({ title, path }) => {
            return (
              <Link key={title} href={path} onClick={handleCloseMobileMenu} width="100%">
                <MobileMenuItem title={title} />
              </Link>
            );
          })}

          <ButtonWithConnectWalletFallback className="w-full" mobile={true} />
        </MobileMenuInner>

        <Flex position="absolute" bottom="60px" justifyContent="center" width="100%">
          <MobileSocialLinks />
        </Flex>
      </MobileMenuWrapper>
    </StyledMotion>
  );
};
