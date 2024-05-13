import React from "react";

import { useHideOverflow } from "hooks";

import { MobileMenuInner, MobileMenuWrapper, StyledMotion } from "./styled";
import { Flex, Link } from "components";
import { MobileSocialLinks } from "./components";
import { MobileMenuItem } from "../index";

import { MobileMenuProps } from "./types";

import { slideVariants } from "./animations";

export const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  setIsOpen,
  linksForCurrentPage,
  offsetHeight,
  walletHandler,
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

          <MobileMenuItem title="05I34OT0ff9C" onClick={walletHandler} />
        </MobileMenuInner>

        <Flex position="absolute" bottom="60px" justifyContent="center" width="100%">
          <MobileSocialLinks />
        </Flex>
      </MobileMenuWrapper>
    </StyledMotion>
  );
};
